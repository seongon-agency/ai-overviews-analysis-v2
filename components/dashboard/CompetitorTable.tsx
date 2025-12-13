'use client';

import { useState } from 'react';
import { CompetitorMetrics } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowUp, ArrowDown, ArrowUpDown, ExternalLink } from 'lucide-react';

interface CompetitorTableProps {
  competitors: CompetitorMetrics[];
  brandName: string;
}

type SortField = 'brand' | 'citedCount' | 'averageRank' | 'promptCitedRate';

export function CompetitorTable({ competitors }: CompetitorTableProps) {
  const [sortField, setSortField] = useState<SortField>('citedCount');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortedCompetitors = [...competitors].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'brand':
        comparison = a.brand.localeCompare(b.brand);
        break;
      case 'citedCount':
        comparison = a.citedCount - b.citedCount;
        break;
      case 'averageRank':
        // Handle 0 as "no rank" - sort to bottom
        if (a.averageRank === 0 && b.averageRank === 0) comparison = 0;
        else if (a.averageRank === 0) comparison = 1;
        else if (b.averageRank === 0) comparison = -1;
        else comparison = a.averageRank - b.averageRank;
        break;
      case 'promptCitedRate':
        comparison = a.promptCitedRate - b.promptCitedRate;
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'averageRank' ? 'asc' : 'desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 ml-1.5 text-muted-foreground/40" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="h-3.5 w-3.5 ml-1.5 text-primary" />
      : <ArrowDown className="h-3.5 w-3.5 ml-1.5 text-primary" />;
  };

  const isUserBrand = (competitor: CompetitorMetrics) => competitor.isUserBrand === true;

  // Get citation rate color based on percentage
  const getCitationRateColor = (rate: number) => {
    if (rate >= 0.3) return 'text-[var(--color-success-fg)] bg-[var(--color-success-subtle)]';
    if (rate >= 0.1) return 'text-[var(--color-accent-fg)] bg-[var(--color-accent-subtle)]';
    return 'text-muted-foreground bg-muted/30';
  };

  return (
    <div className="rounded-md border overflow-hidden bg-[var(--color-canvas-default)]">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent bg-muted/30">
            <TableHead className="w-14 text-center font-semibold">Rank</TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50 transition-colors font-semibold"
              onClick={() => handleSort('brand')}
            >
              <div className="flex items-center">
                Source <SortIcon field="brand" />
              </div>
            </TableHead>
            <TableHead
              className="text-center cursor-pointer hover:bg-muted/50 transition-colors font-semibold w-28"
              onClick={() => handleSort('citedCount')}
            >
              <div className="flex items-center justify-center">
                Citations <SortIcon field="citedCount" />
              </div>
            </TableHead>
            <TableHead
              className="text-center cursor-pointer hover:bg-muted/50 transition-colors font-semibold w-28"
              onClick={() => handleSort('averageRank')}
            >
              <div className="flex items-center justify-center">
                Avg Rank <SortIcon field="averageRank" />
              </div>
            </TableHead>
            <TableHead
              className="text-center cursor-pointer hover:bg-muted/50 transition-colors font-semibold w-32"
              onClick={() => handleSort('promptCitedRate')}
            >
              <div className="flex items-center justify-center">
                Citation Rate <SortIcon field="promptCitedRate" />
              </div>
            </TableHead>
            <TableHead className="w-20 text-center font-semibold">Domain</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCompetitors.map((competitor, index) => (
            <TableRow
              key={competitor.brand}
              className={`transition-colors ${isUserBrand(competitor) ? 'bg-[var(--color-warning-subtle)] hover:bg-[var(--color-warning-subtle)]/70' : 'hover:bg-muted/30'}`}
            >
              <TableCell className="text-center">
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium ${
                  index === 0 ? 'bg-[var(--color-warning-subtle)] text-[var(--color-warning-fg)]' :
                  index === 1 ? 'bg-[var(--color-neutral-muted)] text-[var(--color-fg-muted)]' :
                  index === 2 ? 'bg-[var(--color-warning-subtle)] text-[var(--color-warning-fg)]' :
                  'text-muted-foreground'
                }`}>
                  {index + 1}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${isUserBrand(competitor) ? 'text-[var(--color-warning-fg)]' : ''}`}>
                    {competitor.brand}
                  </span>
                  {isUserBrand(competitor) && (
                    <Badge className="bg-[var(--color-warning-subtle)] text-[var(--color-warning-fg)] hover:bg-[var(--color-warning-subtle)] border-0 text-xs px-2">
                      You
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-md font-semibold ${
                  isUserBrand(competitor) ? 'bg-[var(--color-warning-subtle)] text-[var(--color-warning-fg)]' : 'bg-[var(--color-accent-subtle)] text-[var(--color-accent-fg)]'
                }`}>
                  {competitor.citedCount}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <span className="text-muted-foreground font-medium">
                  {competitor.averageRank > 0 ? competitor.averageRank.toFixed(1) : '-'}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${getCitationRateColor(competitor.promptCitedRate)}`}>
                  {(competitor.promptCitedRate * 100).toFixed(1)}%
                </span>
              </TableCell>
              <TableCell className="text-center">
                {competitor.uniqueDomains && competitor.uniqueDomains.length > 0 && (
                  <a
                    href={`https://${competitor.uniqueDomains[0]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
                    title={competitor.uniqueDomains[0]}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
