# Zerodha AI Financial Intelligence Platform

## Executive Overview
This repository contains the first release of the Zerodha AI Financial Intelligence Platform[cite: 6]. It transforms raw portfolio data, market signals, and internal data into explainable, dashboard-ready portfolio insights[cite: 6]. The architecture ensures that all AI reasoning is grounded in deterministic analytics rather than uncontrolled natural-language generation[cite: 6].

## Technical Architecture
- **Frontend:** Next.js, React, Tailwind CSS, Recharts (for data visualization)[cite: 6].
- **Backend API:** FastAPI, Python, SQLAlchemy (PostgreSQL/SQLite)[cite: 6].
- **Analytics Engine:** Pandas (calculates deterministic metrics like drawdown, concentration, and P&L) and `yfinance` for live market data[cite: 6].
- **AI Workflow:** Google Gemini API via the modern `google-genai` SDK (utilizing the Interactions API with the `gemini-3.6-flash` model)[cite: 6].
- **Data Governance & Security:** Strict separation of PII with Firebase Authentication middleware ensuring secure session management[cite: 6].

## Local Setup Instructions
1. Clone the repository[cite: 6].
2. Ensure you have Python 3.11+ and Node.js installed[cite: 6].
3. Create a `.env` file in the root directory and add your `GEMINI_API_KEY` (along with any required database or Firebase credentials)[cite: 6].
4. **Start the Backend:** 
   `python -m uvicorn backend.main:app --reload`[cite: 6].
5. **Start the Frontend:** 
   `cd frontend` -> `npm run dev`[cite: 6].
6. Access the dashboard at `http://localhost:3000`[cite: 6].

## Primary User Journeys Supported
- **Portfolio Snapshot Review:** Clear explanation of major movers and exposure shifts[cite: 6].
- **Risk Exposure Check:** Computed sector concentration and volatility flags[cite: 6].
- **Personalized Recommendation Review:** Explainable insight cards with confidence and disclaimer controls[cite: 6].