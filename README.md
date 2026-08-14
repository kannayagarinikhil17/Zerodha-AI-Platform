# Zerodha AI Financial Intelligence Platform

## Executive Overview
This repository contains the first release of the Zerodha AI Financial Intelligence Platform. It transforms raw portfolio data, market signals, and internal data into explainable, dashboard-ready portfolio insights. The architecture ensures that all AI reasoning is grounded in deterministic analytics rather than uncontrolled natural-language generation.

---

## Technical Architecture
* **Frontend:** Next.js, React, Tailwind CSS, Recharts (for data visualization).
* **Backend API:** FastAPI, Python, SQLAlchemy (PostgreSQL/SQLite).
* **Analytics Engine:** Pandas (calculates deterministic metrics like drawdown, concentration, and P&L) and `yfinance` for live market data.
* **AI Workflow:** Google Gemini API via the modern `google-genai` SDK (utilizing the Interactions API with the `gemini-3.6-flash` model).
* **Data Governance & Security:** Strict separation of PII with Firebase Authentication middleware ensuring secure session management.

---

## Local Setup Instructions

1. **Clone the repository**.
2. **Ensure prerequisites:** Verify you have Python 3.11+ and Node.js installed.
3. **Configure Environment:** Create a `.env` file in the root directory and add your `GEMINI_API_KEY` (along with any required database or Firebase credentials).
4. **Start the Backend:**[cite: 1]
   ```bash
   python -m uvicorn backend.main:app --reload
   ```
5. **Start the Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
6. **Access Dashboard:** Open `http://localhost:3000` in your web browser.

---

## Primary User Journeys Supported
* **Portfolio Snapshot Review:** Clear explanation of major movers and exposure shifts.
* **Risk Exposure Check:** Computed sector concentration and volatility flags.
* **Personalized Recommendation Review:** Explainable insight cards with confidence and disclaimer controls.