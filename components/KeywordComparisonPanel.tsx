'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { KeywordRecord, Reference } from '@/lib/types';
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
      className={`flex-shrink-0 w-[calc(50vw-48px)] max-w-[700px] min-w-[450px] h-full flex flex-col rounded-2xl overflow-hidden transition-all ${
        isPinned
          ? 'bg-white ring-2 ring-indigo-400 shadow-xl shadow-indigo-100/50'
          : 'bg-white border border-gray-200 shadow-lg hover:shadow-xl'
      }`}
    >
      {/* Card Header */}
      <div className={`px-5 py-4 ${isPinned ? 'bg-gradient-to-r from-indigo-50 to-purple-50' : 'bg-gradient-to-r from-gray-50 to-slate-50'}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 truncate">
                {entry.sessionName || `Session ${entry.sessionId}`}
              </h3>
              {isLatest && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500 text-white">
                  Latest
                </span>
              )}
              {isPinned && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500 text-white">
                  Pinned
                </span>
              )}
              {changeFromPrevious && changeFromPrevious !== 'same' && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    changeFromPrevious === 'improved' ? 'bg-emerald-500 text-white' :
                    changeFromPrevious === 'declined' ? 'bg-red-500 text-white' :
                    changeFromPrevious === 'gained' ? 'bg-blue-500 text-white' :
                    'bg-orange-500 text-white'
                  }`}
                >
                  {changeFromPrevious === 'improved' ? '↑ Rank Up' :
                   changeFromPrevious === 'declined' ? '↓ Rank Down' :
                   changeFromPrevious === 'gained' ? '+ AIO Gained' : '- AIO Lost'}
                </span>
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
            className={`h-9 px-3 gap-1.5 rounded-xl ${isPinned ? 'bg-indigo-600 hover:bg-indigo-700' : 'border-gray-200'}`}
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
            <Sparkles className="h-3 w-3" />
            {entry.hasAIOverview ? 'Has AI Overview' : 'No AI Overview'}
          </div>
          {entry.brandRank && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
              <Hash className="h-3 w-3" />
              Brand Rank #{entry.brandRank}
            </div>
          )}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            <FileText className="h-3 w-3" />
            {entry.referenceCount} citation{entry.referenceCount !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Card Content - split into AIO content and citations sidebar */}
      <div className="flex-1 flex overflow-hidden border-t border-gray-100">
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
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-gray-300" />
                </div>
                <p className="font-medium text-gray-900">No AI Overview</p>
                <p className="text-sm text-gray-500 mt-1">This keyword didn&apos;t trigger an AI Overview in this session</p>
              </div>
            </div>
          )}
        </div>

        {/* Citations Sidebar on right */}
        {entry.references.length > 0 && (
          <div className="w-64 border-l border-gray-100 bg-gray-50/50 overflow-y-auto flex-shrink-0">
            <div className="p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-5 h-5 bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 text-[10px] font-bold">#</span>
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
                        group flex items-start gap-2.5 p-2.5 rounded-xl text-xs cursor-pointer
                        transition-all duration-200
                        ${isHighlighted
                          ? 'bg-indigo-100 ring-2 ring-indigo-400 shadow-sm'
                          : 'hover:bg-white hover:shadow-sm'
                        }
                        ${isBrand ? 'bg-amber-50 border-l-2 border-amber-400' : ''}
                      `}
                      onMouseEnter={() => setHighlightedCitation(ref.rank)}
                      onMouseLeave={() => setHighlightedCitation(null)}
                    >
                      <span
                        className={`
                          w-6 h-6 flex items-center justify-center rounded-lg text-xs font-bold flex-shrink-0 transition-colors
                          ${isHighlighted
                            ? 'bg-indigo-600 text-white'
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
                          <span className="inline-block mt-1 text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-md font-medium">
                            Your Brand
                          </span>
                        )}
                      </div>
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-indigo-600 flex-shrink-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl p-8 text-center shadow-2xl">
          <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-indigo-600" />
          <p className="text-gray-500">Loading keyword history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-[1600px] h-[90vh] bg-gradient-to-br from-gray-50 to-slate-100 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-white">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 truncate">{keyword.keyword}</h2>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-sm text-gray-500">
                    {history.length} session{history.length !== 1 ? 's' : ''} tracked
                  </span>
                  {pinnedSessionIds.size > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-indigo-200 text-indigo-600 bg-indigo-50">
                      {pinnedSessionIds.size} pinned
                    </span>
                  )}
                  {keyword.hasAIOverview && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                      Has AIO
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={onClose} className="h-10 w-10 rounded-xl border-gray-200">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {history.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="h-20 w-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-10 w-10 text-gray-300" />
              </div>
              <p className="text-lg font-medium text-gray-900">No history found</p>
              <p className="text-gray-500 mt-1">This keyword doesn&apos;t have any session data yet</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Pinned Cards Section */}
            {pinnedEntries.length > 0 && (
              <>
                <div className="flex-shrink-0 flex gap-4 p-4 bg-indigo-50/50">
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
                <div className="w-px bg-gray-200 flex-shrink-0" />
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
              <div className="flex-1 flex items-center justify-center bg-gray-50/50">
                <div className="text-center">
                  <Pin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-gray-600">All sessions are pinned</p>
                  <p className="text-sm text-gray-400">Unpin some to see them in the scrollable area</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer with instructions */}
        <div className="px-6 py-3 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5">
                <Pin className="h-3.5 w-3.5 text-indigo-500" />
                <span>Pin sessions to compare side-by-side</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-lg">←→</span>
                <span>Scroll to browse history</span>
              </span>
            </div>
            <span className="text-gray-400">Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded-md text-gray-600 font-mono text-[10px]">ESC</kbd> to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
