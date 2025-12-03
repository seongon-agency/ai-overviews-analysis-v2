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
      className={`flex-shrink-0 w-[calc(50vw-48px)] max-w-[700px] min-w-[450px] h-full flex flex-col rounded-xl shadow-lg overflow-hidden transition-all ${
        isPinned
          ? 'bg-white ring-2 ring-blue-400 shadow-blue-100'
          : 'bg-white border border-gray-200 hover:shadow-xl'
      }`}
    >
      {/* Card Header */}
      <div className={`px-5 py-4 ${isPinned ? 'bg-gradient-to-r from-blue-50 to-indigo-50' : 'bg-gradient-to-r from-gray-50 to-slate-50'}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 truncate">
                {entry.sessionName || `Session ${entry.sessionId}`}
              </h3>
              {isLatest && (
                <Badge className="bg-emerald-500 text-white text-xs px-2 py-0.5">
                  Latest
                </Badge>
              )}
              {isPinned && (
                <Badge className="bg-blue-500 text-white text-xs px-2 py-0.5">
                  Pinned
                </Badge>
              )}
              {changeFromPrevious && changeFromPrevious !== 'same' && (
                <Badge
                  className={`text-xs px-2 py-0.5 ${
                    changeFromPrevious === 'improved' ? 'bg-green-500 text-white' :
                    changeFromPrevious === 'declined' ? 'bg-red-500 text-white' :
                    changeFromPrevious === 'gained' ? 'bg-blue-500 text-white' :
                    'bg-orange-500 text-white'
                  }`}
                >
                  {changeFromPrevious === 'improved' ? '↑ Rank Up' :
                   changeFromPrevious === 'declined' ? '↓ Rank Down' :
                   changeFromPrevious === 'gained' ? '+ AIO Gained' : '- AIO Lost'}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatDate(entry.sessionDate)}</span>
              <span className="text-gray-300">•</span>
              <span>{formatTime(entry.sessionDate)}</span>
            </div>
          </div>
          <Button
            variant={isPinned ? "default" : "outline"}
            size="sm"
            onClick={isPinned ? onUnpin : onPin}
            className={`h-9 px-3 gap-1.5 ${isPinned ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
          >
            {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            <span className="text-xs">{isPinned ? 'Unpin' : 'Pin'}</span>
          </Button>
        </div>

        {/* Quick Stats Pills */}
        <div className="flex items-center gap-2 mt-3">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
            entry.hasAIOverview
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-gray-100 text-gray-500'
          }`}>
            {entry.hasAIOverview ? '✓ Has AI Overview' : '✗ No AI Overview'}
          </div>
          {entry.brandRank && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
              Brand Rank #{entry.brandRank}
            </div>
          )}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            {entry.referenceCount} citation{entry.referenceCount !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Card Content - split into AIO content and citations sidebar */}
      <div className="flex-1 flex overflow-hidden border-t">
        {/* AI Overview Content */}
        <div className="flex-1 overflow-y-auto p-5 bg-white">
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
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <div className="text-5xl mb-3">📭</div>
                <p className="font-medium">No AI Overview</p>
                <p className="text-sm mt-1">This keyword didn't trigger an AI Overview in this session</p>
              </div>
            </div>
          )}
        </div>

        {/* Citations Sidebar on right */}
        {entry.references.length > 0 && (
          <div className="w-64 border-l bg-gradient-to-b from-slate-50 to-gray-50 overflow-y-auto flex-shrink-0">
            <div className="p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-5 h-5 bg-gray-200 rounded flex items-center justify-center text-gray-600">#</span>
                Citations ({entry.references.length})
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
                        group flex items-start gap-2.5 p-2.5 rounded-lg text-xs cursor-pointer
                        transition-all duration-200
                        ${isHighlighted
                          ? 'bg-blue-100 ring-2 ring-blue-400 shadow-sm'
                          : 'hover:bg-white hover:shadow-sm'
                        }
                        ${isBrand ? 'bg-amber-50 border-l-3 border-amber-400' : ''}
                      `}
                      onMouseEnter={() => setHighlightedCitation(ref.rank)}
                      onMouseLeave={() => setHighlightedCitation(null)}
                    >
                      <span
                        className={`
                          w-6 h-6 flex items-center justify-center rounded-md text-xs font-bold flex-shrink-0 transition-colors
                          ${isHighlighted
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300'
                          }
                        `}
                      >
                        {ref.rank}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate leading-tight">
                          {ref.source || ref.domain}
                        </div>
                        <div className="text-gray-500 truncate mt-0.5 flex items-center gap-1">
                          {ref.domain}
                        </div>
                        {isBrand && (
                          <span className="inline-block mt-1 text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-medium">
                            Your Brand
                          </span>
                        )}
                      </div>
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-blue-500 flex-shrink-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-[1600px] h-[90vh] bg-gradient-to-br from-slate-100 to-gray-100 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b bg-white/80 backdrop-blur-sm">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900 truncate">{keyword.keyword}</h2>
              {keyword.hasAIOverview && (
                <Badge className="bg-emerald-500 text-white">Has AIO</Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm text-gray-500">
                {history.length} session{history.length !== 1 ? 's' : ''} tracked
              </span>
              {pinnedSessionIds.size > 0 && (
                <Badge variant="outline" className="border-blue-300 text-blue-600">
                  {pinnedSessionIds.size} pinned
                </Badge>
              )}
              <span className="text-sm text-gray-400">•</span>
              <span className="text-sm text-gray-500">Scroll horizontally to compare sessions</span>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={onClose} className="h-10 w-10 rounded-full">
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
        <div className="px-6 py-3 border-t bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5">
                <Pin className="h-3.5 w-3.5 text-blue-500" />
                <span>Pin sessions to compare side-by-side</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-lg">←→</span>
                <span>Scroll to browse history</span>
              </span>
            </div>
            <span className="text-gray-400">Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-mono text-[10px]">ESC</kbd> to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
