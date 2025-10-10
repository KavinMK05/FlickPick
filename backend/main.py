from typing import Union
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uuid
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db, Base, engine
from models import Users, Recommendations, WatchList, Movies, Ratings
from database import SessionLocal
import random
import numpy as np


Base.metadata.create_all(bind=engine)

app = FastAPI()

origins = ["http://localhost:3000", "http://192.168.1.7:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class UserCreate(BaseModel):
    username: str
    password: str
    repassword: str


class UserLogin(BaseModel):
    username: str
    password: str


class RatingRequest(BaseModel):
    user_id: str
    movie_id: int
    score: int

class Movie(BaseModel):
    movie_id:int
    movie_name:str
    

SelectedMovies = list[Movie]

def recommendation_engine(db: Session, user_id: str):
    existing_recommendations = (
        db.query(Recommendations).filter_by(user_id=user_id).first()
    )
    if not existing_recommendations:
        return None
    else:
        return existing_recommendations


def rate_the_movie(db: Session, user_id: str, movie_id: int, score: int):
    new_rate = Ratings(rate=score, user_id=user_id, movie_id=movie_id)

    db.add(new_rate)
    try:
        db.commit()
        db.refresh(new_rate)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="The operation was unsuccessful")
    return new_rate


# Login function
def user_login(db: Session, username: str, password: str):
    existing_user = db.query(Users).filter((Users.user_name == username)).first()
    if not existing_user:
        raise HTTPException(status_code=400, detail="Username does not exist")
    if password != existing_user.password:
        raise HTTPException(status_code=400, detail="Username or Password is incorrect")

    return {"message": "Success"}


# Create account
def create_user(db: Session, username: str, password: str, repassword: str):
    existing_user = db.query(Users).filter((Users.user_name == username)).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Username or Email already exists")

    if password != repassword:
        raise HTTPException(status_code=400, detail="Passwords don't match")

    user_id = str(uuid.uuid4())

    new_user = Users(user_name=username, password=password, user_id=user_id)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.get("/")
def read_root():
    return {"Hello": "World"}


# @app.get("/items/{item_id}")
# def read_item(item_id: int, q: Union[str, None] = None):
#     return {"item_id": item_id, "q": q}


# User registeration endpoint
@app.post("/register")
async def register(user: UserCreate, db: Session = Depends(get_db)):
    try:
        db_user = create_user(db, user.username, user.password, user.repassword)
        return db_user
    except HTTPException:
        raise


# Login endpoint
@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    try:
        auth_message = user_login(db, username=user.username, password=user.password)
        return auth_message
    except HTTPException:
        raise


@app.get("/getRecommendations")
def get_recommendations():

    
    return None

@app.get("/generateRecommendations")
def generate_recommendations():
    recommendations = []
    test_user_id = "29c9bdff-ad30-42a7-946f-23fa0a10c19b"
    with SessionLocal() as session:
        all_movies = session.query(Movies).all()
        user = session.query(Users).filter_by(user_id = test_user_id).first()
        user_embed = user.user_embedding
        user_vector = np.array(user_embed)
        user_vector_magnitude = np.linalg.norm(user_vector)
        for movie in all_movies:
            movie_vector = np.array(movie.embeddings)
            movie_vector_magnitude = np.linalg.norm(movie_vector)
            dot_vector = np.dot(user_vector,movie_vector)
            cosine_similarity = dot_vector / (user_vector_magnitude*movie_vector_magnitude)

            movie_rec = {
                "movie_id":movie.movie_id,
                "movie_name":movie.movie_name,
                "cosine_score":cosine_similarity
            }
            recommendations.append(movie_rec)
        sorted_recommendations = sorted(recommendations,key=lambda user:user['cosine_score'],reverse=True)
        return sorted_recommendations

    return None 



@app.get("/getWatchlist")
def get_watchlist():
    return None

@app.post("/createUserLikes")
def set_userLikes(selected_movies:SelectedMovies):
    all_selected_movies = []
    test_user_id = "29c9bdff-ad30-42a7-946f-23fa0a10c19b"
    
    with SessionLocal() as session:
        user = session.query(Users).filter_by(user_id = test_user_id).first()
        
        user_embed = user.user_embedding
        if(not user_embed):
            for i in selected_movies:
                data = session.query(Movies).filter_by(movie_id=i.movie_id).first()
                all_selected_movies.append(data)
            
            all_embeddings = [movie.embeddings for movie in all_selected_movies]

            embeddings_array = np.array(all_embeddings)

            average_embedding = np.mean(embeddings_array,axis=0)
            
            user.user_embedding= average_embedding.tolist()

            session.commit()
            return "Sucess"
        else:
            return "User embed already exists"

        

        



@app.get("/getRandomMovies")
def get_random_movies():

    with SessionLocal() as session:
        movies = session.query(Movies).all()
        random_movies = random.sample(movies, 10)

        return random_movies

    return HTTPException(status_code=500, detail="Database error")


@app.post("/addToWatchlist")
def add_to_watchlist():
    return None


@app.put("/rate")
async def rate(rate: RatingRequest, db: Session = Depends(get_db)):
    try:
        message = rate_the_movie(
            db=db, score=rate.score, user_id=rate.user_id, movie_id=rate.movie_id
        )
        return message
    except HTTPException:
        raise
