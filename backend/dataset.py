# import pandas as pd
# from sqlalchemy import create_engine , text
# from database import engine

# COLUMN_MAP = {
#     'id':'movie_id',
#     'title':'movie_name',
#     'backdrop_path':'backdrop_path',
#     'genres':'genres',
# }

# df = pd.read_csv('TMDB_movie_dataset_v11.csv',usecols=list(COLUMN_MAP.keys()),dtype={'id':'Int64'})
# filtered_data = df.rename(columns=COLUMN_MAP)
# first_100_movies= filtered_data.head(100)

# first_100_movies.to_sql(
#     name="movies",
#     con=engine,
#     if_exists="append",
#     index=False,
#     chunksize=1000,
#     method="multi"
# )

# with engine.connect() as connection:
#     result = connection.execute(text("SELECT COUNT(*) FROM movies"))
#     row_count = result.fetchone()[0]
#     print(f"Total records in table: {row_count}")

import asyncio
import aiohttp
from database import SessionLocal
from models import Movies
import os

# Securely load API key (recommended: set TMDB_API_KEY environment variable)
API_KEY = os.getenv('TMDB_API_KEY', '1530245b6d2f56ede41d670e34f8768d')  # Replace with env var in production

async def fetch_with_retry(session, url, max_retries=3):
    """Helper to fetch with exponential backoff."""
    for attempt in range(max_retries):
        try:
            async with session.get(url) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    print(f"HTTP {response.status} for {url}")
                    if attempt == max_retries - 1:
                        raise aiohttp.ClientError(f"Failed after {max_retries} attempts")
        except (aiohttp.ClientError, asyncio.TimeoutError) as e:
            wait_time = (2 ** attempt) + (0.1 * attempt)  # Exponential backoff with jitter
            print(f"Attempt {attempt + 1} failed for {url}: {str(e)}. Retrying in {wait_time:.2f}s...")
            if attempt < max_retries - 1:
                await asyncio.sleep(wait_time)
            else:
                raise
    raise aiohttp.ClientError("Max retries exceeded")

async def get_poster_data():
    async with aiohttp.ClientSession(
        connector=aiohttp.TCPConnector(limit=10, limit_per_host=5),  # Limit concurrency
        timeout=aiohttp.ClientTimeout(total=30)
    ) as http_session:
        with SessionLocal() as db_session:
            all_movies = db_session.query(Movies).all()
            
            for movie in all_movies:
                try:
                    api_url = f"https://api.themoviedb.org/3/movie/{movie.movie_id}?api_key={API_KEY}"
                    data = await fetch_with_retry(http_session, api_url)
                    
                    # Safely extract poster_path
                    poster_path = data.get('poster_path', "")
                    movie.backdrop_path = poster_path
                    db_session.commit()
                    
                    # Rate limit compliance: ~4 requests per second (250ms delay)
                    await asyncio.sleep(0.25)
                    
                except Exception as e:
                    print(f"Error processing movie ID {movie.movie_id}: {str(e)}")
                    db_session.rollback()  # Rollback on error to maintain integrity

if __name__ == "__main__":
    asyncio.run(get_poster_data())