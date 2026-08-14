from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import modular components directly without leading dots
from database import engine
import models
from routers import users, portfolio

# Automatically create database tables if they don't exist yet
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Zerodha AI API - Production Environment")

# Configure CORS to allow both local development and your live Vercel frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://zerodha-ai-platform-5rdh.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register modular routes
app.include_router(users.router)
app.include_router(portfolio.router)