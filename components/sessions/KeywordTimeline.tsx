'use client';

import { useState, useEffect } from 'react';
import { Reference } from '@/lib/types';

interface HistoryEntry {
  sessionId: number;
  sessionName: string | null;
  sessionDate: string;
  hasAIOverview: boolean;
  aioMarkdown: string | null;
  references: Reference[];
  referenceCount: number;
  brandRank: number | null;
}

interface KeywordTimelineProps {
  projectId: number;
  keyword: string;
  brandDomain: string;
  onClose: () => void;
  onViewSession: (sessionId: number) => void;
}

export function KeywordTimeline({
  projectId,
  keyword,
  brandDomain,
  onClose,
  onViewSession
}: KeywordTimelineProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // Fetch all sessions for this project
        const sessionsResponse = await fetch(`/api/sessions?projectId=${projectId}`);
        const sessionsResult = await sessionsResponse.json();

        if (!sessionsResult.success) {
          setLoading(false);
          return;
        }

        // For each session, check if this keyword exists
        const historyEntries: HistoryEntry[] = [];

        for (const session of sessionsResult.data) {
          const sessionResponse = await fetch(
            `/api/sessions/${session.id}?brandDomain=${encodeURIComponent(brandDomain)}`
          );
          const sessionResult = await sessionResponse.json();

          if (sessionResult.success) {
            const keywordData = sessionResult.data.keywords.find(
              (k: { keyword: string }) => k.keyword === keyword
            );

            if (keywordData) {
              historyEntries.push({
                sessionId: session.id,
                sessionName: session.name,
                sessionDate: session.created_at,
                hasAIOverview: keywordData.hasAIOverview,
                aioMarkdown: keywordData.aioMarkdown,
                references: keywordData.references,
                referenceCount: keywordData.referenceCount,
                brandRank: keywordData.brandRank
              });
            }
          }
        }

        // Sort by date (newest first)
        historyEntries.sort((a, b) =>
          new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()
        );

        setHistory(historyEntries);
        if (historyEntries.length > 0) {
          setSelectedEntry(historyEntries[0]);
        }
      } catch (error) {
        console.error('Error fetching keyword history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [projectId, keyword, brandDomain]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getChangeFromPrevious = (index: number): 'improved' | 'declined' | 'gained' | 'lost' | 'same' | null => {
    if (index >= history.length - 1) return null;

    const current = history[index];
    const previous = history[index + 1];

    if (!previous.hasAIOverview && current.hasAIOverview) return 'gained';
    if (previous.hasAIOverview && !current.hasAIOverview) return 'lost';

    if (previous.brandRank && current.brandRank) {
      if (current.brandRank < previous.brandRank) return 'improved';
      if (current.brandRank > previous.brandRank) return 'declined';
    } else if (!previous.brandRank && current.brandRank) {
      return 'improved';
    } else if (previous.brandRank && !current.brandRank) {
      return 'declined';
    }

    return 'same';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <div className="gh-box rounded-md p-8 text-center" style={{ backgroundColor: 'var(--color-canvas-default)' }}>
          <div className="inline-block w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-accent-emphasis)' }} />
          <p className="mt-2" style={{ color: 'var(--color-fg-muted)' }}>Loading keyword history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onClick={onClose} />

      <div className="relative w-full max-w-5xl h-[85vh] mx-4 rounded-md flex flex-col" style={{
        backgroundColor: 'var(--color-canvas-default)',
        boxShadow: 'var(--color-shadow-large)'
      }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--color-border-default)' }}>
          <div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--color-fg-default)' }}>Keyword Timeline</h2>
            <p className="text-lg mt-1" style={{ color: 'var(--color-accent-fg)' }}>&quot;{keyword}&quot;</p>
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

        {history.length === 0 ? (
          <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--color-fg-muted)' }}>
            No history found for this keyword
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Timeline sidebar */}
            <div className="w-80 overflow-y-auto p-4" style={{ borderRight: '1px solid var(--color-border-default)' }}>
              <h3 className="text-sm font-medium uppercase tracking-wide mb-4" style={{ color: 'var(--color-fg-muted)' }}>
                {history.length} Check{history.length !== 1 ? 's' : ''}
              </h3>

              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-6 bottom-6 w-0.5" style={{ backgroundColor: 'var(--color-border-default)' }} />

                {history.map((entry, index) => {
                  const change = getChangeFromPrevious(index);
                  const isSelected = selectedEntry?.sessionId === entry.sessionId;

                  return (
                    <div
                      key={entry.sessionId}
                      className={`relative pl-10 pb-6 cursor-pointer ${
                        isSelected ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                      }`}
                      onClick={() => setSelectedEntry(entry)}
                    >
                      {/* Timeline dot */}
                      <div
                        className="absolute left-2 w-5 h-5 rounded-full border-2"
                        style={entry.hasAIOverview ? {
                          backgroundColor: 'var(--color-success-subtle)',
                          borderColor: 'var(--color-success-emphasis)',
                          ...(isSelected && {
                            boxShadow: '0 0 0 2px var(--color-accent-emphasis), 0 0 0 4px var(--color-canvas-default)'
                          })
                        } : {
                          backgroundColor: 'var(--color-neutral-muted)',
                          borderColor: 'var(--color-border-default)',
                          ...(isSelected && {
                            boxShadow: '0 0 0 2px var(--color-accent-emphasis), 0 0 0 4px var(--color-canvas-default)'
                          })
                        }}
                      />

                      <div className="p-3 rounded-md" style={isSelected ? {
                        backgroundColor: 'var(--color-accent-subtle)',
                        border: '1px solid var(--color-accent-muted)'
                      } : {
                        backgroundColor: 'var(--color-canvas-subtle)'
                      }}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate" style={{ color: 'var(--color-fg-default)' }}>
                            {entry.sessionName || `Session ${entry.sessionId}`}
                          </span>
                          {change && change !== 'same' && (
                            <span className="text-xs px-1.5 py-0.5 rounded-md" style={
                              change === 'improved' ? {
                                backgroundColor: 'var(--color-success-subtle)',
                                color: 'var(--color-success-fg)'
                              } : change === 'declined' ? {
                                backgroundColor: 'var(--color-danger-subtle)',
                                color: 'var(--color-danger-fg)'
                              } : change === 'gained' ? {
                                backgroundColor: 'var(--color-accent-subtle)',
                                color: 'var(--color-accent-fg)'
                              } : {
                                backgroundColor: 'var(--color-warning-subtle)',
                                color: 'var(--color-warning-fg)'
                              }
                            }>
                              {change === 'improved' ? 'Rank Up' :
                               change === 'declined' ? 'Rank Down' :
                               change === 'gained' ? '+AIO' : '-AIO'}
                            </span>
                          )}
                        </div>
                        <div className="text-xs mt-1" style={{ color: 'var(--color-fg-muted)' }}>
                          {formatDate(entry.sessionDate)}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span style={{ color: entry.hasAIOverview ? 'var(--color-success-fg)' : 'var(--color-fg-subtle)' }}>
                            {entry.hasAIOverview ? 'Has AIO' : 'No AIO'}
                          </span>
                          {entry.brandRank && (
                            <span style={{ color: 'var(--color-warning-fg)' }}>
                              Brand #{entry.brandRank}
                            </span>
                          )}
                          {entry.referenceCount > 0 && (
                            <span style={{ color: 'var(--color-fg-muted)' }}>
                              {entry.referenceCount} refs
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detail view */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedEntry ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--color-fg-default)' }}>
                        {selectedEntry.sessionName || `Session ${selectedEntry.sessionId}`}
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>
                        {formatDate(selectedEntry.sessionDate)}
                      </p>
                    </div>
                    <button
                      onClick={() => onViewSession(selectedEntry.sessionId)}
                      className="px-3 py-1.5 text-sm rounded-md transition-colors"
                      style={{
                        backgroundColor: 'var(--color-accent-subtle)',
                        color: 'var(--color-accent-fg)'
                      }}
                    >
                      View Full Session
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="gh-box rounded-md p-3" style={{ backgroundColor: 'var(--color-canvas-subtle)' }}>
                      <div className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>AI Overview</div>
                      <div className="text-lg font-semibold" style={{
                        color: selectedEntry.hasAIOverview ? 'var(--color-success-fg)' : 'var(--color-fg-subtle)'
                      }}>
                        {selectedEntry.hasAIOverview ? 'Yes' : 'No'}
                      </div>
                    </div>
                    <div className="gh-box rounded-md p-3" style={{ backgroundColor: 'var(--color-canvas-subtle)' }}>
                      <div className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>Brand Rank</div>
                      <div className="text-lg font-semibold" style={{
                        color: selectedEntry.brandRank ? 'var(--color-warning-fg)' : 'var(--color-fg-subtle)'
                      }}>
                        {selectedEntry.brandRank ? `#${selectedEntry.brandRank}` : 'Not cited'}
                      </div>
                    </div>
                    <div className="gh-box rounded-md p-3" style={{ backgroundColor: 'var(--color-canvas-subtle)' }}>
                      <div className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>References</div>
                      <div className="text-lg font-semibold" style={{ color: 'var(--color-fg-default)' }}>
                        {selectedEntry.referenceCount}
                      </div>
                    </div>
                  </div>

                  {/* References list */}
                  {selectedEntry.references.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--color-fg-default)' }}>Citation Sources</h4>
                      <div className="space-y-2">
                        {selectedEntry.references.map((ref, idx) => (
                          <div
                            key={idx}
                            className="gh-box p-2 rounded-md"
                            style={brandDomain && ref.domain.toLowerCase().includes(brandDomain.toLowerCase()) ? {
                              backgroundColor: 'var(--color-warning-subtle)',
                              borderColor: 'var(--color-warning-muted)'
                            } : {
                              backgroundColor: 'var(--color-canvas-default)'
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 flex items-center justify-center rounded-md text-xs font-medium" style={{
                                backgroundColor: 'var(--color-neutral-muted)'
                              }}>
                                {ref.rank}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate" style={{ color: 'var(--color-fg-default)' }}>
                                  {ref.source || ref.domain}
                                </div>
                                <div className="text-xs truncate" style={{ color: 'var(--color-fg-muted)' }}>
                                  {ref.domain}
                                </div>
                              </div>
                              {brandDomain && ref.domain.toLowerCase().includes(brandDomain.toLowerCase()) && (
                                <span className="px-1.5 py-0.5 text-xs rounded-md" style={{
                                  backgroundColor: 'var(--color-warning-emphasis)',
                                  color: 'var(--color-fg-on-emphasis)'
                                }}>
                                  Your Brand
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Overview content preview */}
                  {selectedEntry.aioMarkdown && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--color-fg-default)' }}>AI Overview Content</h4>
                      <div className="gh-box rounded-md p-4 text-sm max-h-64 overflow-y-auto" style={{
                        backgroundColor: 'var(--color-canvas-subtle)',
                        color: 'var(--color-fg-default)'
                      }}>
                        <pre className="whitespace-pre-wrap font-sans">
                          {selectedEntry.aioMarkdown.slice(0, 500)}
                          {selectedEntry.aioMarkdown.length > 500 && '...'}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full" style={{ color: 'var(--color-fg-muted)' }}>
                  Select a session to view details
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
