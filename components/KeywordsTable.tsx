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
      return <ArrowUpDown className="h-3 w-3 ml-1 text-gray-300" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="h-3 w-3 ml-1 text-indigo-600" />
      : <ArrowDown className="h-3 w-3 ml-1 text-indigo-600" />;
  };

  // Helper to render change indicator
  const renderChangeIndicator = (kw: KeywordRecord) => {
    if (!kw.changeType) return null;

    switch (kw.changeType) {
      case 'rank_improved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
            <ArrowUp className="h-3 w-3" />
            {kw.previousBrandRank && kw.brandRank && `+${kw.previousBrandRank - kw.brandRank}`}
          </span>
        );
      case 'rank_declined':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <ArrowDown className="h-3 w-3" />
            {kw.previousBrandRank && kw.brandRank && `-${kw.brandRank - kw.previousBrandRank}`}
          </span>
        );
      case 'aio_gained':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            +AIO
          </span>
        );
      case 'aio_lost':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
            -AIO
          </span>
        );
      case 'new':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
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
        <p className="text-sm text-gray-500">
          Showing <span className="font-medium text-gray-900">{processedKeywords.length}</span> of <span className="font-medium text-gray-900">{keywords.length}</span> keywords
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterAIO === true ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterAIO(filterAIO === true ? null : true)}
            className={`h-8 text-xs rounded-xl ${
              filterAIO === true
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Eye className="h-3 w-3 mr-1.5" />
            Has AI Overview
          </Button>
          <Button
            variant={filterAIO === false ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterAIO(filterAIO === false ? null : false)}
            className={`h-8 text-xs rounded-xl ${
              filterAIO === false
                ? 'bg-gray-600 hover:bg-gray-700'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            No AI Overview
          </Button>
          {/* Change filters */}
          {showChanges && hasAnyChanges && (
            <>
              <span className="text-gray-200">|</span>
              {changeCounts.rank_improved > 0 && (
                <Button
                  variant={filterChange === 'rank_improved' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterChange(filterChange === 'rank_improved' ? null : 'rank_improved')}
                  className={`h-8 text-xs rounded-xl ${
                    filterChange === 'rank_improved'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'border-gray-200 hover:bg-gray-50'
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
                  className={`h-8 text-xs rounded-xl ${
                    filterChange === 'rank_declined'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'border-gray-200 hover:bg-gray-50'
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
                  className={`h-8 text-xs rounded-xl ${
                    filterChange === 'aio_gained'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'border-gray-200 hover:bg-gray-50'
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
                  className={`h-8 text-xs rounded-xl ${
                    filterChange === 'aio_lost'
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'border-gray-200 hover:bg-gray-50'
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
        <div className="px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-700 flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Comparing to: <span className="font-semibold">{previousSessionName}</span>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/80">
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('keyword')}
              >
                <div className="flex items-center">
                  Keyword <SortIcon field="keyword" />
                </div>
              </th>
              {rankHistory && (
                <th className="w-20 px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Trend
                </th>
              )}
              {showChanges && (
                <th
                  className="w-24 px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('change')}
                >
                  <div className="flex items-center justify-center">
                    Change <SortIcon field="change" />
                  </div>
                </th>
              )}
              <th className="w-20 px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                AIO
              </th>
              <th
                className="w-24 px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('referenceCount')}
              >
                <div className="flex items-center justify-center">
                  Citations <SortIcon field="referenceCount" />
                </div>
              </th>
              <th
                className="w-28 px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('brandRank')}
              >
                <div className="flex items-center justify-center">
                  Brand Cited <SortIcon field="brandRank" />
                </div>
              </th>
              <th className="w-24 px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Mentioned
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {processedKeywords.map((kw) => (
              <tr
                key={kw.id}
                className={`cursor-pointer transition-all duration-150 ${
                  kw.changeType === 'rank_improved' || kw.changeType === 'aio_gained'
                    ? 'bg-emerald-50/50 hover:bg-emerald-100/50'
                    : kw.changeType === 'rank_declined' || kw.changeType === 'aio_lost'
                    ? 'bg-red-50/50 hover:bg-red-100/50'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedKeyword(kw)}
              >
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-900 hover:text-indigo-600 transition-colors">
                    {kw.keyword}
                  </span>
                </td>
                {rankHistory && (
                  <td className="px-4 py-3 text-center">
                    {rankHistory.get(kw.keyword) && rankHistory.get(kw.keyword)!.length >= 2 ? (
                      <RankSparkline data={rankHistory.get(kw.keyword)!} />
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                )}
                {showChanges && (
                  <td className="px-4 py-3 text-center">
                    {renderChangeIndicator(kw) || <span className="text-gray-300">-</span>}
                  </td>
                )}
                <td className="px-4 py-3 text-center">
                  {kw.hasAIOverview ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                      Yes
                    </span>
                  ) : (
                    <span className="text-gray-300">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center text-gray-500">
                  {kw.referenceCount || <span className="text-gray-300">-</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  {kw.brandRank ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                      #{kw.brandRank}
                    </span>
                  ) : (
                    <span className="text-gray-300">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {kw.brandMentioned ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      Yes
                    </span>
                  ) : kw.hasAIOverview ? (
                    <span className="text-gray-400">No</span>
                  ) : (
                    <span className="text-gray-300">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {processedKeywords.length === 0 && (
          <div className="p-12 text-center">
            <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500">No keywords found matching the filter criteria</p>
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
