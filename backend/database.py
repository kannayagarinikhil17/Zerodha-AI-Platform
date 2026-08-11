from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os

# For local testing, you can use SQLite. For production, swap this to your Postgres URL:
# SQLALCHEMY_DATABASE_URL = "postgresql://user:password@localhost/zerodha_db"
SQLALCHEMY_DATABASE_URL = "sqlite:///./dynamic_portfolios.db" 

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    # connect_args={"check_same_thread": False} is only needed for SQLite
    connect_args={"check_same_thread": False} 
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to yield database sessions to our FastAPI routes safely
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()