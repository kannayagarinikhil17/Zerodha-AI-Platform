"use client";

import { useState } from "react";

export default function ComplianceDashboard() {
  // Mocking audit logs for UI demonstration
  const [logs, setLogs] = useState([
    {
      id: "JOB-9021",
      timestamp: "2026-08-07 10:45:00",
      user_id: "user_1",
      action: "Generate Portfolio Insight",
      status: "APPROVED",
      policy_flag: "None",
      reviewer: "Auto"
    },
    {
      id: "JOB-9020",
      timestamp: "2026-08-07 10:42:15",
      user_id: "user_1",
      action: "Risk Alert Triggered",
      status: "FLAGGED",
      policy_flag: "High Concentration",
      reviewer: "Pending Review"
    }
  ]);

  return (
    <main className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 border-b pb-4">
          <h1 className="text-3xl font-extrabold text-gray-900">Compliance & Audit Panel</h1>
          <p className="text-gray-500 mt-1">Disclaimers, decision logs, source traceability, and output review history</p>
        </header>

        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job ID / Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status / Flag</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviewer</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {log.id}
                    <div className="text-xs text-gray-500">{log.timestamp}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.user_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.action}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {log.status}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">{log.policy_flag}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.reviewer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}