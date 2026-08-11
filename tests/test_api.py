from fastapi.testclient import TestClient
import sys
import os

# Ensure the backend module can be found
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.main import app

client = TestClient(app)

def test_portfolio_analysis_success():
    """Test the main portfolio intelligence generation endpoint."""
    response = client.post(
        "/api/portfolio-analysis",
        json={"user_id": "test_user_1"}
    )
    
    # Check that the API responds successfully
    assert response.status_code == 200
    
    # Check that the payload contains the required product surfaces
    data = response.json()
    assert "analytics_metrics" in data, "Missing deterministic analytics output"
    assert "ai_intelligence_card" in data, "Missing AI reasoning output"
    
    # Validate the AI card structure (this works perfectly with your fallback response!)
    ai_card = data.get("ai_intelligence_card", {})
    assert "confidence_score" in ai_card, "Confidence score missing from AI card"

def test_portfolio_analysis_missing_user():
    """Test edge case: Payload missing the required user_id."""
    response = client.post(
        "/api/portfolio-analysis",
        json={} # Empty payload
    )
    # FastAPI should automatically reject this with a 422 Unprocessable Entity
    assert response.status_code == 422