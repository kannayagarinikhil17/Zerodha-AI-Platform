import json
import os
import pandas as pd


def calculate_portfolio_metrics(csv_file_path: str, user_id: str = "user_1"):
    """Calculates portfolio total value, P&L, sector concentration,

    and risk alerts from raw holding records.
    """
    if not os.path.exists(csv_file_path):
        raise FileNotFoundError(f"Portfolio file not found at: {csv_file_path}")

    # 1. Load sample portfolio CSV data
    df = pd.read_csv(csv_file_path)

    # Filter for the specific user
    user_df = df[df["user_id"] == user_id].copy()

    if user_df.empty:
        return {"error": f"No holdings found for user: {user_id}"}

    # 2. Perform financial calculations
    user_df["invested_value"] = user_df["quantity"] * user_df["average_price"]
    user_df["current_value"] = user_df["quantity"] * user_df["current_price"]
    user_df["unrealized_pnl"] = (
        user_df["current_value"] - user_df["invested_value"]
    )
    user_df["pnl_percentage"] = (
        user_df["unrealized_pnl"] / user_df["invested_value"]
    ) * 100

    # Summary Totals
    total_invested = user_df["invested_value"].sum()
    total_current = user_df["current_value"].sum()
    total_pnl = total_current - total_invested
    total_pnl_pct = (
        (total_pnl / total_invested) * 100 if total_invested > 0 else 0
    )

    # 3. Calculate Sector Concentration
    sector_summary = (
        user_df.groupby("sector")["current_value"].sum().reset_index()
    )
    sector_summary["allocation_pct"] = (
        sector_summary["current_value"] / total_current
    ) * 100
    sector_summary = sector_summary.sort_values(
        by="allocation_pct", ascending=False
    )

    # Convert sector breakdown to dictionary
    sector_allocation = {}
    high_concentration_alerts = []

    for _, row in sector_summary.iterrows():
        sector_name = row["sector"]
        alloc = round(row["allocation_pct"], 2)
        sector_allocation[sector_name] = f"{alloc}%"

        # Flag any sector representing over 35% of total portfolio
        if alloc > 35.0:
            high_concentration_alerts.append(
                {
                    "sector": sector_name,
                    "allocation_pct": alloc,
                    "risk_level": "HIGH",
                    "message": f"Portfolio has high concentration in {sector_name} ({alloc}% of total allocation).",
                }
            )

    # 4. Stock Level Contribution Breakdown
    user_df["portfolio_weight_pct"] = (
        user_df["current_value"] / total_current
    ) * 100
    holdings_breakdown = []

    for _, row in user_df.iterrows():
        holdings_breakdown.append(
            {
                "symbol": row["symbol"],
                "sector": row["sector"],
                "quantity": int(row["quantity"]),
                "invested_value": round(float(row["invested_value"]), 2),
                "current_value": round(float(row["current_value"]), 2),
                "unrealized_pnl": round(float(row["unrealized_pnl"]), 2),
                "pnl_pct": f"{round(float(row['pnl_percentage']), 2)}%",
                "portfolio_weight": f"{round(float(row['portfolio_weight_pct']), 2)}%",
            }
        )

    # 5. Build Final Structured Output
    output_payload = {
        "user_id": user_id,
        "summary": {
            "total_invested_value": round(float(total_invested), 2),
            "total_current_value": round(float(total_current), 2),
            "total_unrealized_pnl": round(float(total_pnl), 2),
            "overall_return_pct": f"{round(float(total_pnl_pct), 2)}%",
        },
        "sector_allocation": sector_allocation,
        "concentration_risk_alerts": high_concentration_alerts,
        "holdings": holdings_breakdown,
    }

    return output_payload


if __name__ == "__main__":
    # Test path pointing to sample_portfolios.csv inside data/
    sample_csv_path = os.path.join(
        os.path.dirname(__file__), "..", "data", "sample_portfolios.csv"
    )

    metrics = calculate_portfolio_metrics(sample_csv_path, user_id="user_1")

    # Display clean output JSON
    print("\n=== DETERMINISTIC ANALYTICS OUTPUT ===")
    print(json.dumps(metrics, indent=2))