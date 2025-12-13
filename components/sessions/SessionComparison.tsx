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
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'aio_only' | 'has_changes'>('all');
  const [sortBy, setSortBy] = useState<'keyword' | 'change'>('keyword');

  useEffect(() => {
    const fetchComparison = async () => {
      setLoading(true);
      setError(null);

      try {
        const url = `/api/sessions/compare?projectId=${projectId}&sessionIds=${sessionIds.join(',')}&brandDomain=${encodeURIComponent(brandDomain)}`;
        console.log('Fetching comparison:', url);

        const response = await fetch(url);
        const result = await response.json();

        console.log('Comparison result:', result);

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || 'Unknown error');
        }
      } catch (err) {
        console.error('Error fetching comparison:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch comparison');
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
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <div className="gh-box rounded-md p-8 text-center" style={{ backgroundColor: 'var(--color-canvas-default)' }}>
          <div className="inline-block w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-accent-emphasis)' }} />
          <p className="mt-2" style={{ color: 'var(--color-fg-muted)' }}>Loading comparison...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <div className="gh-box rounded-md p-8 text-center max-w-md" style={{ backgroundColor: 'var(--color-canvas-default)' }}>
          <p className="font-medium" style={{ color: 'var(--color-danger-fg)' }}>Failed to load comparison data</p>
          {error && (
            <p className="text-sm mt-2" style={{ color: 'var(--color-fg-muted)' }}>{error}</p>
          )}
          <p className="text-sm mt-2" style={{ color: 'var(--color-fg-muted)' }}>
            Session IDs: {sessionIds.join(', ')}
          </p>
          <button onClick={onClose} className="mt-4 px-4 py-2 rounded-md" style={{ backgroundColor: 'var(--color-neutral-muted)' }}>
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
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onClick={onClose} />

      <div className="relative w-full max-w-7xl h-[90vh] mx-4 rounded-md flex flex-col" style={{
        backgroundColor: 'var(--color-canvas-default)',
        boxShadow: 'var(--color-shadow-large)'
      }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--color-border-default)' }}>
          <div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--color-fg-default)' }}>Session Comparison</h2>
            <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>
              Comparing {data.sessions.length} sessions across {data.keywords.length} keywords
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md transition-colors"
            style={{ color: 'var(--color-fg-muted)' }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Summary */}
        <div className="px-6 py-3 flex items-center gap-6 text-sm" style={{
          borderBottom: '1px solid var(--color-border-default)',
          backgroundColor: 'var(--color-canvas-subtle)'
        }}>
          <span style={{ color: 'var(--color-fg-muted)' }}>Changes from first to last:</span>
          {summary.improved > 0 && (
            <span className="flex items-center gap-1" style={{ color: 'var(--color-success-fg)' }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-success-emphasis)' }} />
              {summary.improved} rank improved
            </span>
          )}
          {summary.declined > 0 && (
            <span className="flex items-center gap-1" style={{ color: 'var(--color-danger-fg)' }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-danger-emphasis)' }} />
              {summary.declined} rank declined
            </span>
          )}
          {summary.gained > 0 && (
            <span className="flex items-center gap-1" style={{ color: 'var(--color-accent-fg)' }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-accent-emphasis)' }} />
              {summary.gained} AIO gained
            </span>
          )}
          {summary.lost > 0 && (
            <span className="flex items-center gap-1" style={{ color: 'var(--color-warning-fg)' }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-warning-emphasis)' }} />
              {summary.lost} AIO lost
            </span>
          )}
          {summary.new > 0 && (
            <span className="flex items-center gap-1" style={{ color: 'var(--color-accent-fg)' }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-accent-emphasis)' }} />
              {summary.new} new
            </span>
          )}
        </div>

        {/* Filters */}
        <div className="px-6 py-3 flex items-center gap-4" style={{ borderBottom: '1px solid var(--color-border-default)' }}>
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>Filter:</span>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as typeof filter)}
              className="px-2 py-1 text-sm rounded-md focus:outline-none"
              style={{ border: '1px solid var(--color-border-default)' }}
            >
              <option value="all">All keywords ({data.keywords.length})</option>
              <option value="aio_only">Has AIO</option>
              <option value="has_changes">Has changes</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="px-2 py-1 text-sm rounded-md focus:outline-none"
              style={{ border: '1px solid var(--color-border-default)' }}
            >
              <option value="keyword">Alphabetical</option>
              <option value="change">By change type</option>
            </select>
          </div>
          <span className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>
            Showing {filteredKeywords.length} keywords
          </span>
        </div>

        {/* Matrix table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10" style={{
              backgroundColor: 'var(--color-canvas-default)',
              boxShadow: 'var(--color-shadow-small)'
            }}>
              <tr>
                <th className="text-left p-3 font-medium min-w-[200px]" style={{
                  color: 'var(--color-fg-muted)',
                  backgroundColor: 'var(--color-canvas-subtle)'
                }}>
                  Keyword
                </th>
                <th className="text-center p-3 font-medium w-20" style={{
                  color: 'var(--color-fg-muted)',
                  backgroundColor: 'var(--color-canvas-subtle)'
                }}>
                  Change
                </th>
                {data.sessions.map(session => (
                  <th
                    key={session.id}
                    className="text-center p-3 font-medium min-w-[100px]"
                    style={{
                      color: 'var(--color-fg-muted)',
                      backgroundColor: 'var(--color-canvas-subtle)'
                    }}
                  >
                    <div className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>{formatDate(session.created_at)}</div>
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
                  <tr key={keyword} style={{ borderBottom: '1px solid var(--color-border-default)' }}>
                    <td className="p-3 font-medium" style={{ color: 'var(--color-fg-default)' }}>
                      {keyword}
                    </td>
                    <td className="p-3 text-center">
                      {change === 'improved' && (
                        <span className="inline-flex items-center gap-1" style={{ color: 'var(--color-success-fg)' }} title="Rank improved">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                        </span>
                      )}
                      {change === 'declined' && (
                        <span className="inline-flex items-center gap-1" style={{ color: 'var(--color-danger-fg)' }} title="Rank declined">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        </span>
                      )}
                      {change === 'gained' && (
                        <span className="px-1.5 py-0.5 text-xs rounded-md" style={{
                          backgroundColor: 'var(--color-accent-subtle)',
                          color: 'var(--color-accent-fg)'
                        }}>+AIO</span>
                      )}
                      {change === 'lost' && (
                        <span className="px-1.5 py-0.5 text-xs rounded-md" style={{
                          backgroundColor: 'var(--color-warning-subtle)',
                          color: 'var(--color-warning-fg)'
                        }}>-AIO</span>
                      )}
                      {change === 'new' && (
                        <span className="px-1.5 py-0.5 text-xs rounded-md" style={{
                          backgroundColor: 'var(--color-accent-subtle)',
                          color: 'var(--color-accent-fg)'
                        }}>New</span>
                      )}
                      {change === 'removed' && (
                        <span className="px-1.5 py-0.5 text-xs rounded-md" style={{
                          backgroundColor: 'var(--color-neutral-muted)',
                          color: 'var(--color-fg-muted)'
                        }}>Removed</span>
                      )}
                    </td>
                    {data.sessions.map(session => {
                      const cellData = data.matrix[keyword][session.id];

                      if (!cellData) {
                        return (
                          <td key={session.id} className="p-3 text-center" style={{ color: 'var(--color-neutral-muted)' }}>
                            -
                          </td>
                        );
                      }

                      return (
                        <td
                          key={session.id}
                          className="p-3 text-center cursor-pointer"
                          onClick={() => onViewKeyword(keyword, session.id)}
                        >
                          {cellData.hasAIO ? (
                            <div>
                              <span className="font-medium" style={{ color: 'var(--color-success-fg)' }}>AIO</span>
                              {cellData.brandRank && (
                                <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-md`}
                                  style={cellData.brandRank <= 3 ? {
                                    backgroundColor: 'var(--color-warning-subtle)',
                                    color: 'var(--color-warning-fg)'
                                  } : {
                                    backgroundColor: 'var(--color-neutral-muted)',
                                    color: 'var(--color-fg-muted)'
                                  }}
                                >
                                  #{cellData.brandRank}
                                </span>
                              )}
                              <div className="text-xs" style={{ color: 'var(--color-fg-subtle)' }}>
                                {cellData.referenceCount} refs
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--color-fg-subtle)' }}>No AIO</span>
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
        <div className="px-6 py-3 flex items-center gap-6 text-xs" style={{
          borderTop: '1px solid var(--color-border-default)',
          backgroundColor: 'var(--color-canvas-subtle)',
          color: 'var(--color-fg-muted)'
        }}>
          <span>Legend:</span>
          <span className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded-md" style={{
              backgroundColor: 'var(--color-warning-subtle)',
              color: 'var(--color-warning-fg)'
            }}>#1-3</span>
            = Brand in top 3
          </span>
          <span className="flex items-center gap-1">
            <span style={{ color: 'var(--color-success-fg)' }}>AIO</span>
            = Has AI Overview
          </span>
          <span>Click any cell to view details</span>
        </div>
      </div>
    </div>
  );
}
