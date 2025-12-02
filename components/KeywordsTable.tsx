'use client';

import { useState } from 'react';
import { KeywordRecord, Reference } from '@/lib/types';
import { KeywordPanel } from './KeywordPanel';

interface KeywordsTableProps {
  keywords: KeywordRecord[];
  brandDomain?: string;
}

export function KeywordsTable({ keywords, brandDomain }: KeywordsTableProps) {
  const [selectedKeyword, setSelectedKeyword] = useState<KeywordRecord | null>(null);
  const [sortField, setSortField] = useState<'keyword' | 'referenceCount' | 'brandRank'>('keyword');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterAIO, setFilterAIO] = useState<boolean | null>(null);

  // Sort and filter keywords
  const processedKeywords = [...keywords]
    .filter(kw => {
      if (filterAIO === null) return true;
      return kw.hasAIOverview === filterAIO;
    })
    .sort((a, b) => {
      let comparison = 0;

      if (sortField === 'keyword') {
        comparison = a.keyword.localeCompare(b.keyword);
      } else if (sortField === 'referenceCount') {
        comparison = a.referenceCount - b.referenceCount;
      } else if (sortField === 'brandRank') {
        // Null values go to the end
        if (a.brandRank === null && b.brandRank === null) comparison = 0;
        else if (a.brandRank === null) comparison = 1;
        else if (b.brandRank === null) comparison = -1;
        else comparison = a.brandRank - b.brandRank;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) {
      return <span className="text-gray-300 ml-1">↕</span>;
    }
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="w-full">
      {/* Filters */}
      <div className="mb-4 flex gap-4 items-center">
        <div className="text-sm text-gray-600">
          Showing {processedKeywords.length} of {keywords.length} keywords
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterAIO(filterAIO === true ? null : true)}
            className={`px-3 py-1 text-sm rounded-full border transition-colors ${
              filterAIO === true
                ? 'bg-green-100 border-green-300 text-green-700'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Has AI Overview
          </button>
          <button
            onClick={() => setFilterAIO(filterAIO === false ? null : false)}
            className={`px-3 py-1 text-sm rounded-full border transition-colors ${
              filterAIO === false
                ? 'bg-red-100 border-red-300 text-red-700'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            No AI Overview
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th
                className="text-left p-3 font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('keyword')}
              >
                Keyword <SortIcon field="keyword" />
              </th>
              <th className="text-center p-3 font-medium text-gray-700 w-24">
                AIO
              </th>
              <th
                className="text-center p-3 font-medium text-gray-700 w-28 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('referenceCount')}
              >
                Citations <SortIcon field="referenceCount" />
              </th>
              <th
                className="text-center p-3 font-medium text-gray-700 w-32 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('brandRank')}
              >
                Brand Rank <SortIcon field="brandRank" />
              </th>
              <th className="text-center p-3 font-medium text-gray-700 w-24">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {processedKeywords.map((kw) => (
              <tr
                key={kw.id}
                className="border-b last:border-b-0 hover:bg-gray-50 transition-colors"
              >
                <td className="p-3">
                  <span className="font-medium text-gray-900">{kw.keyword}</span>
                </td>
                <td className="p-3 text-center">
                  {kw.hasAIOverview ? (
                    <span className="text-green-600 font-medium">✓</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="p-3 text-center text-gray-600">
                  {kw.referenceCount || '-'}
                </td>
                <td className="p-3 text-center">
                  {kw.brandRank ? (
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-sm font-medium">
                      #{kw.brandRank}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="p-3 text-center">
                  {kw.hasAIOverview ? (
                    <button
                      onClick={() => setSelectedKeyword(kw)}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      View
                    </button>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {processedKeywords.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No keywords found matching the filter criteria
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selectedKeyword && (
        <KeywordPanel
          keyword={selectedKeyword.keyword}
          aioMarkdown={selectedKeyword.aioMarkdown}
          references={selectedKeyword.references}
          brandDomain={brandDomain}
          onClose={() => setSelectedKeyword(null)}
        />
      )}
    </div>
  );
}
