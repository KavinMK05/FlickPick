from typing import Union
from fastapi import Depends, FastAPI, HTTPException
import uuid
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db , Base, engine
from models import Users,Recommendations,WatchList,Movies,Ratings

Base.metadata.create_all(bind=engine)

app= FastAPI()
class UserCreate(BaseModel):
    username:str
    password: str
    repassword:str

class UserLogin(BaseModel):
    username:str
    password:str

class RatingRequest(BaseModel):
    user_id:str
    movie_id: int
    score: int

def recommendation_engine(db:Session,user_id:str):
    existing_recommendations = db.query(Recommendations).filter_by(user_id=user_id).first()
    if not existing_recommendations:
        return None
    else:
        return existing_recommendations

def rate_the_movie(db:Session,user_id:str,movie_id:int, score:int):
    new_rate = Ratings(
        rate=score,
        user_id=user_id,
        movie_id=movie_id
    )
    
    
    db.add(new_rate)
    try:
        db.commit()
        db.refresh(new_rate)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500,detail="The operation was unsuccessful")
    return new_rate

# Login function
def user_login(db:Session,username:str,password:str):
    existing_user = db.query(Users).filter((Users.user_name==username)).first()
    if not existing_user:
        raise HTTPException(status_code=400,detail="Username does not exist")
    if (password!=existing_user.password):
        raise HTTPException(status_code=400,detail="Username or Password is incorrect")
    
    return {"message":"Success"}
# Create account 
def create_user(db:Session,username:str,password:str,repassword:str):
    existing_user = db.query(Users).filter((Users.user_name==username)).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Username or Email already exists")
    
    if (password!=repassword):
        raise HTTPException(status_code=400,detail="Passwords don't match")

    user_id = str(uuid.uuid4())

    new_user = Users(user_name=username, password=password,user_id=user_id)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.get("/")
def read_root():
    return {"Hello":"World"}

# @app.get("/items/{item_id}")
# def read_item(item_id: int, q: Union[str, None] = None):
#     return {"item_id": item_id, "q": q}

# User registeration endpoint
@app.post("/register")
async def register(user:UserCreate,db:Session= Depends(get_db)):
    try:
        db_user = create_user(db, user.username, user.password,user.repassword)
        return db_user
    except HTTPException:
        raise

# Login endpoint
@app.post("/login")
def login(user:UserLogin,db:Session=Depends(get_db)):
    try:
        auth_message = user_login(db,username=user.username,password=user.password)
        return auth_message
    except HTTPException:
        raise

@app.get("/getRecommendations")
def get_recommendations():
    return None 

@app.get("/getWatchlist")
def get_watchlist():
    return None


@app.post("/addToWatchlist")
def add_to_watchlist():
    return None

@app.put("/rate")
async def rate(rate: RatingRequest,db:Session=Depends(get_db)):
    try:
        message = rate_the_movie(db=db,score=rate.score,user_id=rate.user_id,movie_id=rate.movie_id)
        return message
    except HTTPException:
        raise



