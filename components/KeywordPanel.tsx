'use client';

import { useState, useCallback } from 'react';
import { Reference } from '@/lib/types';
import { AIOContent } from './AIOContent';
import { CitationList } from './CitationList';

interface KeywordPanelProps {
  keyword: string;
  aioMarkdown: string | null;
  references: Reference[];
  brandDomain?: string;
  brandName?: string;
  onClose: () => void;
}

export function KeywordPanel({
  keyword,
  aioMarkdown,
  references,
  brandDomain,
  brandName,
  onClose
}: KeywordPanelProps) {
  const [highlightedCitation, setHighlightedCitation] = useState<number | null>(null);

  const handleCitationClick = useCallback((num: number) => {
    setHighlightedCitation(num);
    // Brief highlight then clear
    setTimeout(() => setHighlightedCitation(null), 2000);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Panel - centered modal with horizontal layout */}
      <div className="relative w-full max-w-6xl h-[85vh] mx-4 bg-[var(--color-canvas-default)] rounded-md shadow-[var(--color-shadow-large)] flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-default)] bg-[var(--color-canvas-subtle)] rounded-t-md">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-[var(--color-fg-default)] truncate">
              {keyword}
            </h2>
            <p className="text-sm text-[var(--color-fg-muted)]">
              AI Overview with {references.length} citation{references.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--color-neutral-muted)] rounded-md transition-colors ml-4"
            title="Close (Esc)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - horizontal split layout */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left side: AI Overview Content (takes more space) */}
          <div className="flex-[3] overflow-y-auto p-6 border-r border-[var(--color-border-default)]">
            <div className="max-w-3xl mx-auto">
              <div className="text-sm font-medium text-[var(--color-fg-muted)] uppercase tracking-wide mb-4">
                AI Overview Content
              </div>
              <div className="bg-[var(--color-canvas-default)] rounded-md">
                <AIOContent
                  markdown={aioMarkdown || ''}
                  references={references}
                  highlightedCitation={highlightedCitation}
                  onCitationHover={setHighlightedCitation}
                  onCitationClick={handleCitationClick}
                  brandName={brandName}
                />
              </div>
            </div>
          </div>

          {/* Right side: Citations List */}
          <div className="flex-[1] min-w-[280px] max-w-[360px] overflow-y-auto p-4 bg-[var(--color-canvas-subtle)]">
            <div className="text-sm font-medium text-[var(--color-fg-muted)] uppercase tracking-wide mb-4">
              Sources ({references.length})
            </div>
            <CitationList
              references={references}
              highlightedCitation={highlightedCitation}
              onCitationHover={setHighlightedCitation}
              brandDomain={brandDomain}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
