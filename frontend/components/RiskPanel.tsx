export default function RiskPanel({ alerts }: { alerts: any[] }) {
  if (!alerts || alerts.length === 0) return null;
  return (
    <div className="bg-red-50 p-6 rounded-lg shadow-md border border-red-200 mt-4">
      <h2 className="text-xl font-bold text-red-800 mb-4">Risk & Exposure Alerts</h2>
      <ul className="space-y-3">
        {alerts.map((alert, idx) => (
          <li key={idx} className="flex items-start">
            <span className="text-red-600 font-bold mr-2">⚠️</span>
            <span className="text-red-700">{alert.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}