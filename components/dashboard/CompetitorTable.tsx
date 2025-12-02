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
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

interface CompetitorTableProps {
  competitors: CompetitorMetrics[];
  brandName: string;
}

type SortField = 'brand' | 'citedCount' | 'mentionedCount' | 'averageRank' | 'promptCitedRate' | 'mentionRate';

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
      case 'mentionedCount':
        comparison = a.mentionedCount - b.mentionedCount;
        break;
      case 'averageRank':
        comparison = a.averageRank - b.averageRank;
        break;
      case 'promptCitedRate':
        comparison = a.promptCitedRate - b.promptCitedRate;
        break;
      case 'mentionRate':
        comparison = a.mentionRate - b.mentionRate;
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
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

  const isUserBrand = (competitor: CompetitorMetrics) => competitor.isUserBrand === true;

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12">#</TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleSort('brand')}
            >
              <div className="flex items-center">
                Brand <SortIcon field="brand" />
              </div>
            </TableHead>
            <TableHead
              className="text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleSort('citedCount')}
            >
              <div className="flex items-center justify-center">
                Citations <SortIcon field="citedCount" />
              </div>
            </TableHead>
            <TableHead
              className="text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleSort('mentionedCount')}
            >
              <div className="flex items-center justify-center">
                Mentions <SortIcon field="mentionedCount" />
              </div>
            </TableHead>
            <TableHead
              className="text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleSort('averageRank')}
            >
              <div className="flex items-center justify-center">
                Avg Rank <SortIcon field="averageRank" />
              </div>
            </TableHead>
            <TableHead
              className="text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleSort('promptCitedRate')}
            >
              <div className="flex items-center justify-center">
                Citation Rate <SortIcon field="promptCitedRate" />
              </div>
            </TableHead>
            <TableHead
              className="text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleSort('mentionRate')}
            >
              <div className="flex items-center justify-center">
                Mention Rate <SortIcon field="mentionRate" />
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCompetitors.map((competitor, index) => (
            <TableRow
              key={competitor.brand}
              className={isUserBrand(competitor) ? 'bg-amber-50/50' : ''}
            >
              <TableCell className="text-muted-foreground">{index + 1}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{competitor.brand}</span>
                  {isUserBrand(competitor) && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                      Your Brand
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-center font-medium text-blue-600">
                {competitor.citedCount}
              </TableCell>
              <TableCell className="text-center font-medium text-purple-600">
                {competitor.mentionedCount}
              </TableCell>
              <TableCell className="text-center text-muted-foreground">
                {competitor.averageRank.toFixed(1)}
              </TableCell>
              <TableCell className="text-center text-muted-foreground">
                {(competitor.promptCitedRate * 100).toFixed(1)}%
              </TableCell>
              <TableCell className="text-center text-muted-foreground">
                {(competitor.mentionRate * 100).toFixed(1)}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
