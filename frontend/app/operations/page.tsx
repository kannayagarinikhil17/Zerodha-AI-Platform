"use client";

import { useEffect, useState } from "react";

export default function OperationsDashboard() {
  const [metrics, setMetrics] = useState({
    totalJobs: 0,
    failedJobs: 0,
    averageLatency: "0ms",
    status: "Loading..."
  });

  // Fetching operation metrics (Using mocked data for UI demonstration)
  useEffect(() => {
    setTimeout(() => {
      setMetrics({
        totalJobs: 142,
        failedJobs: 3,
        averageLatency: "245ms",
        status: "Healthy"
      });
    }, 800);
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 border-b pb-4">
          <h1 className="text-3xl font-extrabold text-gray-900">Operations Dashboard</h1>
          <p className="text-gray-500 mt-1">System health, adoption, and latency monitoring</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Job Health Card */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">System Status</h3>
            <p className={`text-2xl font-bold mt-2 ${metrics.status === 'Healthy' ? 'text-green-600' : 'text-yellow-600'}`}>
              {metrics.status}
            </p>
          </div>

          {/* Total Jobs Card */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Insights</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">{metrics.totalJobs}</p>
          </div>

          {/* Latency Card */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Avg Model Latency</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">{metrics.averageLatency}</p>
          </div>
        </div>

        {/* Recent Alerts/Exceptions Section */}
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-800">Recent System Exceptions</h3>
          </div>
          <div className="p-6 text-gray-600 text-sm">
            {metrics.failedJobs > 0 ? (
              <ul className="space-y-3">
                <li className="flex justify-between items-center text-red-600">
                  <span>[ERROR] API Timeout: Market Data Fetch</span>
                  <span className="text-xs text-gray-400">10 mins ago</span>
                </li>
                <li className="flex justify-between items-center text-yellow-600">
                  <span>[WARN] Fallback response triggered for user_1</span>
                  <span className="text-xs text-gray-400">1 hour ago</span>
                </li>
              </ul>
            ) : (
              <p>No recent exceptions logged.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}