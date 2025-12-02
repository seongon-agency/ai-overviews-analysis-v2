'use client';

import { useState, useEffect } from 'react';
import { CheckSessionWithStats } from '@/lib/types';
import { RankSparkline } from '@/components/RankSparkline';

interface OverviewData {
  hasData: boolean;
  sessions: CheckSessionWithStats[];
  latestSession: CheckSessionWithStats | null;
  previousSession: CheckSessionWithStats | null;
  keywords: { keyword: string; hasAIO: boolean; brandRank: number | null; rankHistory: { rank: number | null }[] }[];
  stats: {
    totalKeywords: number;
    withAIO: number;
    aioRate: number;
    withBrandCited: number;
    brandCitationRate: number;
    topRanked: number;
    avgBrandRank: number | null;
  };
  changes: {
    keyword: string;
    changeType: string;
    oldHasAIO: boolean | null;
    newHasAIO: boolean | null;
    oldBrandRank: number | null;
    newBrandRank: number | null;
  }[] | null;
  changeSummary: {
    improved: number;
    declined: number;
    aioGained: number;
    aioLost: number;
    newKeywords: number;
    removed: number;
    totalChanges: number;
  } | null;
}

interface ProjectOverviewProps {
  projectId: number;
  brandDomain: string;
  onViewSession: (sessionId: number) => void;
  onViewKeyword: (keyword: string) => void;
  onCompare: () => void;
}

export function ProjectOverview({
  projectId,
  brandDomain,
  onViewSession,
  onViewKeyword,
  onCompare
}: ProjectOverviewProps) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/sessions/overview?projectId=${projectId}&brandDomain=${encodeURIComponent(brandDomain)}`
        );
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Error fetching overview:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, [projectId, brandDomain]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.hasData) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No data yet</h3>
        <p className="text-gray-500 mb-4">Fetch keywords or upload data to get started</p>
      </div>
    );
  }

  const { stats, changeSummary, changes, latestSession, previousSession } = data;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'rank_improved':
        return <span className="text-green-600">&#x2191;</span>;
      case 'rank_declined':
        return <span className="text-red-600">&#x2193;</span>;
      case 'aio_gained':
        return <span className="text-blue-600">+AIO</span>;
      case 'aio_lost':
        return <span className="text-orange-600">-AIO</span>;
      case 'new':
        return <span className="text-purple-600">NEW</span>;
      case 'removed':
        return <span className="text-gray-600">DEL</span>;
      default:
        return null;
    }
  };

  const getChangeLabel = (type: string) => {
    switch (type) {
      case 'rank_improved': return 'Rank improved';
      case 'rank_declined': return 'Rank declined';
      case 'aio_gained': return 'AIO appeared';
      case 'aio_lost': return 'AIO disappeared';
      case 'new': return 'New keyword';
      case 'removed': return 'Removed';
      default: return 'No change';
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="text-3xl font-bold text-gray-900">{stats.totalKeywords}</div>
          <div className="text-sm text-gray-500">Keywords tracked</div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="text-3xl font-bold text-green-600">{stats.withAIO}</div>
          <div className="text-sm text-gray-500">
            AI Overviews ({stats.aioRate.toFixed(0)}%)
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="text-3xl font-bold text-blue-600">{stats.withBrandCited}</div>
          <div className="text-sm text-gray-500">
            Brand cited ({stats.brandCitationRate.toFixed(0)}%)
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="text-3xl font-bold text-yellow-600">{stats.topRanked}</div>
          <div className="text-sm text-gray-500">Top 3 positions</div>
        </div>
      </div>

      {/* Changes Summary */}
      {changeSummary && changeSummary.totalChanges > 0 && previousSession && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Changes since last check</h3>
              <p className="text-sm text-gray-500">
                {formatDate(previousSession.created_at)} → {formatDate(latestSession!.created_at)}
              </p>
            </div>
            <button
              onClick={onCompare}
              className="px-3 py-1.5 text-sm bg-white border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors"
            >
              Full comparison
            </button>
          </div>

          {/* Change badges */}
          <div className="flex flex-wrap gap-3 mb-4">
            {changeSummary.improved > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                {changeSummary.improved} rank improved
              </div>
            )}
            {changeSummary.declined > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                {changeSummary.declined} rank declined
              </div>
            )}
            {changeSummary.aioGained > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {changeSummary.aioGained} AIO gained
              </div>
            )}
            {changeSummary.aioLost > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
                {changeSummary.aioLost} AIO lost
              </div>
            )}
          </div>

          {/* Top changes list */}
          {changes && changes.length > 0 && (
            <div className="bg-white rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-600">Keyword</th>
                    <th className="text-center p-3 font-medium text-gray-600">Trend</th>
                    <th className="text-center p-3 font-medium text-gray-600">Change</th>
                    <th className="text-center p-3 font-medium text-gray-600">Before</th>
                    <th className="text-center p-3 font-medium text-gray-600">After</th>
                  </tr>
                </thead>
                <tbody>
                  {changes.slice(0, 5).map((change, idx) => {
                    // Find the keyword's history data
                    const keywordData = data.keywords.find(k => k.keyword === change.keyword);
                    return (
                      <tr
                        key={idx}
                        className="border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                        onClick={() => onViewKeyword(change.keyword)}
                      >
                        <td className="p-3 font-medium text-gray-900">{change.keyword}</td>
                        <td className="p-3 text-center">
                          {keywordData?.rankHistory && keywordData.rankHistory.length >= 2 ? (
                            <RankSparkline data={keywordData.rankHistory} />
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                            change.changeType === 'rank_improved' ? 'bg-green-100 text-green-700' :
                            change.changeType === 'rank_declined' ? 'bg-red-100 text-red-700' :
                            change.changeType === 'aio_gained' ? 'bg-blue-100 text-blue-700' :
                            change.changeType === 'aio_lost' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {getChangeIcon(change.changeType)}
                            <span className="ml-1">{getChangeLabel(change.changeType)}</span>
                          </span>
                        </td>
                        <td className="p-3 text-center text-gray-500">
                          {change.oldHasAIO === false ? 'No AIO' :
                           change.oldBrandRank ? `#${change.oldBrandRank}` :
                           change.oldHasAIO ? 'Not cited' : '-'}
                        </td>
                        <td className="p-3 text-center">
                          {change.newHasAIO === false ? (
                            <span className="text-gray-400">No AIO</span>
                          ) : change.newBrandRank ? (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-sm font-medium">
                              #{change.newBrandRank}
                            </span>
                          ) : change.newHasAIO ? (
                            <span className="text-gray-500">Not cited</span>
                          ) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {changes.length > 5 && (
                <div className="p-3 text-center border-t bg-gray-50">
                  <button
                    onClick={onCompare}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    View all {changes.length} changes
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* No changes message */}
      {changeSummary && changeSummary.totalChanges === 0 && previousSession && (
        <div className="bg-gray-50 rounded-xl border p-5 text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="font-medium text-gray-900 mb-1">No changes detected</h3>
          <p className="text-sm text-gray-500">
            Results are stable since {formatDate(previousSession.created_at)}
          </p>
        </div>
      )}

      {/* Recent Sessions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Recent sessions</h3>
          {data.sessions.length > 3 && (
            <button className="text-sm text-blue-600 hover:text-blue-700">
              View all
            </button>
          )}
        </div>
        <div className="grid gap-3">
          {data.sessions.slice(0, 3).map((session, idx) => (
            <div
              key={session.id}
              onClick={() => onViewSession(session.id)}
              className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                idx === 0 ? 'bg-blue-50 border-blue-200' : 'bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  idx === 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {idx === 0 ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium">{idx + 1}</span>
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {session.name || `Session ${session.id}`}
                    {idx === 0 && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">Latest</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">{formatDate(session.created_at)}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-right">
                  <div className="font-medium text-gray-900">{session.keyword_count}</div>
                  <div className="text-gray-500">keywords</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-green-600">{session.aio_count}</div>
                  <div className="text-gray-500">AIO</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-blue-600">{session.aio_rate.toFixed(0)}%</div>
                  <div className="text-gray-500">rate</div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Brand Performance Summary */}
      {brandDomain && stats.withBrandCited > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Brand Performance: {brandDomain}</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.brandCitationRate.toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">Citation rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {stats.avgBrandRank?.toFixed(1) || '-'}
              </div>
              <div className="text-sm text-gray-600">Avg. rank</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {stats.topRanked}
              </div>
              <div className="text-sm text-gray-600">Top 3 citations</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
