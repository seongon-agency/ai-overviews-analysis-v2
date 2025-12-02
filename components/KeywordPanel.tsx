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
  onClose: () => void;
}

export function KeywordPanel({
  keyword,
  aioMarkdown,
  references,
  brandDomain,
  onClose
}: KeywordPanelProps) {
  const [highlightedCitation, setHighlightedCitation] = useState<number | null>(null);

  const handleCitationClick = useCallback((num: number) => {
    setHighlightedCitation(num);
    // Brief highlight then clear
    setTimeout(() => setHighlightedCitation(null), 2000);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-2xl bg-white shadow-xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {keyword}
            </h2>
            <p className="text-sm text-gray-500">
              {references.length} citation{references.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors ml-4"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* AI Overview Content */}
          <div className="flex-1 overflow-y-auto p-4 border-b">
            <div className="text-sm font-medium text-gray-700 mb-3">
              AI Overview Content
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border">
              <AIOContent
                markdown={aioMarkdown || ''}
                highlightedCitation={highlightedCitation}
                onCitationHover={setHighlightedCitation}
                onCitationClick={handleCitationClick}
              />
            </div>
          </div>

          {/* Citations List */}
          <div className="h-64 min-h-[16rem] overflow-y-auto p-4 bg-gray-50">
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
