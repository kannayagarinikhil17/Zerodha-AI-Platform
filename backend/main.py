import os
import sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add root directory to path so we can import from analytics and ai_workflows
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from ai_workflows.llm_analysis import generate_portfolio_explanation
from analytics.exposure_metrics import calculate_portfolio_metrics

app = FastAPI(
    title="Zerodha AI Financial Intelligence Platform API",
    description="Backend API serving portfolio analytics and explainable AI insights.",
    version="1.0.0",
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalysisRequest(BaseModel):
    user_id: str = "user_1"


@app.get("/")
def health_check():
    """Health check endpoint to verify backend status."""
    return {
        "status": "online",
        "service": "Zerodha AI Financial Intelligence API",
    }


@app.post("/api/portfolio-analysis")
def analyze_portfolio(request: AnalysisRequest):
    """Triggers deterministic analytics and AI reasoning for a given user portfolio."""
    sample_csv_path = os.path.join(
        os.path.dirname(__file__), "..", "data", "sample_portfolios.csv"
    )

    try:
        # 1. Run Analytics Engine
        metrics_payload = calculate_portfolio_metrics(
            sample_csv_path, user_id=request.user_id
        )

        if "error" in metrics_payload:
            raise HTTPException(status_code=404, detail=metrics_payload["error"])

        # 2. Run AI Explanation Workflow
        ai_insights = generate_portfolio_explanation(metrics_payload)

        # 3. Combine into final response payload
        return {
            "status": "success",
            "user_id": request.user_id,
            "analytics_metrics": metrics_payload,
            "ai_intelligence_card": ai_insights,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error generating analysis: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)