from typing import Union
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uuid
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
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

class MovieInteraction(BaseModel):
    user_id: str
    movie_id: int
    action: str  # "like" or "dislike"

class UserMovie(BaseModel):
    user_id: str
    movie_id: int

class RemoveFromList(BaseModel):
    user_id: str
    movie_id: int
    list_type: str  # "watchlist" or "watched"
    

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

    return {
        "message": "Success",
        "user_id": existing_user.user_id,
        "username": existing_user.user_name,
        "has_embedding": existing_user.user_embedding is not None
    }


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




@app.get("/generateRecommendations")
def generate_recommendations(user_id: str):
    recommendations = []
    with SessionLocal() as session:
        user = session.query(Users).filter_by(user_id=user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get watched movies to exclude
        watched_ids = []
        if user.watchlist_id:
            watchlist = session.query(WatchList).filter_by(watchlist_id=user.watchlist_id).first()
            if watchlist and watchlist.data:
                watched_ids = watchlist.data.get("watched", [])
        
        # If user has no embedding, return random movies (excluding watched)
        if not user.user_embedding:
            movies = session.query(Movies).all()
            available_movies = [m for m in movies if m.movie_id not in watched_ids]
            random_movies = random.sample(available_movies, min(30, len(available_movies)))
            return [
                {
                    "movie_id": m.movie_id,
                    "movie_name": m.movie_name,
                    "cosine_score": 0,
                    "backdrop_path": m.backdrop_path,
                }
                for m in random_movies
            ]
        
        # User has embedding, generate personalized recommendations
        all_movies = session.query(Movies).all()
        user_vector = np.array(user.user_embedding)
        
        # Check dimension consistency with the first movie (if any)
        if all_movies:
            first_movie_dim = len(all_movies[0].embeddings)
            if len(user_vector) != first_movie_dim:
                print(f"Warning: User embedding dimension ({len(user_vector)}) mismatch with movie ({first_movie_dim}). Resetting user embedding.")
                user.user_embedding = None
                session.commit()
                # Fallback to random behavior
                movies = session.query(Movies).all()
                available_movies = [m for m in movies if m.movie_id not in watched_ids]
                random_movies = random.sample(available_movies, min(200, len(available_movies)))
                
                random_recs = [
                    {
                        "movie_id": m.movie_id,
                        "movie_name": m.movie_name,
                        "cosine_score": 0,
                        "backdrop_path": m.backdrop_path,
                        "release_year": m.release_year
                    }
                    for m in random_movies
                ]
                # Sort by release year descending (newer first)
                return sorted(random_recs, key=lambda x: (x['release_year'] if x['release_year'] is not None else 0), reverse=True)

        user_vector_magnitude = np.linalg.norm(user_vector)
        
        for movie in all_movies:
            # Skip watched movies
            if movie.movie_id in watched_ids:
                continue
                
            movie_vector = np.array(movie.embeddings)
            
            # Skip movies with incompatible embedding dimensions
            if len(movie_vector) != len(user_vector):
                continue

            movie_vector_magnitude = np.linalg.norm(movie_vector)
            
            if user_vector_magnitude == 0 or movie_vector_magnitude == 0:
                cosine_similarity = 0.0
            else:
                dot_vector = np.dot(user_vector, movie_vector)
                cosine_similarity = dot_vector / (user_vector_magnitude * movie_vector_magnitude)
                
                # Handle potential floating point errors resulting in NaN
                if np.isnan(cosine_similarity):
                    cosine_similarity = 0.0

            movie_rec = {
                "movie_id": movie.movie_id,
                "movie_name": movie.movie_name,
                "cosine_score": float(cosine_similarity),
                "backdrop_path": movie.backdrop_path,
                "release_year": movie.release_year
            }
            recommendations.append(movie_rec)
        
        # Sort by score first to get the best 200 candidates
        sorted_by_score = sorted(recommendations, key=lambda x: x['cosine_score'], reverse=True)
        top_candidates = sorted_by_score[:200]
        
        # Sort the top candidates by release year descending (newer first)
        final_recommendations = sorted(top_candidates, key=lambda x: (x['release_year'] if x['release_year'] is not None else 0), reverse=True)
        
        return final_recommendations



@app.get("/getWatchlist")
def get_watchlist(user_id: str):
    """
    Get user's watchlist and watched movies.
    """
    with SessionLocal() as session:
        user = session.query(Users).filter_by(user_id=user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if not user.watchlist_id:
            return {"movies": [], "watched": []}
        
        watchlist = session.query(WatchList).filter_by(watchlist_id=user.watchlist_id).first()
        if not watchlist or not watchlist.data:
            return {"movies": [], "watched": []}
        
        watchlist_data = watchlist.data
        
        # Fetch movie details for watchlist
        watchlist_movies = []
        for movie_id in watchlist_data.get("movies", []):
            movie = session.query(Movies).filter_by(movie_id=movie_id).first()
            if movie:
                watchlist_movies.append({
                    "movie_id": movie.movie_id,
                    "movie_name": movie.movie_name,
                    "backdrop_path": movie.backdrop_path,
                })
        
        # Fetch movie details for watched
        watched_movies = []
        for movie_id in watchlist_data.get("watched", []):
            movie = session.query(Movies).filter_by(movie_id=movie_id).first()
            if movie:
                watched_movies.append({
                    "movie_id": movie.movie_id,
                    "movie_name": movie.movie_name,
                    "backdrop_path": movie.backdrop_path,
                })
        
        return {"movies": watchlist_movies, "watched": watched_movies}

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
def add_to_watchlist(data: UserMovie):
    """
    Add a movie to user's watchlist.
    """
    with SessionLocal() as session:
        user = session.query(Users).filter_by(user_id=data.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        movie = session.query(Movies).filter_by(movie_id=data.movie_id).first()
        if not movie:
            raise HTTPException(status_code=404, detail="Movie not found")
        
        # Get or create watchlist
        if user.watchlist_id:
            watchlist = session.query(WatchList).filter_by(watchlist_id=user.watchlist_id).first()
        else:
            watchlist = WatchList(data={"movies": [], "watched": []})
            session.add(watchlist)
            session.commit()
            session.refresh(watchlist)
            user.watchlist_id = watchlist.watchlist_id
            session.commit()
        
        # Add movie to watchlist
        current_data = dict(watchlist.data) if watchlist.data else {"movies": [], "watched": []}
        if "movies" not in current_data:
            current_data["movies"] = []
        
        if data.movie_id not in current_data["movies"]:
            current_data["movies"].append(data.movie_id)
            watchlist.data = current_data
            flag_modified(watchlist, "data")
            session.commit()
        
        return {"message": "Added to watchlist", "movie_id": data.movie_id}


@app.post("/markWatched")
def mark_watched(data: UserMovie):
    """
    Mark a movie as already watched.
    """
    with SessionLocal() as session:
        user = session.query(Users).filter_by(user_id=data.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        movie = session.query(Movies).filter_by(movie_id=data.movie_id).first()
        if not movie:
            raise HTTPException(status_code=404, detail="Movie not found")
        
        # Get or create watchlist
        if user.watchlist_id:
            watchlist = session.query(WatchList).filter_by(watchlist_id=user.watchlist_id).first()
        else:
            watchlist = WatchList(data={"movies": [], "watched": []})
            session.add(watchlist)
            session.commit()
            session.refresh(watchlist)
            user.watchlist_id = watchlist.watchlist_id
            session.commit()
        
        # Add movie to watched list
        current_data = dict(watchlist.data) if watchlist.data else {"movies": [], "watched": []}
        if "watched" not in current_data:
            current_data["watched"] = []
        
        if data.movie_id not in current_data["watched"]:
            current_data["watched"].append(data.movie_id)
            watchlist.data = current_data
            flag_modified(watchlist, "data")
            session.commit()
        
        return {"message": "Marked as watched", "movie_id": data.movie_id}


@app.post("/removeFromList")
def remove_from_list(data: RemoveFromList):
    """
    Remove a movie from watchlist or watched list.
    """
    with SessionLocal() as session:
        user = session.query(Users).filter_by(user_id=data.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if not user.watchlist_id:
            return {"message": "No watchlist found", "success": False}
        
        watchlist = session.query(WatchList).filter_by(watchlist_id=user.watchlist_id).first()
        if not watchlist or not watchlist.data:
            return {"message": "No watchlist data found", "success": False}
        
        current_data = dict(watchlist.data)
        list_key = "movies" if data.list_type == "watchlist" else "watched"
        
        if list_key in current_data and data.movie_id in current_data[list_key]:
            current_data[list_key].remove(data.movie_id)
            watchlist.data = current_data
            flag_modified(watchlist, "data")
            session.commit()
            return {"message": f"Removed from {data.list_type}", "success": True}
        
        return {"message": "Movie not found in list", "success": False}


@app.put("/rate")
async def rate(rate: RatingRequest, db: Session = Depends(get_db)):
    try:
        message = rate_the_movie(
            db=db, score=rate.score, user_id=rate.user_id, movie_id=rate.movie_id
        )
        return message
    except HTTPException:
        raise


@app.post("/updateEmbedding")
def update_embedding(interaction: MovieInteraction):
    """
    Update user embedding based on like/dislike interaction.
    - Like: Move user embedding toward the movie embedding
    - Dislike: Move user embedding away from the movie embedding
    """
    with SessionLocal() as session:
        user = session.query(Users).filter_by(user_id=interaction.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        movie = session.query(Movies).filter_by(movie_id=interaction.movie_id).first()
        if not movie:
            raise HTTPException(status_code=404, detail="Movie not found")
        
        movie_embedding = np.array(movie.embeddings)
        
        # If user has no embedding yet, or dimensions mismatch, initialize with the movie embedding
        if not user.user_embedding or len(user.user_embedding) != len(movie_embedding):
            if interaction.action == "like":
                user.user_embedding = movie_embedding.tolist()
            else:
                # For dislike, we start with a neutral/zero embedding
                user.user_embedding = np.zeros_like(movie_embedding).tolist()
        else:
            user_embedding = np.array(user.user_embedding)
            
            # Learning rate (how much each interaction affects the embedding)
            learning_rate = 0.2
            
            if interaction.action == "like":
                # Move toward the movie embedding
                new_embedding = user_embedding + learning_rate * (movie_embedding - user_embedding)
            else:
                # Move away from the movie embedding
                new_embedding = user_embedding - learning_rate * (movie_embedding - user_embedding)
            
            # Normalize to prevent the embedding from growing too large
            norm = np.linalg.norm(new_embedding)
            if norm > 0:
                new_embedding = new_embedding / norm * np.linalg.norm(user_embedding)
            
            user.user_embedding = new_embedding.tolist()
        
        session.commit()

        # Add to watched list so it doesn't show up again
        if user.watchlist_id:
            watchlist = session.query(WatchList).filter_by(watchlist_id=user.watchlist_id).first()
        else:
            watchlist = WatchList(data={"movies": [], "watched": []})
            session.add(watchlist)
            session.commit()
            session.refresh(watchlist)
            user.watchlist_id = watchlist.watchlist_id
            session.commit()
        
        current_data = dict(watchlist.data) if watchlist.data else {"movies": [], "watched": []}
        if "watched" not in current_data:
            current_data["watched"] = []
        
        if interaction.movie_id not in current_data["watched"]:
            current_data["watched"].append(interaction.movie_id)
            watchlist.data = current_data
            flag_modified(watchlist, "data")
            session.commit()
        
        return {
            "message": f"Embedding updated for {interaction.action}",
            "has_embedding": True
        }


@app.post("/admin/importMovies")
def import_movies_from_csv(limit: int = 10000):
    """
    Import movies from TMDB CSV dataset.
    Avoids duplicates by checking existing movie_ids.
    """
    import pandas as pd
    import hashlib
    
    def generate_simple_embedding(text, dim=128):
        """Generate a simple hash-based embedding."""
        text_hash = hashlib.sha256(text.encode()).hexdigest()
        seed = int(text_hash[:8], 16)
        np.random.seed(seed)
        embedding = np.random.randn(dim)
        embedding = embedding / np.linalg.norm(embedding)
        return embedding.tolist()
    
    try:
        df = pd.read_csv('TMDB_movie_dataset_v11.csv', nrows=limit)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="CSV file not found")
    
    with SessionLocal() as session:
        # Get existing movie IDs
        existing_ids = set(
            movie.movie_id for movie in session.query(Movies.movie_id).all()
        )
        
        added_count = 0
        skipped_count = 0
        
        for idx, row in df.iterrows():
            movie_id = int(row['id']) if pd.notna(row['id']) else None
            
            if movie_id is None or movie_id in existing_ids:
                skipped_count += 1
                continue
            
            title = str(row['title']) if pd.notna(row['title']) else "Unknown"
            genres = str(row['genres']) if pd.notna(row['genres']) else ""
            
            backdrop = ""
            if 'poster_path' in df.columns and pd.notna(row.get('poster_path')):
                backdrop = str(row['poster_path'])
            elif 'backdrop_path' in df.columns and pd.notna(row.get('backdrop_path')):
                backdrop = str(row['backdrop_path'])
            
            keywords = str(row['keywords']) if 'keywords' in df.columns and pd.notna(row.get('keywords')) else ""
            overview = str(row['overview']) if 'overview' in df.columns and pd.notna(row.get('overview')) else ""
            
            # Extract release year
            release_year = None
            if 'release_date' in df.columns and pd.notna(row.get('release_date')):
                try:
                    date_str = str(row['release_date'])
                    release_year = int(date_str.split('-')[0])
                except Exception:
                    pass
            
            # Filter: Only import movies from 2005 onwards
            if release_year is None or release_year < 2005:
                skipped_count += 1
                continue

            embedding_text = f"{title} {genres} {keywords} {overview}"
            embedding = generate_simple_embedding(embedding_text)
            
            movie = Movies(
                movie_id=movie_id,
                movie_name=title[:255],
                genres=genres[:255],
                backdrop_path=backdrop[:100] if backdrop else "",
                embeddings=embedding,
                release_year=release_year
            )
            
            session.add(movie)
            added_count += 1
            existing_ids.add(movie_id)
            
            if added_count % 500 == 0:
                session.commit()
        
        session.commit()
        
        return {
            "message": "Import complete",
            "added": added_count,
            "skipped": skipped_count
        }
