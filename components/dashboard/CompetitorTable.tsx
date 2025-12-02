'use client';

import { useState } from 'react';
import { CompetitorMetrics } from '@/lib/types';

interface CompetitorTableProps {
  competitors: CompetitorMetrics[];
  brandName: string;
}

type SortField = 'brand' | 'citedCount' | 'mentionedCount' | 'averageRank' | 'promptCitedRate' | 'mentionRate';

export function CompetitorTable({ competitors, brandName }: CompetitorTableProps) {
  const [sortField, setSortField] = useState<SortField>('citedCount');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortedCompetitors = [...competitors].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'brand':
        comparison = a.brand.localeCompare(b.brand);
        break;
      case 'citedCount':
        comparison = a.citedCount - b.citedCount;
        break;
      case 'mentionedCount':
        comparison = a.mentionedCount - b.mentionedCount;
        break;
      case 'averageRank':
        comparison = a.averageRank - b.averageRank;
        break;
      case 'promptCitedRate':
        comparison = a.promptCitedRate - b.promptCitedRate;
        break;
      case 'mentionRate':
        comparison = a.mentionRate - b.mentionRate;
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="text-gray-300 ml-1">↕</span>;
    }
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  const isUserBrand = (brand: string) => brand.toLowerCase() === brandName.toLowerCase();

  return (
    <div className="bg-white rounded-lg shadow border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3 font-medium text-gray-700">#</th>
              <th
                className="text-left p-3 font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('brand')}
              >
                Brand <SortIcon field="brand" />
              </th>
              <th
                className="text-center p-3 font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('citedCount')}
              >
                Citations <SortIcon field="citedCount" />
              </th>
              <th
                className="text-center p-3 font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('mentionedCount')}
              >
                Mentions <SortIcon field="mentionedCount" />
              </th>
              <th
                className="text-center p-3 font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('averageRank')}
              >
                Avg Rank <SortIcon field="averageRank" />
              </th>
              <th
                className="text-center p-3 font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('promptCitedRate')}
              >
                Citation Rate <SortIcon field="promptCitedRate" />
              </th>
              <th
                className="text-center p-3 font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('mentionRate')}
              >
                Mention Rate <SortIcon field="mentionRate" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedCompetitors.map((competitor, index) => (
              <tr
                key={competitor.brand}
                className={`
                  border-b last:border-b-0 hover:bg-gray-50
                  ${isUserBrand(competitor.brand) ? 'bg-yellow-50' : ''}
                `}
              >
                <td className="p-3 text-gray-500">{index + 1}</td>
                <td className="p-3">
                  <span className="font-medium text-gray-900">
                    {competitor.brand}
                  </span>
                  {isUserBrand(competitor.brand) && (
                    <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded">
                      Your Brand
                    </span>
                  )}
                </td>
                <td className="p-3 text-center font-medium text-blue-600">
                  {competitor.citedCount}
                </td>
                <td className="p-3 text-center font-medium text-purple-600">
                  {competitor.mentionedCount}
                </td>
                <td className="p-3 text-center text-gray-600">
                  {competitor.averageRank.toFixed(1)}
                </td>
                <td className="p-3 text-center text-gray-600">
                  {(competitor.promptCitedRate * 100).toFixed(1)}%
                </td>
                <td className="p-3 text-center text-gray-600">
                  {(competitor.mentionRate * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
