'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { KeywordRecord, Reference } from '@/lib/types';
import { AIOContent } from './AIOContent';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Icons
import { X, Loader2, Pin, PinOff, ExternalLink, Clock } from 'lucide-react';

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
      className={`flex-shrink-0 w-[calc(50%-12px)] min-w-[400px] h-full flex flex-col bg-white rounded-lg border ${
        isPinned ? 'border-blue-300 shadow-md' : 'border-gray-200'
      }`}
    >
      {/* Card Header */}
      <div className={`px-4 py-3 border-b ${isPinned ? 'bg-blue-50' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate text-sm">
                {entry.sessionName || `Session ${entry.sessionId}`}
              </span>
              {isLatest && (
                <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                  Latest
                </Badge>
              )}
              {changeFromPrevious && changeFromPrevious !== 'same' && (
                <Badge
                  variant="secondary"
                  className={`text-xs ${
                    changeFromPrevious === 'improved' ? 'bg-green-100 text-green-700' :
                    changeFromPrevious === 'declined' ? 'bg-red-100 text-red-700' :
                    changeFromPrevious === 'gained' ? 'bg-blue-100 text-blue-700' :
                    'bg-orange-100 text-orange-700'
                  }`}
                >
                  {changeFromPrevious === 'improved' ? '↑ Rank' :
                   changeFromPrevious === 'declined' ? '↓ Rank' :
                   changeFromPrevious === 'gained' ? '+AIO' : '-AIO'}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Clock className="h-3 w-3" />
              {formatDate(entry.sessionDate)} at {formatTime(entry.sessionDate)}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={isPinned ? onUnpin : onPin}
            className={`h-8 w-8 p-0 ${isPinned ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            title={isPinned ? 'Unpin' : 'Pin'}
          >
            {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-3 mt-2 text-xs">
          <span className={entry.hasAIOverview ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
            {entry.hasAIOverview ? '✓ Has AIO' : '✗ No AIO'}
          </span>
          {entry.brandRank && (
            <span className="text-amber-700 font-medium">
              Brand #{entry.brandRank}
            </span>
          )}
          <span className="text-muted-foreground">
            {entry.referenceCount} citation{entry.referenceCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Card Content - split into AIO content and citations sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* AI Overview Content */}
        <div className="flex-1 overflow-y-auto p-4">
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
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              <div className="text-center">
                <div className="text-4xl mb-2 opacity-30">∅</div>
                <p>No AI Overview</p>
              </div>
            </div>
          )}
        </div>

        {/* Citations Sidebar on right */}
        {entry.references.length > 0 && (
          <div className="w-56 border-l bg-gray-50/50 overflow-y-auto flex-shrink-0">
            <div className="p-3">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Citations ({entry.references.length})
              </h4>
              <div className="space-y-1">
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
                        flex items-center gap-2 p-2 rounded text-xs
                        transition-all duration-150
                        ${isHighlighted ? 'bg-blue-100 ring-1 ring-blue-400' : 'hover:bg-gray-100'}
                        ${isBrand ? 'border-l-2 border-yellow-400 bg-yellow-50' : ''}
                      `}
                      onMouseEnter={() => setHighlightedCitation(ref.rank)}
                      onMouseLeave={() => setHighlightedCitation(null)}
                    >
                      <span
                        className={`
                          w-5 h-5 flex items-center justify-center rounded text-xs font-medium flex-shrink-0
                          ${isHighlighted ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}
                        `}
                      >
                        {ref.rank}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {ref.source || ref.domain}
                        </div>
                        <div className="text-gray-500 truncate flex items-center gap-1">
                          {ref.domain}
                          {isBrand && (
                            <span className="text-[10px] bg-yellow-200 text-yellow-800 px-1 rounded">
                              Brand
                            </span>
                          )}
                        </div>
                      </div>
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
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
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl p-8 text-center shadow-2xl">
          <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading keyword history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-[95vw] max-w-[1600px] h-[90vh] mx-4 bg-gray-100 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold truncate">{keyword.keyword}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-muted-foreground">
                {history.length} session{history.length !== 1 ? 's' : ''} found
              </span>
              {pinnedSessionIds.size > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {pinnedSessionIds.size} pinned
                </Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {history.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="text-6xl mb-4 opacity-30">📊</div>
              <p className="text-lg">No history found for this keyword</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Pinned Cards Section */}
            {pinnedEntries.length > 0 && (
              <>
                <div className="flex-shrink-0 flex gap-4 p-4 bg-blue-50/50">
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
                <div className="w-px bg-gray-300 flex-shrink-0" />
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
              <div className="flex-1 flex items-center justify-center text-muted-foreground bg-gray-50">
                <div className="text-center">
                  <Pin className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>All sessions are pinned</p>
                  <p className="text-sm">Unpin some to see them in the scrollable area</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer with instructions */}
        <div className="px-6 py-3 border-t bg-white text-xs text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Pin className="h-3 w-3" /> Click pin icon to keep sessions visible while scrolling
            </span>
            <span>•</span>
            <span>Scroll horizontally to browse older sessions</span>
          </div>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
}
