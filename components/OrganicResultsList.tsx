'use client';

import { OrganicResult } from '@/lib/types';

interface OrganicResultsListProps {
  results: OrganicResult[];
  brandDomain?: string;
}

export function OrganicResultsList({
  results,
  brandDomain
}: OrganicResultsListProps) {
  const isBrandResult = (result: OrganicResult): boolean => {
    if (!brandDomain) return false;
    return result.domain.toLowerCase().includes(brandDomain.toLowerCase());
  };

  if (results.length === 0) {
    return (
      <div className="text-[var(--color-fg-muted)] text-sm italic p-4">
        No organic results available
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="text-sm font-medium text-[var(--color-fg-default)] mb-2">
        Top Organic Results ({results.length})
      </div>
      {results.map((result) => {
        const isBrand = isBrandResult(result);

        return (
          <div
            key={result.rank}
            className={`
              flex items-start gap-3 p-3 rounded text-sm
              transition-all duration-150
              hover:bg-[var(--color-canvas-subtle)]
              ${isBrand ? 'border-l-4 border-[var(--color-warning-emphasis)] bg-[var(--color-warning-subtle)]' : 'border border-[var(--color-border-muted)]'}
            `}
          >
            <span
              className={`
                w-6 h-6 flex items-center justify-center rounded text-xs font-medium flex-shrink-0
                ${isBrand
                  ? 'bg-[var(--color-warning-emphasis)] text-[var(--color-canvas-default)]'
                  : 'bg-[var(--color-neutral-muted)] text-[var(--color-fg-default)]'
                }
              `}
            >
              {result.rank}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-medium line-clamp-1 flex items-center gap-2">
                <span className="truncate">{result.title}</span>
                {isBrand && (
                  <span className="text-xs bg-[var(--color-warning-emphasis)] text-[var(--color-canvas-default)] px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0">
                    Your Site
                  </span>
                )}
              </div>
              <div className="text-[var(--color-fg-muted)] text-xs truncate">{result.domain}</div>
              {result.description && (
                <div className="text-[var(--color-fg-muted)] text-xs mt-1 line-clamp-2">
                  {result.description}
                </div>
              )}
            </div>
            <a
              href={result.url}
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
