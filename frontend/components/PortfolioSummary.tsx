export default function PortfolioSummary({ summary }: { summary: any }) {
  if (!summary) return null;
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Portfolio Snapshot</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Total Invested</p>
          <p className="text-lg font-semibold">₹{summary.total_invested_value.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Current Value</p>
          <p className="text-lg font-semibold text-blue-600">₹{summary.total_current_value.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Unrealized P&L</p>
          <p className={`text-lg font-semibold ${summary.total_unrealized_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ₹{summary.total_unrealized_pnl.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Overall Return</p>
          <p className={`text-lg font-semibold ${parseFloat(summary.overall_return_pct) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {summary.overall_return_pct}
          </p>
        </div>
      </div>
    </div>
  );
}