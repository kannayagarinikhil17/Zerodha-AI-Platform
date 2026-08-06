"use client";

import { useState } from "react";
import PortfolioSummary from "../components/PortfolioSummary";
import RiskPanel from "../components/RiskPanel";
import InsightCard from "../components/InsightCard";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/portfolio-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: "user_1" }),
      });
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch insights", error);
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Zerodha AI Platform</h1>
            <p className="text-gray-500">Internal Product Dossier - Investor Dashboard</p>
          </div>
          <button 
            onClick={fetchInsights}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow disabled:opacity-50"
          >
            {loading ? "Analyzing Portfolio..." : "Generate AI Insights"}
          </button>
        </header>

        {data && (
          <div className="space-y-6">
            <PortfolioSummary summary={data.analytics_metrics.summary} />
            <RiskPanel alerts={data.analytics_metrics.concentration_risk_alerts} />
            <InsightCard aiData={data.ai_intelligence_card} />
          </div>
        )}
      </div>
    </main>
  );
}