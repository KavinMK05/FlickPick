from database import get_db, Base, engine , SessionLocal
from sentence_transformers import SentenceTransformer
from models import Movies

model = SentenceTransformer("all-MiniLM-L6-v2")

with SessionLocal() as session:
    to_be_updated_records = session.query(Movies).all()
    # print(to_be_updated_records)

    for movie in to_be_updated_records:
        print("Movie name: ",movie.movie_name)
        print("Movie Genres: ",movie.genres)
        print("\n")
        new_string = movie.movie_name + movie.genres
        embedding = model.encode(new_string)
        movie.embeddings = embedding.tolist()
        session.commit()

