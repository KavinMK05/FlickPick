"""
Script to import movies from TMDB dataset into the Movies table.
Avoids duplicates by checking existing movie_ids.
Uses simple hash-based embeddings that don't require additional ML libraries.
"""

import pandas as pd
import numpy as np
import hashlib
from database import SessionLocal
from models import Movies

def generate_simple_embedding(text, dim=128):
    """
    Generate a simple embedding using hash-based approach.
    This creates consistent embeddings without requiring ML models.
    """
    # Hash the text to get a seed
    text_hash = hashlib.sha256(text.encode()).hexdigest()
    
    # Use hash as seed for reproducible random embedding
    seed = int(text_hash[:8], 16)
    np.random.seed(seed)
    
    # Generate embedding
    embedding = np.random.randn(dim)
    
    # Normalize
    embedding = embedding / np.linalg.norm(embedding)
    
    return embedding.tolist()

def import_movies(limit=10000):
    """Import movies from CSV to database, avoiding duplicates."""
    
    print(f"Reading first {limit} movies from CSV...")
    df = pd.read_csv('TMDB_movie_dataset_v11.csv', nrows=limit)
    
    print(f"Columns available: {df.columns.tolist()}")
    
    with SessionLocal() as session:
        # Get existing movie IDs to avoid duplicates
        existing_ids = set(
            movie.movie_id for movie in session.query(Movies.movie_id).all()
        )
        print(f"Found {len(existing_ids)} existing movies in database")
        
        added_count = 0
        skipped_count = 0
        
        for idx, row in df.iterrows():
            movie_id = int(row['id']) if pd.notna(row['id']) else None
            
            if movie_id is None or movie_id in existing_ids:
                skipped_count += 1
                continue
            
            # Extract data
            title = str(row['title']) if pd.notna(row['title']) else "Unknown"
            genres = str(row['genres']) if pd.notna(row['genres']) else ""
            
            # Use poster_path or backdrop_path if available
            backdrop = ""
            if 'poster_path' in df.columns and pd.notna(row.get('poster_path')):
                backdrop = str(row['poster_path'])
            elif 'backdrop_path' in df.columns and pd.notna(row.get('backdrop_path')):
                backdrop = str(row['backdrop_path'])
            
            # Create text for embedding from available fields
            keywords = str(row['keywords']) if 'keywords' in df.columns and pd.notna(row.get('keywords')) else ""
            overview = str(row['overview']) if 'overview' in df.columns and pd.notna(row.get('overview')) else ""
            
            # Create text for embedding
            embedding_text = f"{title} {genres} {keywords} {overview}"
            
            # Generate simple hash-based embedding
            embedding = generate_simple_embedding(embedding_text)
            
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

            # Create movie record
            movie = Movies(
                movie_id=movie_id,
                movie_name=title[:255],  # Limit to column size
                genres=genres[:255],
                backdrop_path=backdrop[:100] if backdrop else "",
                embeddings=embedding,
                release_year=release_year
            )
            
            session.add(movie)
            added_count += 1
            existing_ids.add(movie_id)  # Track to avoid duplicates in this batch
            
            # Commit in batches
            if added_count % 500 == 0:
                session.commit()
                print(f"Imported {added_count} movies...")
        
        # Final commit
        session.commit()
        print(f"\nImport complete!")
        print(f"  Added: {added_count} movies")
        print(f"  Skipped (duplicates/invalid): {skipped_count}")

if __name__ == "__main__":
    import_movies(limit=10000)
