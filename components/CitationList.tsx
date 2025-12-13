'use client';

import { useEffect, useRef } from 'react';
import { Reference } from '@/lib/types';

interface CitationListProps {
  references: Reference[];
  highlightedCitation: number | null;
  onCitationHover: (num: number | null) => void;
  brandDomain?: string;
}

export function CitationList({
  references,
  highlightedCitation,
  onCitationHover,
  brandDomain
}: CitationListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Scroll to highlighted citation when clicking badge in content
  useEffect(() => {
    if (highlightedCitation !== null && itemRefs.current.has(highlightedCitation)) {
      const element = itemRefs.current.get(highlightedCitation);
      element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [highlightedCitation]);

  const isBrandCitation = (ref: Reference): boolean => {
    if (!brandDomain) return false;
    return ref.domain.toLowerCase().includes(brandDomain.toLowerCase());
  };

  if (references.length === 0) {
    return (
      <div className="text-[var(--color-fg-muted)] text-sm italic p-4">
        No citations available
      </div>
    );
  }

  return (
    <div ref={listRef} className="space-y-1">
      <div className="text-sm font-medium text-[var(--color-fg-default)] mb-2">
        Citations ({references.length})
      </div>
      {references.map((ref) => {
        const isHighlighted = highlightedCitation === ref.rank;
        const isBrand = isBrandCitation(ref);

        return (
          <div
            key={ref.rank}
            ref={(el) => {
              if (el) itemRefs.current.set(ref.rank, el);
            }}
            className={`
              flex items-center gap-3 p-2 rounded text-sm
              transition-all duration-150
              ${isHighlighted
                ? 'bg-[var(--color-accent-subtle)] ring-2 ring-[var(--color-accent-emphasis)]'
                : 'hover:bg-[var(--color-canvas-subtle)]'
              }
              ${isBrand ? 'border-l-4 border-[var(--color-warning-emphasis)] bg-[var(--color-warning-subtle)]' : ''}
            `}
            onMouseEnter={() => onCitationHover(ref.rank)}
            onMouseLeave={() => onCitationHover(null)}
          >
            <span
              className={`
                w-6 h-6 flex items-center justify-center rounded text-xs font-medium flex-shrink-0
                ${isHighlighted
                  ? 'bg-[var(--color-accent-emphasis)] text-[var(--color-canvas-default)]'
                  : 'bg-[var(--color-neutral-muted)] text-[var(--color-fg-default)]'
                }
              `}
            >
              {ref.rank}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate flex items-center gap-2">
                {ref.source}
                {isBrand && (
                  <span className="text-xs bg-[var(--color-warning-emphasis)] text-[var(--color-canvas-default)] px-1.5 py-0.5 rounded">
                    Your Brand
                  </span>
                )}
              </div>
              <div className="text-[var(--color-fg-muted)] text-xs truncate">{ref.domain}</div>
            </div>
            <a
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-accent-fg)] hover:text-[var(--color-accent-emphasis)] flex-shrink-0 p-1"
              title="Open link"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        );
      })}
    </div>
  );
}
