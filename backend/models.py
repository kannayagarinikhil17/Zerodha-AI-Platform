from sqlalchemy import Column, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    user_id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    
    portfolios = relationship("Portfolio", back_populates="owner")

class Portfolio(Base):
    __tablename__ = "portfolios"
    
    portfolio_id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.user_id"))
    portfolio_name = Column(String, default="Main")
    
    owner = relationship("User", back_populates="portfolios")
    holdings = relationship("Holding", back_populates="portfolio")

class Holding(Base):
    __tablename__ = "holdings"
    
    holding_id = Column(String, primary_key=True, default=generate_uuid)
    portfolio_id = Column(String, ForeignKey("portfolios.portfolio_id"))
    instrument_symbol = Column(String, index=True)
    sector = Column(String)
    quantity = Column(Float)
    average_price = Column(Float)
    
    portfolio = relationship("Portfolio", back_populates="holdings")