# Zerodha AI Financial Intelligence Platform

## Executive Overview
This repository contains the first release of the Zerodha AI Financial Intelligence Platform. It transforms raw portfolio data, market signals, and internal data into explainable, dashboard-ready portfolio insights. The architecture ensures that all AI reasoning is grounded in deterministic analytics rather than uncontrolled natural-language generation.

## Technical Architecture
- **Frontend:** Next.js, React, Tailwind CSS
- **Backend API:** FastAPI, Python
- **Analytics Engine:** Pandas (calculates deterministic metrics like drawdown, concentration, and P&L)
- **AI Workflow:** Google Gemini API via `google-genai` SDK
- **Data Governance:** Strict separation of PII; MCP Server integration for tool execution.

## Local Setup Instructions
1. Clone the repository.
2. Ensure you have Python 3.11+ and Node.js installed.
3. Add your `KITE_API_KEY`, `KITE_API_SECRET`, and `GEMINI_API_KEY` to the root `.env` file.
4. **Start the Backend:** 
   `python backend/main.py`
5. **Start the Frontend:** 
   `cd frontend` -> `npm run dev`
6. Access the dashboard at `http://localhost:3000`.

## Primary User Journeys Supported
- **Portfolio Snapshot Review:** Clear explanation of major movers and exposure shifts.
- **Risk Exposure Check:** Computed sector concentration and volatility flags.
- **Personalized Recommendation Review:** Explainable insight cards with confidence and disclaimer controls.