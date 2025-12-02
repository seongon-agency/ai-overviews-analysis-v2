'use client';

import { useState, useEffect } from 'react';
import { CheckSession } from '@/lib/types';

interface ComparisonData {
  sessions: CheckSession[];
  keywords: string[];
  matrix: {
    [keyword: string]: {
      [sessionId: number]: {
        hasAIO: boolean;
        brandRank: number | null;
        referenceCount: number;
      } | null;
    };
  };
}

interface SessionComparisonProps {
  projectId: number;
  sessionIds: number[];
  brandDomain: string;
  onClose: () => void;
  onViewKeyword: (keyword: string, sessionId: number) => void;
}

export function SessionComparison({
  projectId,
  sessionIds,
  brandDomain,
  onClose,
  onViewKeyword
}: SessionComparisonProps) {
  const [data, setData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'aio_only' | 'has_changes'>('all');
  const [sortBy, setSortBy] = useState<'keyword' | 'change'>('keyword');

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        const response = await fetch(
          `/api/sessions/compare?projectId=${projectId}&sessionIds=${sessionIds.join(',')}&brandDomain=${encodeURIComponent(brandDomain)}`
        );
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Error fetching comparison:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [projectId, sessionIds, brandDomain]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getChangeIndicator = (keyword: string): 'improved' | 'declined' | 'gained' | 'lost' | 'new' | 'removed' | 'none' => {
    if (!data) return 'none';

    const sessions = data.sessions;
    const first = data.matrix[keyword][sessions[0].id];
    const last = data.matrix[keyword][sessions[sessions.length - 1].id];

    if (!first && last) return 'new';
    if (first && !last) return 'removed';
    if (!first?.hasAIO && last?.hasAIO) return 'gained';
    if (first?.hasAIO && !last?.hasAIO) return 'lost';

    if (first?.brandRank && last?.brandRank) {
      if (last.brandRank < first.brandRank) return 'improved';
      if (last.brandRank > first.brandRank) return 'declined';
    } else if (!first?.brandRank && last?.brandRank) {
      return 'improved';
    } else if (first?.brandRank && !last?.brandRank) {
      return 'declined';
    }

    return 'none';
  };

  const filterKeywords = (keywords: string[]) => {
    if (!data) return keywords;

    return keywords.filter(keyword => {
      if (filter === 'all') return true;

      const hasAnyAIO = data.sessions.some(s => data.matrix[keyword][s.id]?.hasAIO);
      if (filter === 'aio_only') return hasAnyAIO;

      if (filter === 'has_changes') {
        const change = getChangeIndicator(keyword);
        return change !== 'none';
      }

      return true;
    });
  };

  const sortKeywords = (keywords: string[]) => {
    if (sortBy === 'keyword') {
      return [...keywords].sort((a, b) => a.localeCompare(b));
    }

    // Sort by change type priority
    const changePriority: Record<string, number> = {
      improved: 1,
      gained: 2,
      new: 3,
      declined: 4,
      lost: 5,
      removed: 6,
      none: 7
    };

    return [...keywords].sort((a, b) => {
      const changeA = getChangeIndicator(a);
      const changeB = getChangeIndicator(b);
      return changePriority[changeA] - changePriority[changeB];
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl p-8 text-center">
          <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="mt-2 text-gray-600">Loading comparison...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl p-8 text-center">
          <p className="text-red-600">Failed to load comparison data</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
            Close
          </button>
        </div>
      </div>
    );
  }

  const filteredKeywords = sortKeywords(filterKeywords(data.keywords));

  // Calculate summary stats
  const summary = {
    improved: data.keywords.filter(k => getChangeIndicator(k) === 'improved').length,
    declined: data.keywords.filter(k => getChangeIndicator(k) === 'declined').length,
    gained: data.keywords.filter(k => getChangeIndicator(k) === 'gained').length,
    lost: data.keywords.filter(k => getChangeIndicator(k) === 'lost').length,
    new: data.keywords.filter(k => getChangeIndicator(k) === 'new').length,
    removed: data.keywords.filter(k => getChangeIndicator(k) === 'removed').length
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-7xl h-[90vh] mx-4 bg-white rounded-xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Session Comparison</h2>
            <p className="text-sm text-gray-500">
              Comparing {data.sessions.length} sessions across {data.keywords.length} keywords
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Summary */}
        <div className="px-6 py-3 border-b bg-gray-50 flex items-center gap-6 text-sm">
          <span className="text-gray-600">Changes from first to last:</span>
          {summary.improved > 0 && (
            <span className="flex items-center gap-1 text-green-600">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              {summary.improved} rank improved
            </span>
          )}
          {summary.declined > 0 && (
            <span className="flex items-center gap-1 text-red-600">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {summary.declined} rank declined
            </span>
          )}
          {summary.gained > 0 && (
            <span className="flex items-center gap-1 text-blue-600">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {summary.gained} AIO gained
            </span>
          )}
          {summary.lost > 0 && (
            <span className="flex items-center gap-1 text-orange-600">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              {summary.lost} AIO lost
            </span>
          )}
          {summary.new > 0 && (
            <span className="flex items-center gap-1 text-purple-600">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              {summary.new} new
            </span>
          )}
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Filter:</span>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as typeof filter)}
              className="px-2 py-1 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All keywords ({data.keywords.length})</option>
              <option value="aio_only">Has AIO</option>
              <option value="has_changes">Has changes</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="px-2 py-1 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="keyword">Alphabetical</option>
              <option value="change">By change type</option>
            </select>
          </div>
          <span className="text-sm text-gray-500">
            Showing {filteredKeywords.length} keywords
          </span>
        </div>

        {/* Matrix table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white shadow-sm z-10">
              <tr>
                <th className="text-left p-3 font-medium text-gray-700 bg-gray-50 min-w-[200px]">
                  Keyword
                </th>
                <th className="text-center p-3 font-medium text-gray-700 bg-gray-50 w-20">
                  Change
                </th>
                {data.sessions.map(session => (
                  <th
                    key={session.id}
                    className="text-center p-3 font-medium text-gray-700 bg-gray-50 min-w-[100px]"
                  >
                    <div className="text-xs text-gray-500">{formatDate(session.created_at)}</div>
                    <div className="truncate" title={session.name || undefined}>
                      {session.name || `Session ${session.id}`}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredKeywords.map(keyword => {
                const change = getChangeIndicator(keyword);

                return (
                  <tr key={keyword} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-900">
                      {keyword}
                    </td>
                    <td className="p-3 text-center">
                      {change === 'improved' && (
                        <span className="inline-flex items-center gap-1 text-green-600" title="Rank improved">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                        </span>
                      )}
                      {change === 'declined' && (
                        <span className="inline-flex items-center gap-1 text-red-600" title="Rank declined">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        </span>
                      )}
                      {change === 'gained' && (
                        <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">+AIO</span>
                      )}
                      {change === 'lost' && (
                        <span className="px-1.5 py-0.5 text-xs bg-orange-100 text-orange-700 rounded">-AIO</span>
                      )}
                      {change === 'new' && (
                        <span className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">New</span>
                      )}
                      {change === 'removed' && (
                        <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">Removed</span>
                      )}
                    </td>
                    {data.sessions.map(session => {
                      const cellData = data.matrix[keyword][session.id];

                      if (!cellData) {
                        return (
                          <td key={session.id} className="p-3 text-center text-gray-300">
                            -
                          </td>
                        );
                      }

                      return (
                        <td
                          key={session.id}
                          className="p-3 text-center cursor-pointer hover:bg-blue-50"
                          onClick={() => onViewKeyword(keyword, session.id)}
                        >
                          {cellData.hasAIO ? (
                            <div>
                              <span className="text-green-600 font-medium">AIO</span>
                              {cellData.brandRank && (
                                <span className={`ml-1 px-1.5 py-0.5 text-xs rounded ${
                                  cellData.brandRank <= 3
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  #{cellData.brandRank}
                                </span>
                              )}
                              <div className="text-xs text-gray-400">
                                {cellData.referenceCount} refs
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">No AIO</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="px-6 py-3 border-t bg-gray-50 flex items-center gap-6 text-xs text-gray-500">
          <span>Legend:</span>
          <span className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded">#1-3</span>
            = Brand in top 3
          </span>
          <span className="flex items-center gap-1">
            <span className="text-green-600">AIO</span>
            = Has AI Overview
          </span>
          <span>Click any cell to view details</span>
        </div>
      </div>
    </div>
  );
}
