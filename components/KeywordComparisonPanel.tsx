'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { KeywordRecord, Reference, OrganicResult } from '@/lib/types';
import { AIOContent } from './AIOContent';

// shadcn/ui components
import { Button } from '@/components/ui/button';

// Icons
import { X, Loader2, Pin, PinOff, ExternalLink, Clock, Sparkles, FileText, Hash } from 'lucide-react';

interface HistoryEntry {
  sessionId: number;
  sessionName: string | null;
  sessionDate: string;
  hasAIOverview: boolean;
  aioMarkdown: string | null;
  references: Reference[];
  referenceCount: number;
  brandRank: number | null;
  organicResults: OrganicResult[];
  organicBrandRank: number | null;
}

interface KeywordComparisonPanelProps {
  keyword: KeywordRecord;
  projectId: number;
  brandDomain?: string;
  brandName?: string;
  onClose: () => void;
  onViewSession?: (sessionId: number) => void;
}

// Individual session card component
function SessionCard({
  entry,
  isPinned,
  onPin,
  onUnpin,
  brandDomain,
  brandName,
  isLatest,
  changeFromPrevious,
}: {
  entry: HistoryEntry;
  isPinned: boolean;
  onPin: () => void;
  onUnpin: () => void;
  brandDomain?: string;
  brandName?: string;
  isLatest: boolean;
  changeFromPrevious: 'improved' | 'declined' | 'gained' | 'lost' | 'same' | null;
}) {
  const [highlightedCitation, setHighlightedCitation] = useState<number | null>(null);
  const citationRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const handleCitationClick = useCallback((num: number) => {
    setHighlightedCitation(num);
    // Scroll to citation in sidebar
    const el = citationRefs.current.get(num);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    setTimeout(() => setHighlightedCitation(null), 2000);
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isBrandCitation = (ref: Reference): boolean => {
    if (!brandDomain) return false;
    return ref.domain.toLowerCase().includes(brandDomain.toLowerCase());
  };

  return (
    <div
      className={`flex-shrink-0 w-[calc(50vw-48px)] max-w-[700px] min-w-[450px] h-full flex flex-col rounded-md overflow-hidden transition-all ${
        isPinned
          ? 'bg-[var(--color-canvas-default)] ring-2 ring-[var(--color-accent-emphasis)] shadow-[var(--color-shadow-large)]'
          : 'bg-[var(--color-canvas-default)] border border-[var(--color-border-default)] shadow-[var(--color-shadow-medium)] hover:shadow-[var(--color-shadow-large)]'
      }`}
    >
      {/* Card Header */}
      <div className={`px-5 py-4 ${isPinned ? 'bg-[var(--color-accent-subtle)]' : 'bg-[var(--color-canvas-subtle)]'}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-[var(--color-fg-default)] truncate">
                {entry.sessionName || `Session ${entry.sessionId}`}
              </h3>
              {isLatest && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-success-emphasis)] text-[var(--color-canvas-default)]">
                  Latest
                </span>
              )}
              {isPinned && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-accent-emphasis)] text-[var(--color-canvas-default)]">
                  Pinned
                </span>
              )}
              {changeFromPrevious && changeFromPrevious !== 'same' && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    changeFromPrevious === 'improved' ? 'bg-[var(--color-success-emphasis)] text-[var(--color-canvas-default)]' :
                    changeFromPrevious === 'declined' ? 'bg-[var(--color-danger-emphasis)] text-[var(--color-canvas-default)]' :
                    changeFromPrevious === 'gained' ? 'bg-[var(--color-accent-emphasis)] text-[var(--color-canvas-default)]' :
                    'bg-[var(--color-warning-emphasis)] text-[var(--color-canvas-default)]'
                  }`}
                >
                  {changeFromPrevious === 'improved' ? '↑ Rank Up' :
                   changeFromPrevious === 'declined' ? '↓ Rank Down' :
                   changeFromPrevious === 'gained' ? '+ AIO Gained' : '- AIO Lost'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-[var(--color-fg-muted)] mt-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatDate(entry.sessionDate)}</span>
              <span className="text-[var(--color-border-default)]">•</span>
              <span>{formatTime(entry.sessionDate)}</span>
            </div>
          </div>
          <Button
            variant={isPinned ? "default" : "outline"}
            size="sm"
            onClick={isPinned ? onUnpin : onPin}
            className={`h-9 px-3 gap-1.5 rounded-md ${isPinned ? 'bg-[var(--color-accent-emphasis)] hover:bg-[var(--color-accent-emphasis)]' : 'border-[var(--color-border-default)]'}`}
          >
            {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            <span className="text-xs">{isPinned ? 'Unpin' : 'Pin'}</span>
          </Button>
        </div>

        {/* Quick Stats Pills */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
            entry.hasAIOverview
              ? 'bg-[var(--color-success-subtle)] text-[var(--color-success-fg)]'
              : 'bg-[var(--color-neutral-muted)] text-[var(--color-fg-muted)]'
          }`}>
            <Sparkles className="h-3 w-3" />
            {entry.hasAIOverview ? 'Has AI Overview' : 'No AI Overview'}
          </div>
          {entry.brandRank && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--color-warning-subtle)] text-[var(--color-warning-fg)]">
              <Hash className="h-3 w-3" />
              AIO #{entry.brandRank}
            </div>
          )}
          {entry.organicBrandRank && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--color-accent-subtle)] text-[var(--color-accent-fg)]">
              <Hash className="h-3 w-3" />
              Organic #{entry.organicBrandRank}
            </div>
          )}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--color-neutral-muted)] text-[var(--color-fg-muted)]">
            <FileText className="h-3 w-3" />
            {entry.referenceCount} citation{entry.referenceCount !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Card Content - split into AIO content and citations sidebar */}
      <div className="flex-1 flex overflow-hidden border-t border-[var(--color-border-muted)]">
        {/* AI Overview Content */}
        <div className="flex-1 overflow-y-auto p-5 bg-[var(--color-canvas-default)]">
          {entry.hasAIOverview && entry.aioMarkdown ? (
            <AIOContent
              markdown={entry.aioMarkdown}
              references={entry.references}
              highlightedCitation={highlightedCitation}
              onCitationHover={setHighlightedCitation}
              onCitationClick={handleCitationClick}
              brandName={brandName}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="h-16 w-16 rounded-md bg-[var(--color-canvas-subtle)] flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-[var(--color-border-default)]" />
                </div>
                <p className="font-medium text-[var(--color-fg-default)]">No AI Overview</p>
                <p className="text-sm text-[var(--color-fg-muted)] mt-1">This keyword didn&apos;t trigger an AI Overview in this session</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Citations & Organic Results */}
        {(entry.references.length > 0 || entry.organicResults.length > 0) && (
          <div className="w-72 border-l border-[var(--color-border-muted)] bg-[var(--color-canvas-subtle)] overflow-y-auto flex-shrink-0">
            {/* AIO Citations Section */}
            {entry.references.length > 0 && (
              <div className="p-4 border-b border-[var(--color-border-muted)]">
                <h4 className="text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-[var(--color-warning-subtle)] rounded-md flex items-center justify-center text-[var(--color-warning-fg)] text-[10px] font-bold">#</span>
                  AIO Citations ({entry.references.length})
                </h4>
                <div className="space-y-2">
                  {entry.references.map((ref) => {
                    const isHighlighted = highlightedCitation === ref.rank;
                    const isBrand = isBrandCitation(ref);

                    return (
                      <div
                        key={ref.rank}
                        ref={(el) => {
                          if (el) citationRefs.current.set(ref.rank, el);
                        }}
                        className={`
                          group flex items-start gap-2.5 p-2.5 rounded-md text-xs cursor-pointer
                          transition-all duration-200
                          ${isHighlighted
                            ? 'bg-[var(--color-accent-subtle)] ring-2 ring-[var(--color-accent-emphasis)] shadow-[var(--color-shadow-small)]'
                            : 'hover:bg-[var(--color-canvas-default)] hover:shadow-[var(--color-shadow-small)]'
                          }
                          ${isBrand ? 'bg-[var(--color-warning-subtle)] border-l-2 border-[var(--color-warning-emphasis)]' : ''}
                        `}
                        onMouseEnter={() => setHighlightedCitation(ref.rank)}
                        onMouseLeave={() => setHighlightedCitation(null)}
                      >
                        <span
                          className={`
                            w-6 h-6 flex items-center justify-center rounded-md text-xs font-bold flex-shrink-0 transition-colors
                            ${isHighlighted
                              ? 'bg-[var(--color-accent-emphasis)] text-[var(--color-canvas-default)]'
                              : 'bg-[var(--color-neutral-muted)] text-[var(--color-fg-muted)] group-hover:bg-[var(--color-border-default)]'
                            }
                          `}
                        >
                          {ref.rank}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-[var(--color-fg-default)] truncate leading-tight">
                            {ref.source || ref.domain}
                          </div>
                          <div className="text-[var(--color-fg-muted)] truncate mt-0.5 flex items-center gap-1">
                            {ref.domain}
                          </div>
                          {isBrand && (
                            <span className="inline-block mt-1 text-[10px] bg-[var(--color-warning-emphasis)] text-[var(--color-canvas-default)] px-1.5 py-0.5 rounded-md font-medium">
                              Your Brand
                            </span>
                          )}
                        </div>
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--color-fg-subtle)] hover:text-[var(--color-accent-fg)] flex-shrink-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Organic Results Section */}
            {entry.organicResults.length > 0 && (
              <div className="p-4">
                <h4 className="text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-[var(--color-accent-subtle)] rounded-md flex items-center justify-center text-[var(--color-accent-fg)] text-[10px] font-bold">#</span>
                  Organic Results ({entry.organicResults.length})
                </h4>
                <div className="space-y-2">
                  {entry.organicResults.map((result) => {
                    const isBrand = brandDomain && result.domain.toLowerCase().includes(brandDomain.toLowerCase());

                    return (
                      <div
                        key={result.rank}
                        className={`
                          group flex items-start gap-2.5 p-2.5 rounded-md text-xs
                          transition-all duration-200
                          hover:bg-[var(--color-canvas-default)] hover:shadow-[var(--color-shadow-small)]
                          ${isBrand ? 'bg-[var(--color-warning-subtle)] border-l-2 border-[var(--color-warning-emphasis)]' : ''}
                        `}
                      >
                        <span
                          className={`
                            w-6 h-6 flex items-center justify-center rounded-md text-xs font-bold flex-shrink-0 transition-colors
                            ${isBrand
                              ? 'bg-[var(--color-warning-emphasis)] text-[var(--color-canvas-default)]'
                              : 'bg-[var(--color-neutral-muted)] text-[var(--color-fg-muted)] group-hover:bg-[var(--color-border-default)]'
                            }
                          `}
                        >
                          {result.rank}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-[var(--color-fg-default)] truncate leading-tight">
                            {result.title || result.domain}
                          </div>
                          <div className="text-[var(--color-fg-muted)] truncate mt-0.5">
                            {result.domain}
                          </div>
                          {isBrand && (
                            <span className="inline-block mt-1 text-[10px] bg-[var(--color-warning-emphasis)] text-[var(--color-canvas-default)] px-1.5 py-0.5 rounded-md font-medium">
                              Your Site
                            </span>
                          )}
                        </div>
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--color-fg-subtle)] hover:text-[var(--color-accent-fg)] flex-shrink-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function KeywordComparisonPanel({
  keyword,
  projectId,
  brandDomain,
  brandName,
  onClose,
}: KeywordComparisonPanelProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [pinnedSessionIds, setPinnedSessionIds] = useState<Set<number>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch history on mount
  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const sessionsResponse = await fetch(`/api/sessions?projectId=${projectId}`);
      const sessionsResult = await sessionsResponse.json();

      if (!sessionsResult.success) {
        setLoadingHistory(false);
        return;
      }

      const historyEntries: HistoryEntry[] = [];

      for (const session of sessionsResult.data) {
        const sessionResponse = await fetch(
          `/api/sessions/${session.id}?brandDomain=${encodeURIComponent(brandDomain || '')}&brandName=${encodeURIComponent(brandName || '')}`
        );
        const sessionResult = await sessionResponse.json();

        if (sessionResult.success) {
          const keywordData = sessionResult.data.keywords.find(
            (k: { keyword: string }) => k.keyword === keyword.keyword
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
              brandRank: keywordData.brandRank,
              organicResults: keywordData.organicResults || [],
              organicBrandRank: keywordData.organicBrandRank ?? null,
            });
          }
        }
      }

      // Sort by date descending (newest first)
      historyEntries.sort((a, b) =>
        new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()
      );

      setHistory(historyEntries);

      // Auto-pin the latest session
      if (historyEntries.length > 0) {
        setPinnedSessionIds(new Set([historyEntries[0].sessionId]));
      }
    } catch (error) {
      console.error('Error fetching keyword history:', error);
    } finally {
      setLoadingHistory(false);
    }
  }, [projectId, keyword.keyword, brandDomain, brandName]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handlePin = (sessionId: number) => {
    setPinnedSessionIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(sessionId);
      return newSet;
    });
  };

  const handleUnpin = (sessionId: number) => {
    setPinnedSessionIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(sessionId);
      return newSet;
    });
  };

  const getChangeFromPrevious = (entry: HistoryEntry, index: number): 'improved' | 'declined' | 'gained' | 'lost' | 'same' | null => {
    // Find the previous session (older in time, so next in array since sorted descending)
    const previousIndex = index + 1;
    if (previousIndex >= history.length) return null;

    const previous = history[previousIndex];

    if (!previous.hasAIOverview && entry.hasAIOverview) return 'gained';
    if (previous.hasAIOverview && !entry.hasAIOverview) return 'lost';

    if (previous.brandRank && entry.brandRank) {
      if (entry.brandRank < previous.brandRank) return 'improved';
      if (entry.brandRank > previous.brandRank) return 'declined';
    } else if (!previous.brandRank && entry.brandRank) {
      return 'improved';
    } else if (previous.brandRank && !entry.brandRank) {
      return 'declined';
    }

    return 'same';
  };

  // Separate pinned and unpinned entries
  const pinnedEntries = history.filter((e) => pinnedSessionIds.has(e.sessionId));
  const unpinnedEntries = history.filter((e) => !pinnedSessionIds.has(e.sessionId));

  // Sort pinned entries by date (newest first) for consistent display
  pinnedEntries.sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());

  // Sort unpinned entries chronologically (oldest first for left-to-right reading)
  unpinnedEntries.sort((a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime());

  if (loadingHistory) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-[var(--color-canvas-default)] rounded-md p-8 text-center shadow-[var(--color-shadow-large)]">
          <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-[var(--color-accent-fg)]" />
          <p className="text-[var(--color-fg-muted)]">Loading keyword history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-[1600px] h-[90vh] bg-[var(--color-canvas-subtle)] rounded-md shadow-[var(--color-shadow-large)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border-default)] bg-[var(--color-canvas-default)]">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-[var(--color-accent-emphasis)] flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-[var(--color-canvas-default)]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--color-fg-default)] truncate">{keyword.keyword}</h2>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-sm text-[var(--color-fg-muted)]">
                    {history.length} session{history.length !== 1 ? 's' : ''} tracked
                  </span>
                  {pinnedSessionIds.size > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-[var(--color-accent-muted)] text-[var(--color-accent-fg)] bg-[var(--color-accent-subtle)]">
                      {pinnedSessionIds.size} pinned
                    </span>
                  )}
                  {keyword.hasAIOverview && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-success-subtle)] text-[var(--color-success-fg)]">
                      Has AIO
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={onClose} className="h-10 w-10 rounded-md border-[var(--color-border-default)]">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {history.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="h-20 w-20 rounded-md bg-[var(--color-canvas-subtle)] flex items-center justify-center mx-auto mb-4">
                <FileText className="h-10 w-10 text-[var(--color-border-default)]" />
              </div>
              <p className="text-lg font-medium text-[var(--color-fg-default)]">No history found</p>
              <p className="text-[var(--color-fg-muted)] mt-1">This keyword doesn&apos;t have any session data yet</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Pinned Cards Section */}
            {pinnedEntries.length > 0 && (
              <>
                <div className="flex-shrink-0 flex gap-4 p-4 bg-[var(--color-accent-subtle)]">
                  {pinnedEntries.map((entry) => {
                    const originalIndex = history.findIndex((h) => h.sessionId === entry.sessionId);
                    return (
                      <SessionCard
                        key={entry.sessionId}
                        entry={entry}
                        isPinned={true}
                        onPin={() => handlePin(entry.sessionId)}
                        onUnpin={() => handleUnpin(entry.sessionId)}
                        brandDomain={brandDomain}
                        brandName={brandName}
                        isLatest={originalIndex === 0}
                        changeFromPrevious={getChangeFromPrevious(entry, originalIndex)}
                      />
                    );
                  })}
                </div>
                {/* Divider */}
                <div className="w-px bg-[var(--color-border-default)] flex-shrink-0" />
              </>
            )}

            {/* Scrollable Unpinned Cards Section */}
            {unpinnedEntries.length > 0 && (
              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-x-auto overflow-y-hidden"
              >
                <div className="flex gap-4 p-4 h-full min-w-max">
                  {unpinnedEntries.map((entry) => {
                    const originalIndex = history.findIndex((h) => h.sessionId === entry.sessionId);
                    return (
                      <SessionCard
                        key={entry.sessionId}
                        entry={entry}
                        isPinned={false}
                        onPin={() => handlePin(entry.sessionId)}
                        onUnpin={() => handleUnpin(entry.sessionId)}
                        brandDomain={brandDomain}
                        brandName={brandName}
                        isLatest={originalIndex === 0}
                        changeFromPrevious={getChangeFromPrevious(entry, originalIndex)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Show message if all are pinned */}
            {unpinnedEntries.length === 0 && pinnedEntries.length > 0 && (
              <div className="flex-1 flex items-center justify-center bg-[var(--color-canvas-subtle)]">
                <div className="text-center">
                  <Pin className="h-8 w-8 mx-auto mb-2 text-[var(--color-border-default)]" />
                  <p className="text-[var(--color-fg-muted)]">All sessions are pinned</p>
                  <p className="text-sm text-[var(--color-fg-subtle)]">Unpin some to see them in the scrollable area</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer with instructions */}
        <div className="px-6 py-3 border-t border-[var(--color-border-default)] bg-[var(--color-canvas-default)]">
          <div className="flex items-center justify-between text-xs text-[var(--color-fg-muted)]">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5">
                <Pin className="h-3.5 w-3.5 text-[var(--color-accent-fg)]" />
                <span>Pin sessions to compare side-by-side</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-lg">←→</span>
                <span>Scroll to browse history</span>
              </span>
            </div>
            <span className="text-[var(--color-fg-subtle)]">Press <kbd className="px-1.5 py-0.5 bg-[var(--color-canvas-subtle)] border border-[var(--color-border-default)] rounded-md text-[var(--color-fg-muted)] font-mono text-[10px]">ESC</kbd> to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
