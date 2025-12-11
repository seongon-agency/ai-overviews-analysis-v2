'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { KeywordRecord } from '@/lib/types';
import { Search, ChevronDown, ChevronUp, ExternalLink, Award, AlertTriangle, CheckCircle } from 'lucide-react';

interface KeywordPerformanceGridProps {
  keywords: KeywordRecord[];
  brandName: string;
  brandDomain: string;
}

export function KeywordPerformanceGrid({ keywords, brandName, brandDomain }: KeywordPerformanceGridProps) {
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<'all' | 'cited' | 'not-cited' | 'no-aio'>('all');

  const processedKeywords = useMemo(() => {
    return keywords.map(kw => {
      let status: 'top' | 'mid' | 'low' | 'not-cited' | 'no-aio';
      let statusLabel: string;
      let statusColor: string;

      if (!kw.hasAIOverview) {
        status = 'no-aio';
        statusLabel = 'No AIO';
        statusColor = 'bg-gray-100 text-gray-600';
      } else if (kw.brandRank === null) {
        status = 'not-cited';
        statusLabel = 'Not Cited';
        statusColor = 'bg-amber-100 text-amber-700';
      } else if (kw.brandRank <= 3) {
        status = 'top';
        statusLabel = `#${kw.brandRank}`;
        statusColor = 'bg-green-100 text-green-700';
      } else if (kw.brandRank <= 6) {
        status = 'mid';
        statusLabel = `#${kw.brandRank}`;
        statusColor = 'bg-blue-100 text-blue-700';
      } else {
        status = 'low';
        statusLabel = `#${kw.brandRank}`;
        statusColor = 'bg-purple-100 text-purple-700';
      }

      return {
        ...kw,
        status,
        statusLabel,
        statusColor
      };
    });
  }, [keywords]);

  const filteredKeywords = useMemo(() => {
    switch (filter) {
      case 'cited':
        return processedKeywords.filter(k => k.brandRank !== null);
      case 'not-cited':
        return processedKeywords.filter(k => k.hasAIOverview && k.brandRank === null);
      case 'no-aio':
        return processedKeywords.filter(k => !k.hasAIOverview);
      default:
        return processedKeywords;
    }
  }, [processedKeywords, filter]);

  const stats = useMemo(() => {
    const total = processedKeywords.length;
    const withAIO = processedKeywords.filter(k => k.hasAIOverview).length;
    const cited = processedKeywords.filter(k => k.brandRank !== null).length;
    const top3 = processedKeywords.filter(k => k.brandRank !== null && k.brandRank <= 3).length;
    const notCited = processedKeywords.filter(k => k.hasAIOverview && k.brandRank === null).length;

    return { total, withAIO, cited, top3, notCited };
  }, [processedKeywords]);

  const displayKeywords = showAll ? filteredKeywords : filteredKeywords.slice(0, 20);

  const filterButtons = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'cited', label: 'Cited', count: stats.cited },
    { key: 'not-cited', label: 'Opportunity', count: stats.notCited },
    { key: 'no-aio', label: 'No AIO', count: stats.total - stats.withAIO }
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5 text-indigo-500" />
              Keyword Performance
            </CardTitle>
            <CardDescription>
              How {brandName} performs across individual keywords
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
              {stats.top3} top 3
            </span>
            <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
              {stats.cited} cited
            </span>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mt-4">
          {filterButtons.map(btn => (
            <button
              key={btn.key}
              onClick={() => setFilter(btn.key as typeof filter)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                filter === btn.key
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {btn.label} ({btn.count})
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {/* Performance Legend */}
        <div className="flex flex-wrap gap-3 mb-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-gray-600">Top 3</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-gray-600">Rank 4-6</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <span className="text-gray-600">Rank 7+</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <span className="text-gray-600">Not Cited</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            <span className="text-gray-600">No AIO</span>
          </div>
        </div>

        {/* Keywords Grid */}
        <div className="space-y-2">
          {displayKeywords.map((kw, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${kw.statusColor}`}>
                  {kw.status === 'top' && <Award className="w-4 h-4" />}
                  {kw.status === 'mid' && kw.statusLabel}
                  {kw.status === 'low' && kw.statusLabel}
                  {kw.status === 'not-cited' && <AlertTriangle className="w-4 h-4" />}
                  {kw.status === 'no-aio' && '-'}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{kw.keyword}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {kw.hasAIOverview ? (
                      <>
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>Has AIO</span>
                        {kw.referenceCount > 0 && (
                          <>
                            <span>•</span>
                            <span>{kw.referenceCount} refs</span>
                          </>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-400">No AI Overview</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {kw.status === 'not-cited' && kw.hasAIOverview && (
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-600 font-medium">
                    Opportunity
                  </span>
                )}
                {kw.status === 'top' && (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-600 font-medium">
                    {kw.statusLabel}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Show More/Less */}
        {filteredKeywords.length > 20 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="mt-4 w-full py-2.5 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show All {filteredKeywords.length} Keywords
              </>
            )}
          </button>
        )}

        {filteredKeywords.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No keywords match this filter</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
