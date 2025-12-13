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
        <div className="inline-block w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-accent-emphasis)' }} />
      </div>
    );
  }

  if (!data?.hasData) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-neutral-muted)' }}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-fg-subtle)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--color-fg-default)' }}>No data yet</h3>
        <p className="mb-4" style={{ color: 'var(--color-fg-muted)' }}>Fetch keywords or upload data to get started</p>
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
        <div className="gh-box rounded-md p-4" style={{
          backgroundColor: 'var(--color-canvas-default)',
          boxShadow: 'var(--color-shadow-small)'
        }}>
          <div className="text-3xl font-bold" style={{ color: 'var(--color-fg-default)' }}>{stats.totalKeywords}</div>
          <div className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>Keywords tracked</div>
        </div>
        <div className="gh-box rounded-md p-4" style={{
          backgroundColor: 'var(--color-canvas-default)',
          boxShadow: 'var(--color-shadow-small)'
        }}>
          <div className="text-3xl font-bold" style={{ color: 'var(--color-success-fg)' }}>{stats.withAIO}</div>
          <div className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>
            AI Overviews ({stats.aioRate.toFixed(0)}%)
          </div>
        </div>
        <div className="gh-box rounded-md p-4" style={{
          backgroundColor: 'var(--color-canvas-default)',
          boxShadow: 'var(--color-shadow-small)'
        }}>
          <div className="text-3xl font-bold" style={{ color: 'var(--color-accent-fg)' }}>{stats.withBrandCited}</div>
          <div className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>
            Brand cited ({stats.brandCitationRate.toFixed(0)}%)
          </div>
        </div>
        <div className="gh-box rounded-md p-4" style={{
          backgroundColor: 'var(--color-canvas-default)',
          boxShadow: 'var(--color-shadow-small)'
        }}>
          <div className="text-3xl font-bold" style={{ color: 'var(--color-warning-fg)' }}>{stats.topRanked}</div>
          <div className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>Top 3 positions</div>
        </div>
      </div>

      {/* Changes Summary */}
      {changeSummary && changeSummary.totalChanges > 0 && previousSession && (
        <div className="gh-box rounded-md p-5" style={{
          background: 'linear-gradient(to right, var(--color-accent-subtle), var(--color-accent-subtle))',
          borderColor: 'var(--color-accent-muted)'
        }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold" style={{ color: 'var(--color-fg-default)' }}>Changes since last check</h3>
              <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>
                {formatDate(previousSession.created_at)} → {formatDate(latestSession!.created_at)}
              </p>
            </div>
            <button
              onClick={onCompare}
              className="px-3 py-1.5 text-sm rounded-md transition-colors"
              style={{
                backgroundColor: 'var(--color-canvas-default)',
                border: '1px solid var(--color-accent-muted)',
                color: 'var(--color-accent-fg)'
              }}
            >
              Full comparison
            </button>
          </div>

          {/* Change badges */}
          <div className="flex flex-wrap gap-3 mb-4">
            {changeSummary.improved > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium" style={{
                backgroundColor: 'var(--color-success-subtle)',
                color: 'var(--color-success-fg)'
              }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                {changeSummary.improved} rank improved
              </div>
            )}
            {changeSummary.declined > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium" style={{
                backgroundColor: 'var(--color-danger-subtle)',
                color: 'var(--color-danger-fg)'
              }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                {changeSummary.declined} rank declined
              </div>
            )}
            {changeSummary.aioGained > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium" style={{
                backgroundColor: 'var(--color-accent-subtle)',
                color: 'var(--color-accent-fg)'
              }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {changeSummary.aioGained} AIO gained
              </div>
            )}
            {changeSummary.aioLost > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium" style={{
                backgroundColor: 'var(--color-warning-subtle)',
                color: 'var(--color-warning-fg)'
              }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
                {changeSummary.aioLost} AIO lost
              </div>
            )}
          </div>

          {/* Top changes list */}
          {changes && changes.length > 0 && (
            <div className="gh-box rounded-md overflow-hidden" style={{ backgroundColor: 'var(--color-canvas-default)' }}>
              <table className="w-full text-sm">
                <thead style={{
                  backgroundColor: 'var(--color-canvas-subtle)',
                  borderBottom: '1px solid var(--color-border-default)'
                }}>
                  <tr>
                    <th className="text-left p-3 font-medium" style={{ color: 'var(--color-fg-muted)' }}>Keyword</th>
                    <th className="text-center p-3 font-medium" style={{ color: 'var(--color-fg-muted)' }}>Trend</th>
                    <th className="text-center p-3 font-medium" style={{ color: 'var(--color-fg-muted)' }}>Change</th>
                    <th className="text-center p-3 font-medium" style={{ color: 'var(--color-fg-muted)' }}>Before</th>
                    <th className="text-center p-3 font-medium" style={{ color: 'var(--color-fg-muted)' }}>After</th>
                  </tr>
                </thead>
                <tbody>
                  {changes.slice(0, 5).map((change, idx) => {
                    // Find the keyword's history data
                    const keywordData = data.keywords.find(k => k.keyword === change.keyword);
                    return (
                      <tr
                        key={idx}
                        className="cursor-pointer"
                        style={{
                          borderBottom: idx < 4 ? '1px solid var(--color-border-default)' : 'none'
                        }}
                        onClick={() => onViewKeyword(change.keyword)}
                      >
                        <td className="p-3 font-medium" style={{ color: 'var(--color-fg-default)' }}>{change.keyword}</td>
                        <td className="p-3 text-center">
                          {keywordData?.rankHistory && keywordData.rankHistory.length >= 2 ? (
                            <RankSparkline data={keywordData.rankHistory} />
                          ) : (
                            <span style={{ color: 'var(--color-neutral-muted)' }}>-</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
                            style={
                              change.changeType === 'rank_improved' ? {
                                backgroundColor: 'var(--color-success-subtle)',
                                color: 'var(--color-success-fg)'
                              } : change.changeType === 'rank_declined' ? {
                                backgroundColor: 'var(--color-danger-subtle)',
                                color: 'var(--color-danger-fg)'
                              } : change.changeType === 'aio_gained' ? {
                                backgroundColor: 'var(--color-accent-subtle)',
                                color: 'var(--color-accent-fg)'
                              } : change.changeType === 'aio_lost' ? {
                                backgroundColor: 'var(--color-warning-subtle)',
                                color: 'var(--color-warning-fg)'
                              } : {
                                backgroundColor: 'var(--color-neutral-muted)',
                                color: 'var(--color-fg-muted)'
                              }
                            }
                          >
                            {getChangeIcon(change.changeType)}
                            <span className="ml-1">{getChangeLabel(change.changeType)}</span>
                          </span>
                        </td>
                        <td className="p-3 text-center" style={{ color: 'var(--color-fg-muted)' }}>
                          {change.oldHasAIO === false ? 'No AIO' :
                           change.oldBrandRank ? `#${change.oldBrandRank}` :
                           change.oldHasAIO ? 'Not cited' : '-'}
                        </td>
                        <td className="p-3 text-center">
                          {change.newHasAIO === false ? (
                            <span style={{ color: 'var(--color-fg-subtle)' }}>No AIO</span>
                          ) : change.newBrandRank ? (
                            <span className="px-2 py-0.5 rounded-md text-sm font-medium" style={{
                              backgroundColor: 'var(--color-warning-subtle)',
                              color: 'var(--color-warning-fg)'
                            }}>
                              #{change.newBrandRank}
                            </span>
                          ) : change.newHasAIO ? (
                            <span style={{ color: 'var(--color-fg-muted)' }}>Not cited</span>
                          ) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {changes.length > 5 && (
                <div className="p-3 text-center" style={{
                  borderTop: '1px solid var(--color-border-default)',
                  backgroundColor: 'var(--color-canvas-subtle)'
                }}>
                  <button
                    onClick={onCompare}
                    className="text-sm font-medium"
                    style={{ color: 'var(--color-accent-fg)' }}
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
        <div className="gh-box rounded-md p-5 text-center" style={{ backgroundColor: 'var(--color-canvas-subtle)' }}>
          <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-neutral-muted)' }}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-fg-subtle)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="font-medium mb-1" style={{ color: 'var(--color-fg-default)' }}>No changes detected</h3>
          <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>
            Results are stable since {formatDate(previousSession.created_at)}
          </p>
        </div>
      )}

      {/* Recent Sessions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold" style={{ color: 'var(--color-fg-default)' }}>Recent sessions</h3>
          {data.sessions.length > 3 && (
            <button className="text-sm" style={{ color: 'var(--color-accent-fg)' }}>
              View all
            </button>
          )}
        </div>
        <div className="grid gap-3">
          {data.sessions.slice(0, 3).map((session, idx) => (
            <div
              key={session.id}
              onClick={() => onViewSession(session.id)}
              className="gh-box flex items-center justify-between p-4 rounded-md cursor-pointer transition-all"
              style={idx === 0 ? {
                backgroundColor: 'var(--color-accent-subtle)',
                borderColor: 'var(--color-accent-muted)'
              } : {
                backgroundColor: 'var(--color-canvas-default)'
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={idx === 0 ? {
                  backgroundColor: 'var(--color-accent-muted)',
                  color: 'var(--color-accent-fg)'
                } : {
                  backgroundColor: 'var(--color-neutral-muted)',
                  color: 'var(--color-fg-muted)'
                }}>
                  {idx === 0 ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium">{idx + 1}</span>
                  )}
                </div>
                <div>
                  <div className="font-medium" style={{ color: 'var(--color-fg-default)' }}>
                    {session.name || `Session ${session.id}`}
                    {idx === 0 && (
                      <span className="ml-2 px-2 py-0.5 text-xs rounded-md" style={{
                        backgroundColor: 'var(--color-accent-muted)',
                        color: 'var(--color-accent-fg)'
                      }}>Latest</span>
                    )}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>{formatDate(session.created_at)}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-right">
                  <div className="font-medium" style={{ color: 'var(--color-fg-default)' }}>{session.keyword_count}</div>
                  <div style={{ color: 'var(--color-fg-muted)' }}>keywords</div>
                </div>
                <div className="text-right">
                  <div className="font-medium" style={{ color: 'var(--color-success-fg)' }}>{session.aio_count}</div>
                  <div style={{ color: 'var(--color-fg-muted)' }}>AIO</div>
                </div>
                <div className="text-right">
                  <div className="font-medium" style={{ color: 'var(--color-accent-fg)' }}>{session.aio_rate.toFixed(0)}%</div>
                  <div style={{ color: 'var(--color-fg-muted)' }}>rate</div>
                </div>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-fg-subtle)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Brand Performance Summary */}
      {brandDomain && stats.withBrandCited > 0 && (
        <div className="gh-box rounded-md p-5" style={{
          background: 'linear-gradient(to right, var(--color-warning-subtle), var(--color-warning-subtle))',
          borderColor: 'var(--color-warning-muted)'
        }}>
          <h3 className="font-semibold mb-3" style={{ color: 'var(--color-fg-default)' }}>Brand Performance: {brandDomain}</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-warning-fg)' }}>
                {stats.brandCitationRate.toFixed(0)}%
              </div>
              <div className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>Citation rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-warning-fg)' }}>
                {stats.avgBrandRank?.toFixed(1) || '-'}
              </div>
              <div className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>Avg. rank</div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-success-fg)' }}>
                {stats.topRanked}
              </div>
              <div className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>Top 3 citations</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
