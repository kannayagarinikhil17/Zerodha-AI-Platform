import json
import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Import our new MCP Governance Layer
from mcp_server.server import execute_mcp_tool, get_portfolio_tool_schema

# Load environment variables
load_dotenv()

# Import deterministic analytics function
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from analytics.exposure_metrics import calculate_portfolio_metrics


def generate_portfolio_explanation(metrics_payload: dict) -> dict:
    """Passes deterministic portfolio metrics to Gemini to generate
    an explainable, structured portfolio intelligence summary.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    
    # --- 1. MCP GOVERNANCE LAYER ---
    try:
        # Retrieve the allowed schema
        mcp_schema = get_portfolio_tool_schema()
        
        # Execute governed data retrieval (this validates access)
        governed_payload = execute_mcp_tool(
            tool_name=mcp_schema["tool_name"], 
            payload=metrics_payload 
        )
    except Exception as e:
        print(f"[ERROR] MCP Governance layer blocked execution: {e}")
        raise e
    # -------------------------------
    
    # Fallback response template if API is unavailable or key is missing
    # Now using 'governed_payload' instead of the raw metrics
    fallback_response = {
        "portfolio_summary": f"Your portfolio total value stands at ₹{governed_payload.get('summary', governed_payload).get('total_current_value', 0):,} with an overall return.",
        "top_driver": "Automotive holdings generated strong overall capital returns.",
        "key_risk_alerts": [
            f"Sector concentration alert: {alert['message']}" for alert in governed_payload.get('concentration_risk_alerts', [])
        ],
        "recommended_review_areas": [
            "Examine high-concentration sectors to mitigate sector-specific drawdown risk.",
            "Review underperforming positions relative to total portfolio weight."
        ],
        "confidence_score": "HIGH",
        "disclaimer": "This intelligence summary is for informational and educational purposes only."
    }

    if not api_key or "insert_" in api_key or api_key == "mock_key_for_testing":
        print("\n[NOTE] No valid GEMINI_API_KEY found. Returning structured mock response...")
        return fallback_response

    try:
        client = genai.Client(api_key=api_key)

        system_instruction = """
        You are an expert AI Financial Intelligence Explainer for Zerodha.
        Your task is to analyze structured portfolio metrics and generate plain-language, explainable financial insights.
        
        STRICT GUIDELINES:
        1. Base ALL claims, numbers, and observations strictly on the provided JSON metrics.
        2. Do NOT invent prices, earnings, or external financial facts.
        3. Clearly distinguish between positive performance drivers and high-concentration risk areas.
        4. Provide actionable review prompts without giving direct buy/sell investment commands.
        5. Always return a clean, structured JSON response following the requested schema.
        """

        # Using the governed_payload in the prompt
        prompt = f"""
        Here is the deterministic analytics payload for user portfolio analysis (Governed via MCP):
        
        {json.dumps(governed_payload, indent=2)}
        
        Generate a complete, plain-language portfolio intelligence summary.
        """

        # Using gemini-1.5-flash for stable availability
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )

        return json.loads(response.text)

    except Exception as e:
        print(f"\n[WARNING] Gemini API Call failed with error: {e}")
        print("Falling back to structured analytics output...\n")
        return fallback_response