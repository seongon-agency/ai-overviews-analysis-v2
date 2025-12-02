'use client';

interface SummaryCardsProps {
  totalKeywords: number;
  aiOverviewsFound: number;
  competitorsIdentified: number;
}

export function SummaryCards({
  totalKeywords,
  aiOverviewsFound,
  competitorsIdentified
}: SummaryCardsProps) {
  const aioRate = totalKeywords > 0 ? (aiOverviewsFound / totalKeywords) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="text-sm text-gray-500 mb-1">Total Keywords</div>
        <div className="text-2xl font-bold text-gray-900">{totalKeywords}</div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="text-sm text-gray-500 mb-1">AI Overviews Found</div>
        <div className="text-2xl font-bold text-green-600">{aiOverviewsFound}</div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="text-sm text-gray-500 mb-1">AIO Rate</div>
        <div className="text-2xl font-bold text-blue-600">{aioRate.toFixed(1)}%</div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="text-sm text-gray-500 mb-1">Competitors</div>
        <div className="text-2xl font-bold text-purple-600">{competitorsIdentified}</div>
      </div>
    </div>
  );
}
