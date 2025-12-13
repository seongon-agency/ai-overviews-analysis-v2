'use client';

import { useState } from 'react';
import { KeywordRecord } from '@/lib/types';
import { KeywordComparisonPanel } from './KeywordComparisonPanel';
import { RankSparkline } from './RankSparkline';

// shadcn/ui components
import { Button } from '@/components/ui/button';

// Icons
import { ArrowUp, ArrowDown, ArrowUpDown, Search, Eye, TrendingUp, Sparkles } from 'lucide-react';

interface KeywordsTableProps {
  keywords: KeywordRecord[];
  projectId: number;
  brandDomain?: string;
  brandName?: string;
  showChanges?: boolean;
  previousSessionName?: string | null;
  rankHistory?: Map<string, { rank: number | null }[]>;
  onViewSession?: (sessionId: number) => void;
}

type SortField = 'keyword' | 'referenceCount' | 'brandRank' | 'change';

export function KeywordsTable({
  keywords,
  projectId,
  brandDomain,
  brandName,
  showChanges = false,
  previousSessionName,
  rankHistory,
  onViewSession
}: KeywordsTableProps) {
  const [selectedKeyword, setSelectedKeyword] = useState<KeywordRecord | null>(null);
  const [sortField, setSortField] = useState<SortField>('keyword');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterAIO, setFilterAIO] = useState<boolean | null>(null);
  const [filterChange, setFilterChange] = useState<string | null>(null);

  // Change type priority for sorting
  const changePriority: Record<string, number> = {
    rank_improved: 1,
    aio_gained: 2,
    rank_declined: 3,
    aio_lost: 4,
    new: 5,
    removed: 6
  };

  // Sort and filter keywords
  const processedKeywords = [...keywords]
    .filter(kw => {
      if (filterAIO !== null && kw.hasAIOverview !== filterAIO) return false;
      if (filterChange && kw.changeType !== filterChange) return false;
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;

      if (sortField === 'keyword') {
        comparison = a.keyword.localeCompare(b.keyword);
      } else if (sortField === 'referenceCount') {
        comparison = a.referenceCount - b.referenceCount;
      } else if (sortField === 'brandRank') {
        if (a.brandRank === null && b.brandRank === null) comparison = 0;
        else if (a.brandRank === null) comparison = 1;
        else if (b.brandRank === null) comparison = -1;
        else comparison = a.brandRank - b.brandRank;
      } else if (sortField === 'change') {
        const priorityA = a.changeType ? (changePriority[a.changeType] || 99) : 99;
        const priorityB = b.changeType ? (changePriority[b.changeType] || 99) : 99;
        comparison = priorityA - priorityB;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

  // Count changes for filter badges
  const changeCounts = {
    rank_improved: keywords.filter(k => k.changeType === 'rank_improved').length,
    rank_declined: keywords.filter(k => k.changeType === 'rank_declined').length,
    aio_gained: keywords.filter(k => k.changeType === 'aio_gained').length,
    aio_lost: keywords.filter(k => k.changeType === 'aio_lost').length
  };
  const hasAnyChanges = Object.values(changeCounts).some(c => c > 0);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 text-[var(--color-border-default)]" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="h-3 w-3 ml-1 text-[var(--color-accent-fg)]" />
      : <ArrowDown className="h-3 w-3 ml-1 text-[var(--color-accent-fg)]" />;
  };

  // Helper to render change indicator
  const renderChangeIndicator = (kw: KeywordRecord) => {
    if (!kw.changeType) return null;

    switch (kw.changeType) {
      case 'rank_improved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-success-subtle)] text-[var(--color-success-fg)]">
            <ArrowUp className="h-3 w-3" />
            {kw.previousBrandRank && kw.brandRank && `+${kw.previousBrandRank - kw.brandRank}`}
          </span>
        );
      case 'rank_declined':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-danger-subtle)] text-[var(--color-danger-fg)]">
            <ArrowDown className="h-3 w-3" />
            {kw.previousBrandRank && kw.brandRank && `-${kw.brandRank - kw.previousBrandRank}`}
          </span>
        );
      case 'aio_gained':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-accent-subtle)] text-[var(--color-accent-fg)]">
            +AIO
          </span>
        );
      case 'aio_lost':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-warning-subtle)] text-[var(--color-warning-fg)]">
            -AIO
          </span>
        );
      case 'new':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-accent-subtle)] text-[var(--color-accent-fg)]">
            NEW
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <p className="text-sm text-[var(--color-fg-muted)]">
          Showing <span className="font-medium text-[var(--color-fg-default)]">{processedKeywords.length}</span> of <span className="font-medium text-[var(--color-fg-default)]">{keywords.length}</span> keywords
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterAIO === true ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterAIO(filterAIO === true ? null : true)}
            className={`h-8 text-xs rounded-md ${
              filterAIO === true
                ? 'bg-[var(--color-success-emphasis)] hover:bg-[var(--color-success-emphasis)]'
                : 'border-[var(--color-border-default)] hover:bg-[var(--color-canvas-subtle)]'
            }`}
          >
            <Eye className="h-3 w-3 mr-1.5" />
            Has AI Overview
          </Button>
          <Button
            variant={filterAIO === false ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterAIO(filterAIO === false ? null : false)}
            className={`h-8 text-xs rounded-md ${
              filterAIO === false
                ? 'bg-[var(--color-fg-muted)] hover:bg-[var(--color-fg-muted)]'
                : 'border-[var(--color-border-default)] hover:bg-[var(--color-canvas-subtle)]'
            }`}
          >
            No AI Overview
          </Button>
          {/* Change filters */}
          {showChanges && hasAnyChanges && (
            <>
              <span className="text-[var(--color-border-default)]">|</span>
              {changeCounts.rank_improved > 0 && (
                <Button
                  variant={filterChange === 'rank_improved' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterChange(filterChange === 'rank_improved' ? null : 'rank_improved')}
                  className={`h-8 text-xs rounded-md ${
                    filterChange === 'rank_improved'
                      ? 'bg-[var(--color-success-emphasis)] hover:bg-[var(--color-success-emphasis)]'
                      : 'border-[var(--color-border-default)] hover:bg-[var(--color-canvas-subtle)]'
                  }`}
                >
                  <TrendingUp className="h-3 w-3 mr-1.5" />
                  Improved ({changeCounts.rank_improved})
                </Button>
              )}
              {changeCounts.rank_declined > 0 && (
                <Button
                  variant={filterChange === 'rank_declined' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterChange(filterChange === 'rank_declined' ? null : 'rank_declined')}
                  className={`h-8 text-xs rounded-md ${
                    filterChange === 'rank_declined'
                      ? 'bg-[var(--color-danger-emphasis)] hover:bg-[var(--color-danger-emphasis)]'
                      : 'border-[var(--color-border-default)] hover:bg-[var(--color-canvas-subtle)]'
                  }`}
                >
                  Declined ({changeCounts.rank_declined})
                </Button>
              )}
              {changeCounts.aio_gained > 0 && (
                <Button
                  variant={filterChange === 'aio_gained' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterChange(filterChange === 'aio_gained' ? null : 'aio_gained')}
                  className={`h-8 text-xs rounded-md ${
                    filterChange === 'aio_gained'
                      ? 'bg-[var(--color-accent-emphasis)] hover:bg-[var(--color-accent-emphasis)]'
                      : 'border-[var(--color-border-default)] hover:bg-[var(--color-canvas-subtle)]'
                  }`}
                >
                  +AIO ({changeCounts.aio_gained})
                </Button>
              )}
              {changeCounts.aio_lost > 0 && (
                <Button
                  variant={filterChange === 'aio_lost' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterChange(filterChange === 'aio_lost' ? null : 'aio_lost')}
                  className={`h-8 text-xs rounded-md ${
                    filterChange === 'aio_lost'
                      ? 'bg-[var(--color-warning-emphasis)] hover:bg-[var(--color-warning-emphasis)]'
                      : 'border-[var(--color-border-default)] hover:bg-[var(--color-canvas-subtle)]'
                  }`}
                >
                  -AIO ({changeCounts.aio_lost})
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Previous session info banner */}
      {showChanges && previousSessionName && hasAnyChanges && (
        <div className="px-4 py-3 bg-[var(--color-accent-subtle)] border border-[var(--color-accent-muted)] rounded-md text-sm text-[var(--color-accent-fg)] flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Comparing to: <span className="font-semibold">{previousSessionName}</span>
        </div>
      )}

      {/* Table */}
      <div className="gh-box rounded-md border border-[var(--color-border-default)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[var(--color-canvas-subtle)]">
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider cursor-pointer hover:bg-[var(--color-neutral-muted)] transition-colors"
                onClick={() => handleSort('keyword')}
              >
                <div className="flex items-center">
                  Keyword <SortIcon field="keyword" />
                </div>
              </th>
              {rankHistory && (
                <th className="w-20 px-4 py-3 text-center text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider">
                  Trend
                </th>
              )}
              {showChanges && (
                <th
                  className="w-24 px-4 py-3 text-center text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider cursor-pointer hover:bg-[var(--color-neutral-muted)] transition-colors"
                  onClick={() => handleSort('change')}
                >
                  <div className="flex items-center justify-center">
                    Change <SortIcon field="change" />
                  </div>
                </th>
              )}
              <th className="w-20 px-4 py-3 text-center text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider">
                AIO
              </th>
              <th
                className="w-24 px-4 py-3 text-center text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider cursor-pointer hover:bg-[var(--color-neutral-muted)] transition-colors"
                onClick={() => handleSort('referenceCount')}
              >
                <div className="flex items-center justify-center">
                  Citations <SortIcon field="referenceCount" />
                </div>
              </th>
              <th
                className="w-28 px-4 py-3 text-center text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider cursor-pointer hover:bg-[var(--color-neutral-muted)] transition-colors"
                onClick={() => handleSort('brandRank')}
              >
                <div className="flex items-center justify-center">
                  Brand Cited <SortIcon field="brandRank" />
                </div>
              </th>
              <th className="w-24 px-4 py-3 text-center text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider">
                Mentioned
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-muted)]">
            {processedKeywords.map((kw) => (
              <tr
                key={kw.id}
                className={`cursor-pointer transition-all duration-150 ${
                  kw.changeType === 'rank_improved' || kw.changeType === 'aio_gained'
                    ? 'bg-[var(--color-success-subtle)] hover:bg-[var(--color-success-subtle)]'
                    : kw.changeType === 'rank_declined' || kw.changeType === 'aio_lost'
                    ? 'bg-[var(--color-danger-subtle)] hover:bg-[var(--color-danger-subtle)]'
                    : 'hover:bg-[var(--color-canvas-subtle)]'
                }`}
                onClick={() => setSelectedKeyword(kw)}
              >
                <td className="px-4 py-3">
                  <span className="font-medium text-[var(--color-fg-default)] hover:text-[var(--color-accent-fg)] transition-colors">
                    {kw.keyword}
                  </span>
                </td>
                {rankHistory && (
                  <td className="px-4 py-3 text-center">
                    {rankHistory.get(kw.keyword) && rankHistory.get(kw.keyword)!.length >= 2 ? (
                      <RankSparkline data={rankHistory.get(kw.keyword)!} />
                    ) : (
                      <span className="text-[var(--color-border-default)]">-</span>
                    )}
                  </td>
                )}
                {showChanges && (
                  <td className="px-4 py-3 text-center">
                    {renderChangeIndicator(kw) || <span className="text-[var(--color-border-default)]">-</span>}
                  </td>
                )}
                <td className="px-4 py-3 text-center">
                  {kw.hasAIOverview ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-success-subtle)] text-[var(--color-success-fg)]">
                      Yes
                    </span>
                  ) : (
                    <span className="text-[var(--color-border-default)]">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center text-[var(--color-fg-muted)]">
                  {kw.referenceCount || <span className="text-[var(--color-border-default)]">-</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  {kw.brandRank ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-warning-subtle)] text-[var(--color-warning-fg)]">
                      #{kw.brandRank}
                    </span>
                  ) : (
                    <span className="text-[var(--color-border-default)]">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {kw.brandMentioned ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-accent-subtle)] text-[var(--color-accent-fg)]">
                      Yes
                    </span>
                  ) : kw.hasAIOverview ? (
                    <span className="text-[var(--color-fg-subtle)]">No</span>
                  ) : (
                    <span className="text-[var(--color-border-default)]">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {processedKeywords.length === 0 && (
          <div className="p-12 text-center">
            <div className="h-12 w-12 rounded-md bg-[var(--color-canvas-subtle)] flex items-center justify-center mx-auto mb-3">
              <Search className="h-6 w-6 text-[var(--color-fg-subtle)]" />
            </div>
            <p className="text-[var(--color-fg-muted)]">No keywords found matching the filter criteria</p>
          </div>
        )}
      </div>

      {/* Keyword Comparison Panel */}
      {selectedKeyword && (
        <KeywordComparisonPanel
          keyword={selectedKeyword}
          projectId={projectId}
          brandDomain={brandDomain}
          brandName={brandName}
          onClose={() => setSelectedKeyword(null)}
          onViewSession={onViewSession}
        />
      )}
    </div>
  );
}
