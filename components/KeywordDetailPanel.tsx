'use client';

import { useState, useEffect, useCallback } from 'react';
import { KeywordRecord, Reference, OrganicResult } from '@/lib/types';
import { AIOContent } from './AIOContent';
import { CitationList } from './CitationList';
import { OrganicResultsList } from './OrganicResultsList';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// Icons
import { X, ExternalLink, Clock, Eye, Quote, Loader2, ArrowUp, ArrowDown } from 'lucide-react';

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

interface KeywordDetailPanelProps {
  keyword: KeywordRecord;
  projectId: number;
  brandDomain?: string;
  brandName?: string;
  onClose: () => void;
  onViewSession?: (sessionId: number) => void;
}

export function KeywordDetailPanel({
  keyword,
  projectId,
  brandDomain,
  brandName,
  onClose,
  onViewSession
}: KeywordDetailPanelProps) {
  const [highlightedCitation, setHighlightedCitation] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);

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
              organicBrandRank: keywordData.organicBrandRank ?? null
            });
          }
        }
      }

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

  const handleCitationClick = useCallback((num: number) => {
    setHighlightedCitation(num);
    setTimeout(() => setHighlightedCitation(null), 2000);
  }, []);

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

  if (loadingHistory) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-[var(--color-canvas-default)] rounded-md p-8 text-center shadow-[var(--color-shadow-large)]">
          <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-[var(--color-fg-muted)]" />
          <p className="text-[var(--color-fg-muted)]">Loading keyword history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-6xl h-[85vh] mx-4 bg-[var(--color-canvas-default)] rounded-md shadow-[var(--color-shadow-large)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-default)]">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold truncate text-[var(--color-fg-default)]">{keyword.keyword}</h2>
            <div className="flex items-center gap-3 mt-1">
              {keyword.hasAIOverview ? (
                <Badge variant="secondary" className="bg-[var(--color-success-subtle)] text-[var(--color-success-fg)]">
                  Has AI Overview
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-[var(--color-neutral-muted)] text-[var(--color-fg-muted)]">
                  No AI Overview
                </Badge>
              )}
              {keyword.brandRank && (
                <Badge variant="secondary" className="bg-[var(--color-warning-subtle)] text-[var(--color-warning-fg)]">
                  Brand Rank #{keyword.brandRank}
                </Badge>
              )}
              {keyword.brandMentioned && (
                <Badge variant="secondary" className="bg-[var(--color-accent-subtle)] text-[var(--color-accent-fg)]">
                  Brand Mentioned
                </Badge>
              )}
              <span className="text-sm text-[var(--color-fg-muted)]">
                {keyword.referenceCount} citation{keyword.referenceCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {history.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[var(--color-fg-muted)]">
            <div className="text-center">
              <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No history found for this keyword</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* History sidebar on the left */}
            <div className="w-80 border-r border-[var(--color-border-default)] overflow-y-auto p-4 bg-[var(--color-canvas-subtle)]">
              <h3 className="text-sm font-medium text-[var(--color-fg-muted)] uppercase tracking-wide mb-4">
                {history.length} Session{history.length !== 1 ? 's' : ''}
              </h3>

              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-[var(--color-border-default)]" />

                {history.map((entry, index) => {
                  const change = getChangeFromPrevious(index);
                  const isSelected = selectedEntry?.sessionId === entry.sessionId;

                  return (
                    <div
                      key={entry.sessionId}
                      className={`relative pl-10 pb-4 cursor-pointer transition-opacity ${
                        isSelected ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                      }`}
                      onClick={() => setSelectedEntry(entry)}
                    >
                      {/* Timeline dot */}
                      <div
                        className={`absolute left-2 w-5 h-5 rounded-full border-2 transition-all ${
                          entry.hasAIOverview
                            ? 'bg-[var(--color-success-subtle)] border-[var(--color-success-emphasis)]'
                            : 'bg-[var(--color-canvas-subtle)] border-[var(--color-border-default)]'
                        } ${isSelected ? 'ring-2 ring-[var(--color-accent-emphasis)] ring-offset-2' : ''}`}
                      />

                      <div className={`p-3 rounded-md transition-colors ${
                        isSelected ? 'bg-[var(--color-accent-subtle)] border border-[var(--color-accent-muted)]' : 'bg-[var(--color-canvas-default)] border border-[var(--color-border-muted)]'
                      }`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium truncate">
                            {entry.sessionName || `Session ${entry.sessionId}`}
                          </span>
                          {change && change !== 'same' && (
                            <Badge
                              variant="secondary"
                              className={`text-xs shrink-0 ${
                                change === 'improved' ? 'bg-[var(--color-success-subtle)] text-[var(--color-success-fg)]' :
                                change === 'declined' ? 'bg-[var(--color-danger-subtle)] text-[var(--color-danger-fg)]' :
                                change === 'gained' ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent-fg)]' :
                                'bg-[var(--color-warning-subtle)] text-[var(--color-warning-fg)]'
                              }`}
                            >
                              {change === 'improved' && <ArrowUp className="h-3 w-3 mr-0.5" />}
                              {change === 'declined' && <ArrowDown className="h-3 w-3 mr-0.5" />}
                              {change === 'improved' ? 'Up' :
                               change === 'declined' ? 'Down' :
                               change === 'gained' ? '+AIO' : '-AIO'}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-[var(--color-fg-muted)] mt-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(entry.sessionDate)}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className={entry.hasAIOverview ? 'text-[var(--color-success-fg)]' : 'text-[var(--color-fg-muted)]'}>
                            {entry.hasAIOverview ? 'Has AIO' : 'No AIO'}
                          </span>
                          {entry.brandRank && (
                            <span className="text-[var(--color-warning-fg)]">
                              Brand #{entry.brandRank}
                            </span>
                          )}
                          {entry.referenceCount > 0 && (
                            <span className="text-[var(--color-fg-muted)]">
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

            {/* Detail view on the right */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {selectedEntry ? (
                <>
                  {/* Session header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-default)] bg-[var(--color-canvas-subtle)]">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--color-fg-default)]">
                        {selectedEntry.sessionName || `Session ${selectedEntry.sessionId}`}
                      </h3>
                      <p className="text-sm text-[var(--color-fg-muted)]">
                        {formatDate(selectedEntry.sessionDate)}
                      </p>
                    </div>
                    {onViewSession && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewSession(selectedEntry.sessionId)}
                      >
                        View Full Session
                      </Button>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-[var(--color-border-default)]">
                    <Card className="p-3 bg-[var(--color-canvas-subtle)]">
                      <div className="text-sm text-[var(--color-fg-muted)]">AI Overview</div>
                      <div className={`text-lg font-semibold ${
                        selectedEntry.hasAIOverview ? 'text-[var(--color-success-fg)]' : 'text-[var(--color-fg-muted)]'
                      }`}>
                        {selectedEntry.hasAIOverview ? 'Yes' : 'No'}
                      </div>
                    </Card>
                    <Card className="p-3 bg-[var(--color-canvas-subtle)]">
                      <div className="text-sm text-[var(--color-fg-muted)]">AIO Rank</div>
                      <div className={`text-lg font-semibold ${
                        selectedEntry.brandRank ? 'text-[var(--color-warning-fg)]' : 'text-[var(--color-fg-muted)]'
                      }`}>
                        {selectedEntry.brandRank ? `#${selectedEntry.brandRank}` : 'Not cited'}
                      </div>
                    </Card>
                    <Card className="p-3 bg-[var(--color-canvas-subtle)]">
                      <div className="text-sm text-[var(--color-fg-muted)]">Organic Rank</div>
                      <div className={`text-lg font-semibold ${
                        selectedEntry.organicBrandRank ? 'text-[var(--color-accent-fg)]' : 'text-[var(--color-fg-muted)]'
                      }`}>
                        {selectedEntry.organicBrandRank ? `#${selectedEntry.organicBrandRank}` : 'Not ranked'}
                      </div>
                    </Card>
                    <Card className="p-3 bg-[var(--color-canvas-subtle)]">
                      <div className="text-sm text-[var(--color-fg-muted)]">Citations</div>
                      <div className="text-lg font-semibold text-[var(--color-fg-default)]">
                        {selectedEntry.referenceCount}
                      </div>
                    </Card>
                  </div>

                  {/* Content area */}
                  <div className="flex-1 overflow-y-auto">
                    {selectedEntry.hasAIOverview && selectedEntry.aioMarkdown ? (
                      <div className="flex h-full">
                        {/* AI Overview Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                          <h4 className="text-sm font-medium text-[var(--color-fg-muted)] uppercase tracking-wide mb-3">
                            AI Overview Content
                          </h4>
                          <div className="max-w-3xl">
                            <AIOContent
                              markdown={selectedEntry.aioMarkdown}
                              references={selectedEntry.references}
                              highlightedCitation={highlightedCitation}
                              onCitationHover={setHighlightedCitation}
                              onCitationClick={handleCitationClick}
                              brandName={brandName}
                            />
                          </div>
                        </div>

                        {/* Right Sidebar - Citations & Organic Results */}
                        <div className="w-80 border-l border-[var(--color-border-default)] overflow-y-auto p-4 bg-[var(--color-canvas-subtle)]">
                          {/* Citations Section */}
                          <div className="mb-6">
                            <h4 className="text-sm font-medium text-[var(--color-fg-muted)] uppercase tracking-wide mb-3">
                              AIO Citations
                            </h4>
                            <CitationList
                              references={selectedEntry.references}
                              highlightedCitation={highlightedCitation}
                              onCitationHover={setHighlightedCitation}
                              brandDomain={brandDomain}
                            />
                          </div>

                          {/* Organic Results Section */}
                          {selectedEntry.organicResults.length > 0 && (
                            <div className="pt-4 border-t border-[var(--color-border-default)]">
                              <OrganicResultsList
                                results={selectedEntry.organicResults}
                                brandDomain={brandDomain}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (selectedEntry.references.length > 0 || selectedEntry.organicResults.length > 0) ? (
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Citations Column */}
                          {selectedEntry.references.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-[var(--color-fg-muted)] uppercase tracking-wide mb-3">
                                AIO Citations
                              </h4>
                              <div className="space-y-2">
                                {selectedEntry.references.map((ref, idx) => {
                                  const isBrand = brandDomain && ref.domain.toLowerCase().includes(brandDomain.toLowerCase());

                                  return (
                                    <Card
                                      key={idx}
                                      className={`p-3 ${
                                        isBrand ? 'bg-[var(--color-warning-subtle)] border-[var(--color-warning-muted)]' : 'bg-[var(--color-canvas-default)]'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 flex items-center justify-center bg-[var(--color-canvas-subtle)] rounded text-xs font-medium">
                                          {ref.rank}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="text-sm font-medium truncate">
                                            {ref.source || ref.domain}
                                          </div>
                                          <div className="text-xs text-[var(--color-fg-muted)] truncate">
                                            {ref.domain}
                                          </div>
                                        </div>
                                        {isBrand && (
                                          <Badge variant="secondary" className="bg-[var(--color-warning-emphasis)] text-[var(--color-canvas-default)] shrink-0">
                                            Your Brand
                                          </Badge>
                                        )}
                                        {ref.url && (
                                          <a
                                            href={ref.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[var(--color-fg-muted)] hover:text-[var(--color-accent-fg)]"
                                          >
                                            <ExternalLink className="h-4 w-4" />
                                          </a>
                                        )}
                                      </div>
                                    </Card>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Organic Results Column */}
                          {selectedEntry.organicResults.length > 0 && (
                            <div>
                              <OrganicResultsList
                                results={selectedEntry.organicResults}
                                brandDomain={brandDomain}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-[var(--color-fg-muted)]">
                        <div className="text-center">
                          <Quote className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No AI Overview content for this session</p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-[var(--color-fg-muted)]">
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
