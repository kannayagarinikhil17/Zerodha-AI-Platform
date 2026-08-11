from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import our new modular components
from .database import engine
from . import models
from .routers import users, portfolio

# Automatically create the database tables if they don't exist yet
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Zerodha AI API - Production Environment")

# Add CORS Middleware to allow Next.js to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Must be exact URL when credentials=True
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

# Register our modular routes
app.include_router(users.router)
app.include_router(portfolio.router)