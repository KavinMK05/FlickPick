import pandas as pd
from sqlalchemy import create_engine , text
from database import engine

COLUMN_MAP = {
    'id':'movie_id',
    'title':'movie_name',
    'backdrop_path':'backdrop_path',
    'genres':'genres',
}

df = pd.read_csv('TMDB_movie_dataset_v11.csv',usecols=list(COLUMN_MAP.keys()),dtype={'id':'Int64'})
filtered_data = df.rename(columns=COLUMN_MAP)
first_100_movies= filtered_data.head(100)

first_100_movies.to_sql(
    name="movies",
    con=engine,
    if_exists="append",
    index=False,
    chunksize=1000,
    method="multi"
)

with engine.connect() as connection:
    result = connection.execute(text("SELECT COUNT(*) FROM movies"))
    row_count = result.fetchone()[0]
    print(f"Total records in table: {row_count}")