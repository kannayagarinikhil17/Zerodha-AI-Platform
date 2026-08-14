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
    print("WARNING: GEMINI_API_KEY not found in environment variables")

router = APIRouter(
    tags=["Portfolio Analytics"]
)

def generate_ai_insights(portfolio_df: pd.DataFrame, user_query: str):
    """
    Passes portfolio context to Gemini and forces a 'detailed' deep analysis 
    report card whenever a query is provided by the user.
    """
    if not GEMINI_API_KEY:
        return {
            "type": "detailed",
            "query": user_query if user_query else "Portfolio Analysis",
            "executive_summary": "To maximize profit, you must cut underperforming assets and reallocate to your strongest sectors. (Note: Live AI generation is currently offline due to API limits; displaying baseline heuristic analysis).",
            "key_findings": [
                "Your portfolio shows high concentration in a single sector, increasing vulnerability.",
                "Certain individual holdings are dragging down the overall Unrealized P&L."
            ],
            "recommendations": [
                "Review the 'Holdings Impact' chart to identify which specific stocks are trading below average buy price.",
                "Consider rebalancing capital from the lowest-performing asset into your top performer."
            ]
        }

    portfolio_summary = portfolio_df.to_json(orient="records")
    
    prompt = f"""
    You are an elite quantitative financial analyst at a top-tier MNC (like Goldman Sachs or Morgan Stanley).
    You have been provided with the following live user portfolio data:
    {portfolio_summary}

    The user has submitted this specific analytical query: "{user_query if user_query else 'General Portfolio Health Assessment'}"

    INSTRUCTIONS:
    1. You MUST set "type": "detailed" because the user asked a specific question.
    2. EXECUTIVE SUMMARY: The VERY FIRST sentence must be a direct, blunt, point-to-point answer to the user's query. Follow it immediately with a 2-3 sentence description explaining the 'why' based strictly on their portfolio data.
    3. KEY FINDINGS: Provide 3-4 granular points focusing on specific stock tickers and their impact.
    4. RECOMMENDATIONS: Provide 3-4 actionable strategic steps to achieve the user's goal.

    CRITICAL: Respond ONLY with a raw JSON object. Do not include markdown formatting, backticks, or introductory text. Match this exact schema:
    {{
        "type": "detailed",
        "query": "{user_query if user_query else 'General Portfolio Health Assessment'}",
        "executive_summary": "[Direct Answer]. [Brief explanation of portfolio impact].",
        "key_findings": [
            "Pro/Strength 1: ...",
            "Con/Vulnerability 1: ..."
        ],
        "recommendations": [
            "Actionable recommendation 1...",
            "Actionable recommendation 2..."
        ]
    }}
    """

    models_to_try = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']
    client = genai.Client(api_key=GEMINI_API_KEY)

    for model_name in models_to_try:
        try:
            print(f"Attempting detailed AI analysis using model: {model_name}")
            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            
            raw_text = response.text.strip()
            
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:-3]
            elif raw_text.startswith("```"):
                raw_text = raw_text[3:-3]
                
            parsed_json = json.loads(raw_text.strip())
            parsed_json["type"] = "detailed"
            return parsed_json
            
        except Exception as e:
            print(f"Model {model_name} failed: {e}. Trying next fallback...")
            continue

    # Fallback if models experience high demand
    return {
        "type": "detailed",
        "query": user_query if user_query else "Portfolio Analysis",
        "executive_summary": "To maximize profit, you must cut underperforming assets and reallocate to your strongest sectors. (Note: Live AI generation is currently offline due to API limits; displaying baseline heuristic analysis).",
        "key_findings": [
            "Your portfolio shows high concentration in a single sector, increasing vulnerability.",
            "Certain individual holdings are dragging down the overall Unrealized P&L."
        ],
        "recommendations": [
            "Review the 'Holdings Impact' chart to identify which specific stocks are trading below average buy price.",
            "Consider rebalancing capital from the lowest-performing asset into your top performer."
        ]
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
    
    # 2. Market Data Processing (Live yfinance + 30-Day History + News + Volatility Alerts)
    print(f"2. Fetching live Yahoo Finance 30-day history, news, and alerts for {len(df)} stocks...")
    total_invested = 0.0
    total_current = 0.0
    stock_comparison = []
    sector_exposure = {}
    
    live_news = []
    automated_alerts = []
    historical_chart_data = {}

    for index, row in df.iterrows():
        symbol = row['symbol']
        ticker_symbol = f"{symbol}.NS" if not symbol.endswith(('.NS', '.BO', '.O')) else symbol
        quantity = float(row['quantity'])
        avg_price = float(row['average_price'])
        
        try:
            stock = yf.Ticker(ticker_symbol)
            hist = stock.history(period="1mo")
            current_price = float(hist['Close'].iloc[-1]) if not hist.empty else avg_price
            
            # Automated Movement Alerts
            if not hist.empty and len(hist) > 1:
                prev_close = float(hist['Close'].iloc[-2])
                daily_change = ((current_price - prev_close) / prev_close) * 100
                if daily_change <= -3.0:
                    automated_alerts.append({
                        "type": "danger",
                        "symbol": symbol,
                        "message": f"🚨 {symbol} decreased by {abs(daily_change):.2f}% during the last session."
                    })
                elif daily_change >= 3.0:
                    automated_alerts.append({
                        "type": "success",
                        "symbol": symbol,
                        "message": f"🚀 {symbol} gained {daily_change:.2f}% during the last session."
                    })

            # Stock News Retrieval
            stock_news = getattr(stock, 'news', []) or []
            for article in stock_news[:2]:
                title = article.get('title')
                link = article.get('link')
                publisher = article.get('publisher', 'Market News')
                if title and link:
                    live_news.append({
                        "symbol": symbol,
                        "title": title,
                        "link": link,
                        "publisher": publisher
                    })

            # 30-Day Aggregated Portfolio Performance History
            if not hist.empty:
                for date_idx, hist_row in hist.iterrows():
                    date_str = date_idx.strftime('%Y-%m-%d')
                    daily_value = float(hist_row['Close']) * quantity
                    historical_chart_data[date_str] = historical_chart_data.get(date_str, 0.0) + daily_value

        except Exception as e:
            print(f"   -> Failed to fetch live data for {symbol}: {e}")
            current_price = avg_price

        invested = quantity * avg_price
        current = quantity * current_price
        
        total_invested += invested
        total_current += current
        
        stock_comparison.append({
            "symbol": symbol,
            "invested": round(invested, 2),
            "current": round(current, 2)
        })
        
        sector = row['sector']
        sector_exposure[sector] = sector_exposure.get(sector, 0.0) + current

    unrealized_pnl = total_current - total_invested
    return_percentage = (unrealized_pnl / total_invested * 100) if total_invested > 0 else 0.0

    theme_colors = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#14B8A6"]
    sector_data = [
        {"name": k, "value": round(v, 2), "color": theme_colors[i % len(theme_colors)]} 
        for i, (k, v) in enumerate(sector_exposure.items())
    ]

    formatted_historical_chart = [
        {"date": date_key, "portfolio_value": round(val, 2)} 
        for date_key, val in sorted(historical_chart_data.items())
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
        "historical_chart": formatted_historical_chart,
        "predictive_chart": predictive_chart,
        "live_news": live_news,
        "automated_alerts": automated_alerts
    }

    # 3. AI Insights Generation
    print("3. Live metrics computed. Generating deep Gemini AI intelligence report...")
    df['live_market_price'] = [
        sc['current'] / float(qty) if float(qty) > 0 else 0 
        for sc, qty in zip(stock_comparison, df['quantity'])
    ]
    
    user_query = request.query if request.query else ""
    ai_intelligence_card = generate_ai_insights(df, user_query)

    print("4. Processing complete. Sending comprehensive payload to frontend.")
    return {
        "analytics_metrics": analytics_metrics,
        "ai_intelligence_card": ai_intelligence_card
    }