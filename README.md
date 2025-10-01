# 🎬 Movie Recommendation App

## 📖 Overview

This is a lightweight movie recommendation application that provides personalized suggestions using content-based machine learning. The system learns from user ratings in real-time, recommending movies similar to those the user enjoys based on genres and descriptions. Recommendations update instantly without requiring complex model training.

The architecture emphasizes performance (responses under 100ms), simplicity, and scalability, handling thousands of movies efficiently. It features a responsive frontend for user interactions, a robust backend for logic and ML processing, and a relational database for data persistence.

## ✨ Core Features

- **🔮 Personalized Recommendations**: Generates top movie suggestions based on user ratings, using cosine similarity on precomputed embeddings.
- **⚡ Real-Time Updates**: Ratings immediately refine the user's profile, triggering refreshed recommendations.
- **👤 User Management**: New users can register to receive a unique user ID for tracking preferences.
- **📋 Movie Browsing**: View all movies with details like title, genre, and overview.
- **⭐ Rating System**: Simple like/dislike or scored ratings (1-5) for movies.

## 🛠️ Tech Stack

- **Frontend**: Next.js (with React and Tailwind CSS) for a responsive UI. 🌐
- **Backend**: FastAPI (Python) for API endpoints and ML integration. 🐍
- **Database**: MySQL for storing movies, user ratings, and profiles. 🗄️
- **ML**: Sentence Transformers (e.g., all-MiniLM-L6-v2) for lightweight text embeddings; content-based filtering via vector similarity. 🤖
- **Other**: Precomputed embeddings stored in memory for fast queries; data sourced from MovieLens or TMDB. 📊

## 🚀 Setup Instructions

### Prerequisites

- Node.js (v18+) 🟢
- Python (3.10+) 🟢
- MySQL (v8.0+) 🟢
- Git 🟢

### Installation

1. **Clone the Repository**:
   ```
   git clone https://github.com/yourusername/movie-recommendation-app.git
   cd movie-recommendation-app
   ```

2. **Backend Setup**:
   - Install dependencies:
     ```
     cd backend
     pip install -r requirements.txt
     ```
   - Configure MySQL:
     - Create a database: `CREATE DATABASE movie_rec_db;`
     - Update `config.py` with your MySQL credentials (host, user, password, database).
     - Run migrations: `alembic upgrade head` (if using Alembic for schema management).
   - Load initial movie data (run `python load_movies.py` to fetch and embed from TMDB/MovieLens).
   - Start the server: `uvicorn main:app --reload --port 8000`

3. **Frontend Setup**:
   - Install dependencies:
     ```
     cd frontend
     npm install
     ```
   - Update `.env.local` with backend URL (e.g., `NEXT_PUBLIC_API_URL=http://localhost:8000`).
   - Start the development server: `npm run dev`

4. **Database Schema**:
   - Tables: `movies` (ID, title, genre, overview, embedding), `users` (ID, created_at), `ratings` (user_id, movie_id, score).

## 🎯 Usage

1. Access the app at `http://localhost:3000`.
2. Register a new account to generate a user ID.
3. Enter your user ID on the home page to fetch initial recommendations (popular movies for new users).
4. Browse and rate movies; recommendations update dynamically.
5. For API testing, use tools like Postman against `http://localhost:8000`.

## 🔌 API Endpoints

| Endpoint              | Method | Description                          | Parameters                  |
|-----------------------|--------|--------------------------------------|-----------------------------|
| `/movies`             | GET    | List all movies                      | None                        |
| `/recommend`          | GET    | Get personalized recommendations     | `user_id` (query), `num=10` |
| `/rate`               | POST   | Submit a movie rating                | JSON: `{user_id, movie_id, score}` |
| `/register`           | POST   | Create new user and return user ID   | JSON: `{username}`          |

## 🔄 Data Flow

1. User registers and enters ID.
2. Frontend requests recommendations via `/recommend`.
3. Backend computes user profile from ratings, ranks movies by similarity, and responds.
4. User rates via `/rate`; profile updates, triggering refetch.

## ☁️ Deployment Notes

- **Frontend**: Deploy to Vercel. 🚀
- **Backend**: Deploy to Render or Heroku with MySQL add-on. 🛫
- For production, add authentication (e.g., JWT) and caching.

## 🤝 Contributing

Fork the repo, create a branch, and submit a pull request. Ensure code adheres to PEP 8 and ESLint standards.

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

For questions, open an issue. ❓
