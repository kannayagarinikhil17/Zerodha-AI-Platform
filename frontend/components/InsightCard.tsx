export default function InsightCard({ aiData }: { aiData: any }) {
  if (!aiData) return null;
  return (
    <div className="bg-blue-50 p-6 rounded-lg shadow-md border border-blue-200 mt-4">
      <h2 className="text-xl font-bold text-blue-900 mb-2">AI Financial Intelligence</h2>
      <p className="text-blue-800 mb-4">{aiData.portfolio_summary}</p>
      
      <h3 className="font-semibold text-blue-900">Top Driver</h3>
      <p className="text-blue-800 mb-4">{aiData.top_driver}</p>

      <h3 className="font-semibold text-blue-900">Recommended Review Areas</h3>
      <ul className="list-disc list-inside text-blue-800 mb-4">
        {aiData.recommended_review_areas.map((area: string, i: number) => (
          <li key={i}>{area}</li>
        ))}
      </ul>
      
      <div className="text-xs text-gray-500 mt-4 pt-4 border-t border-blue-200">
        <span className="font-bold">Confidence Score:</span> {aiData.confidence_score} <br />
        <span className="italic">{aiData.disclaimer}</span>
      </div>
    </div>
  );
}