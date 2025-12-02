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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl p-8 text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="mt-2 text-gray-600">Loading keyword history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-5xl h-[85vh] mx-4 bg-white rounded-xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Keyword Timeline</h2>
            <p className="text-lg text-blue-600 mt-1">&quot;{keyword}&quot;</p>
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

        {history.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            No history found for this keyword
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Timeline sidebar */}
            <div className="w-80 border-r overflow-y-auto p-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
                {history.length} Check{history.length !== 1 ? 's' : ''}
              </h3>

              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-gray-200" />

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
                        className={`absolute left-2 w-5 h-5 rounded-full border-2 ${
                          entry.hasAIOverview
                            ? 'bg-green-100 border-green-500'
                            : 'bg-gray-100 border-gray-400'
                        } ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                      />

                      <div className={`p-3 rounded-lg ${isSelected ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {entry.sessionName || `Session ${entry.sessionId}`}
                          </span>
                          {change && change !== 'same' && (
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              change === 'improved' ? 'bg-green-100 text-green-700' :
                              change === 'declined' ? 'bg-red-100 text-red-700' :
                              change === 'gained' ? 'bg-blue-100 text-blue-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {change === 'improved' ? 'Rank Up' :
                               change === 'declined' ? 'Rank Down' :
                               change === 'gained' ? '+AIO' : '-AIO'}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(entry.sessionDate)}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className={entry.hasAIOverview ? 'text-green-600' : 'text-gray-400'}>
                            {entry.hasAIOverview ? 'Has AIO' : 'No AIO'}
                          </span>
                          {entry.brandRank && (
                            <span className="text-yellow-700">
                              Brand #{entry.brandRank}
                            </span>
                          )}
                          {entry.referenceCount > 0 && (
                            <span className="text-gray-500">
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
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedEntry.sessionName || `Session ${selectedEntry.sessionId}`}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatDate(selectedEntry.sessionDate)}
                      </p>
                    </div>
                    <button
                      onClick={() => onViewSession(selectedEntry.sessionId)}
                      className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      View Full Session
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm text-gray-500">AI Overview</div>
                      <div className={`text-lg font-semibold ${selectedEntry.hasAIOverview ? 'text-green-600' : 'text-gray-400'}`}>
                        {selectedEntry.hasAIOverview ? 'Yes' : 'No'}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm text-gray-500">Brand Rank</div>
                      <div className={`text-lg font-semibold ${selectedEntry.brandRank ? 'text-yellow-700' : 'text-gray-400'}`}>
                        {selectedEntry.brandRank ? `#${selectedEntry.brandRank}` : 'Not cited'}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm text-gray-500">References</div>
                      <div className="text-lg font-semibold text-gray-700">
                        {selectedEntry.referenceCount}
                      </div>
                    </div>
                  </div>

                  {/* References list */}
                  {selectedEntry.references.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Citation Sources</h4>
                      <div className="space-y-2">
                        {selectedEntry.references.map((ref, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded border ${
                              brandDomain && ref.domain.toLowerCase().includes(brandDomain.toLowerCase())
                                ? 'bg-yellow-50 border-yellow-200'
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded text-xs font-medium">
                                {ref.rank}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {ref.source || ref.domain}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {ref.domain}
                                </div>
                              </div>
                              {brandDomain && ref.domain.toLowerCase().includes(brandDomain.toLowerCase()) && (
                                <span className="px-1.5 py-0.5 text-xs bg-yellow-200 text-yellow-800 rounded">
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
                      <h4 className="text-sm font-medium text-gray-700 mb-2">AI Overview Content</h4>
                      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 max-h-64 overflow-y-auto">
                        <pre className="whitespace-pre-wrap font-sans">
                          {selectedEntry.aioMarkdown.slice(0, 500)}
                          {selectedEntry.aioMarkdown.length > 500 && '...'}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
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
