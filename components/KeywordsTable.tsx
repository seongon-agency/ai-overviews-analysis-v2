'use client';

import { useState } from 'react';
import { KeywordRecord } from '@/lib/types';
import { KeywordComparisonPanel } from './KeywordComparisonPanel';
import { RankSparkline } from './RankSparkline';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Icons
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

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
      return <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground/50" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  // Helper to render change indicator
  const renderChangeIndicator = (kw: KeywordRecord) => {
    if (!kw.changeType) return null;

    switch (kw.changeType) {
      case 'rank_improved':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700 gap-1">
            <ArrowUp className="h-3 w-3" />
            {kw.previousBrandRank && kw.brandRank && `+${kw.previousBrandRank - kw.brandRank}`}
          </Badge>
        );
      case 'rank_declined':
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-700 gap-1">
            <ArrowDown className="h-3 w-3" />
            {kw.previousBrandRank && kw.brandRank && `-${kw.brandRank - kw.previousBrandRank}`}
          </Badge>
        );
      case 'aio_gained':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            +AIO
          </Badge>
        );
      case 'aio_lost':
        return (
          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
            -AIO
          </Badge>
        );
      case 'new':
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            NEW
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <p className="text-sm text-muted-foreground">
          Showing {processedKeywords.length} of {keywords.length} keywords
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterAIO === true ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterAIO(filterAIO === true ? null : true)}
            className="h-7 text-xs"
          >
            Has AI Overview
          </Button>
          <Button
            variant={filterAIO === false ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterAIO(filterAIO === false ? null : false)}
            className="h-7 text-xs"
          >
            No AI Overview
          </Button>
          {/* Change filters */}
          {showChanges && hasAnyChanges && (
            <>
              <span className="text-muted-foreground/30">|</span>
              {changeCounts.rank_improved > 0 && (
                <Button
                  variant={filterChange === 'rank_improved' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterChange(filterChange === 'rank_improved' ? null : 'rank_improved')}
                  className="h-7 text-xs"
                >
                  Improved ({changeCounts.rank_improved})
                </Button>
              )}
              {changeCounts.rank_declined > 0 && (
                <Button
                  variant={filterChange === 'rank_declined' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterChange(filterChange === 'rank_declined' ? null : 'rank_declined')}
                  className="h-7 text-xs"
                >
                  Declined ({changeCounts.rank_declined})
                </Button>
              )}
              {changeCounts.aio_gained > 0 && (
                <Button
                  variant={filterChange === 'aio_gained' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterChange(filterChange === 'aio_gained' ? null : 'aio_gained')}
                  className="h-7 text-xs"
                >
                  +AIO ({changeCounts.aio_gained})
                </Button>
              )}
              {changeCounts.aio_lost > 0 && (
                <Button
                  variant={filterChange === 'aio_lost' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterChange(filterChange === 'aio_lost' ? null : 'aio_lost')}
                  className="h-7 text-xs"
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
        <div className="px-3 py-2 bg-purple-50 border border-purple-100 rounded-lg text-sm text-purple-700">
          Comparing to: <span className="font-medium">{previousSessionName}</span>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('keyword')}
              >
                <div className="flex items-center">
                  Keyword <SortIcon field="keyword" />
                </div>
              </TableHead>
              {rankHistory && (
                <TableHead className="w-20 text-center">Trend</TableHead>
              )}
              {showChanges && (
                <TableHead
                  className="w-24 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('change')}
                >
                  <div className="flex items-center justify-center">
                    Change <SortIcon field="change" />
                  </div>
                </TableHead>
              )}
              <TableHead className="w-20 text-center">AIO</TableHead>
              <TableHead
                className="w-24 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('referenceCount')}
              >
                <div className="flex items-center justify-center">
                  Citations <SortIcon field="referenceCount" />
                </div>
              </TableHead>
              <TableHead
                className="w-28 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('brandRank')}
              >
                <div className="flex items-center justify-center">
                  Brand Cited <SortIcon field="brandRank" />
                </div>
              </TableHead>
              <TableHead className="w-24 text-center">Mentioned</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedKeywords.map((kw) => (
              <TableRow
                key={kw.id}
                className={`cursor-pointer transition-colors ${
                  kw.changeType === 'rank_improved' || kw.changeType === 'aio_gained'
                    ? 'bg-green-50/50 hover:bg-green-100/50'
                    : kw.changeType === 'rank_declined' || kw.changeType === 'aio_lost'
                    ? 'bg-red-50/50 hover:bg-red-100/50'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedKeyword(kw)}
              >
                <TableCell>
                  <span className="font-medium hover:text-primary transition-colors">
                    {kw.keyword}
                  </span>
                </TableCell>
                {rankHistory && (
                  <TableCell className="text-center">
                    {rankHistory.get(kw.keyword) && rankHistory.get(kw.keyword)!.length >= 2 ? (
                      <RankSparkline data={rankHistory.get(kw.keyword)!} />
                    ) : (
                      <span className="text-muted-foreground/50">-</span>
                    )}
                  </TableCell>
                )}
                {showChanges && (
                  <TableCell className="text-center">
                    {renderChangeIndicator(kw) || <span className="text-muted-foreground/50">-</span>}
                  </TableCell>
                )}
                <TableCell className="text-center">
                  {kw.hasAIOverview ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      Yes
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground/50">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {kw.referenceCount || '-'}
                </TableCell>
                <TableCell className="text-center">
                  {kw.brandRank ? (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                      #{kw.brandRank}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground/50">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {kw.brandMentioned ? (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                      Yes
                    </Badge>
                  ) : kw.hasAIOverview ? (
                    <span className="text-muted-foreground/50">No</span>
                  ) : (
                    <span className="text-muted-foreground/50">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {processedKeywords.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No keywords found matching the filter criteria
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
