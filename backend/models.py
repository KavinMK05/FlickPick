from sqlalchemy import JSON, Column, Integer, String, Boolean, DateTime, ForeignKey
from database import Base
from datetime import datetime

class Users(Base):
    __tablename__="Users"

    user_id = Column(String(255),primary_key=True, index=True)
    user_name = Column(String(255), nullable=False)
    password = Column(String(45),nullable=False)
    watchlist_id = Column(Integer, ForeignKey("WatchList.watchlist_id"))
    user_embedding = Column(JSON)

class Recommendations(Base):
    __tablename__ ="Recommendations"    
    recommendation_id = Column(Integer,primary_key=True,index=True)
    recommendations = Column(JSON,nullable=False, default={})
    user_id = Column(String(255)), ForeignKey("Users.user_id")

class Ratings(Base):

    __tablename__ = "Ratings"

    rating_id = Column(Integer,primary_key=True,index=True,autoincrement=True)
    rate = Column(Integer,nullable=False)
    user_id = Column(String(255),ForeignKey("Users.user_id"))
    movie_id = Column(Integer, ForeignKey("Movies.movie_id"))

class Movies(Base):
    __tablename__ = "Movies"

    movie_id = Column(Integer,primary_key=True, index=True)
    movie_name = Column(String(255),nullable=False)
    genres = Column(String(255), nullable=False)
    backdrop_path = Column(String(100),nullable=False)
    embeddings = Column(JSON,nullable=False)

class WatchList(Base):
    __tablename__ = "WatchList"

    watchlist_id = Column(Integer,primary_key=True, index=True)
    data = Column(JSON,default={})


