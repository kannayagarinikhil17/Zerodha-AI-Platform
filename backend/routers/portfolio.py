from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os
import pandas as pd
import json
import yfinance as yf
from google import genai 
from database import get_db
import schemas
import models
from auth import verify_firebase_token

# Load environment variables
load_dotenv()

# Extract API Key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY not found in .env file")

router = APIRouter(
    tags=["Portfolio Analytics"]
)

def generate_ai_insights(portfolio_df: pd.DataFrame, user_query: str):
    """
    Passes the portfolio context to Gemini using the new google-genai SDK.
    Strictly forces the LLM to return structured JSON.
    """
    if not GEMINI_API_KEY:
        return {
            "type": "standard",
            "insight": "AI API Key missing. Returning fallback analysis: Your portfolio is heavily concentrated in top assets. Diversification is recommended."
        }

    # Convert the pandas dataframe to a string representation for the LLM context
    portfolio_summary = portfolio_df.to_json(orient="records")
    
    # Enterprise-grade System Prompt
    prompt = f"""
    You are an elite quantitative financial analyst at a top-tier MNC.
    You have been provided with the following user portfolio data:
    {portfolio_summary}

    The user has asked the following query regarding their portfolio: "{user_query}"

    INSTRUCTIONS:
    1. If the query is empty or generic, provide a 'standard' 1-sentence insight about their risk or sector exposure.
    2. If the query is specific (e.g., asking for a risk breakdown, anomaly detection, or forecast), provide a 'detailed' quantitative report.
    3. Analyze the data strictly based on mathematical principles and standard financial heuristics.

    CRITICAL: Respond ONLY with a raw JSON object. Do not include markdown formatting, backticks, or introductory text. Match this exact schema:
    {{
        "type": "standard" | "detailed",
        "insight": "A single sentence insight (only if type is standard)",
        "query": "The user's original query (only if type is detailed)",
        "executive_summary": "2-3 sentences summarizing the quantitative analysis (only if type is detailed)",
        "key_findings": ["Finding 1", "Finding 2"] (only if type is detailed),
        "recommendations": ["Recommendation 1", "Recommendation 2"] (only if type is detailed)
    }}
    """

    try:
        # Initialize the new SDK Client
        client = genai.Client(api_key=GEMINI_API_KEY)
        
        # Use the newly required Interactions API with the 3.6-flash model
        interaction = client.interactions.create(
            model='gemini-3.6-flash',
            input=prompt
        )
        
        # Extract text from the new Interactions object
        raw_text = interaction.output_text.strip()
        
        # Clean up the response in case the LLM includes markdown code blocks
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:-3]
        elif raw_text.startswith("```"):
            raw_text = raw_text[3:-3]
            
        return json.loads(raw_text.strip())
        
    except Exception as e:
        print(f"Gemini API Critical Error: {e}")
        return {
            "type": "standard",
            "insight": "Our AI quantitative models are currently undergoing maintenance. Please try again shortly."
        }

@router.post("/api/portfolio-analysis")
async def analyze_portfolio(
    request: schemas.PortfolioRequest, 
    db: Session = Depends(get_db),
    user_data: dict = Depends(verify_firebase_token) 
):
    verified_user_id = user_data.get("uid")
    print(f"\n--- NEW ANALYSIS REQUEST STARTED FOR USER: {verified_user_id} ---")
    
    # 1. Fetch or Set Holdings Data
    print("1. Fetching portfolio data from database...")
    if request.custom_holdings:
        holdings_data = [
            {"symbol": h.symbol, "sector": h.sector, "quantity": h.quantity, "average_price": h.average_price} 
            for h in request.custom_holdings
        ]
        
        if request.save_for_future:
            portfolio = db.query(models.Portfolio).filter(models.Portfolio.user_id == verified_user_id).first()
            if not portfolio:
                portfolio = models.Portfolio(user_id=verified_user_id)
                db.add(portfolio)
                db.commit()
                db.refresh(portfolio)

            db.query(models.Holding).filter(models.Holding.portfolio_id == portfolio.portfolio_id).delete(synchronize_session=False)

            for h in request.custom_holdings:
                new_holding = models.Holding(
                    portfolio_id=portfolio.portfolio_id,
                    instrument_symbol=h.symbol,
                    sector=h.sector,
                    quantity=h.quantity,
                    average_price=h.average_price
                )
                db.add(new_holding)
            db.commit()
            
    else:
        db_holdings = db.query(models.Holding).join(models.Portfolio).filter(models.Portfolio.user_id == verified_user_id).all()
        
        if not db_holdings:
            print("   -> ERROR: No portfolio found in DB.")
            return {"error": "No portfolio found for this account. Please create one."}
            
        holdings_data = [
            {"symbol": h.instrument_symbol, "sector": h.sector, "quantity": h.quantity, "average_price": h.average_price} 
            for h in db_holdings
        ]

    df = pd.DataFrame(holdings_data)
    
    # 2. Market Data Processing (Live yfinance integration)
    print(f"2. Fetching live Yahoo Finance data for {len(df)} stocks...")
    total_invested = 0.0
    total_current = 0.0
    stock_comparison = []
    sector_exposure = {}

    for index, row in df.iterrows():
        symbol = row['symbol']
        ticker_symbol = f"{symbol}.NS" if not symbol.endswith(('.NS', '.BO', '.O')) else symbol
        
        try:
            stock = yf.Ticker(ticker_symbol)
            hist = stock.history(period="1d")
            current_price = hist['Close'].iloc[-1] if not hist.empty else float(row['average_price'])
        except Exception as e:
            print(f"   -> Failed to fetch data for {symbol}: {e}")
            current_price = float(row['average_price'])

        invested = float(row['quantity']) * float(row['average_price'])
        current = float(row['quantity']) * current_price
        
        total_invested += invested
        total_current += current
        
        stock_comparison.append({
            "symbol": symbol,
            "invested": round(invested, 2),
            "current": round(current, 2)
        })
        
        sector = row['sector']
        sector_exposure[sector] = sector_exposure.get(sector, 0) + current

    unrealized_pnl = total_current - total_invested
    return_percentage = (unrealized_pnl / total_invested * 100) if total_invested > 0 else 0

    theme_colors = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#14B8A6"]
    sector_data = [
        {"name": k, "value": round(v, 2), "color": theme_colors[i % len(theme_colors)]} 
        for i, (k, v) in enumerate(sector_exposure.items())
    ]

    predictive_chart = []
    for month in range(1, 7):
        growth_factor = 1 + ((0.08 / 12) * month)
        predictive_chart.append({
            "month": f"M{month}",
            "baseline": round(total_current * growth_factor, 2),
            "optimistic": round(total_current * (growth_factor + 0.05), 2), 
            "pessimistic": round(total_current * (growth_factor - 0.04), 2)  
        })

    analytics_metrics = {
        "summary": {
            "total_invested_value": round(total_invested, 2), 
            "total_current_value": round(total_current, 2), 
            "total_unrealized_pnl": round(unrealized_pnl, 2), 
            "return_percentage": round(return_percentage, 2)
        },
        "sector_data": sector_data,
        "stock_comparison": stock_comparison,
        "historical_chart": [], 
        "predictive_chart": predictive_chart
    }

    # 3. Call the True AI Integration
    print("3. Live data calculated. Calling Google Gemini API...")
    df['live_market_price'] = [sc['current'] / float(qty) for sc, qty in zip(stock_comparison, df['quantity'])]
    
    user_query = request.query if request.query else ""
    ai_intelligence_card = generate_ai_insights(df, user_query)

    print("4. Gemini API processing complete! Sending payload to Next.js.")
    return {
        "analytics_metrics": analytics_metrics,
        "ai_intelligence_card": ai_intelligence_card
    }