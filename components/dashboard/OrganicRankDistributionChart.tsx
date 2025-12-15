'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { KeywordRecord } from '@/lib/types';
import { Search, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface OrganicRankDistributionChartProps {
  keywords: KeywordRecord[];
  brandName: string;
  brandDomain: string;
}

export function OrganicRankDistributionChart({ keywords, brandName, brandDomain }: OrganicRankDistributionChartProps) {
  const distributionData = useMemo(() => {
    // Get all keywords with organic results
    const keywordsWithOrganic = keywords.filter(k => k.organicResults && k.organicResults.length > 0);

    if (keywordsWithOrganic.length === 0) return null;

    // Collect all ranks from all domains (industry)
    const industryRanks: number[] = [];
    // Collect brand's ranks
    const brandRanks: number[] = [];

    keywordsWithOrganic.forEach(kw => {
      // Add all organic result ranks as industry distribution
      kw.organicResults?.forEach(result => {
        industryRanks.push(result.rank);
      });

      // Check if brand is ranked in this keyword
      if (kw.organicBrandRank !== null && kw.organicBrandRank !== undefined) {
        brandRanks.push(kw.organicBrandRank);
      }
    });

    if (industryRanks.length === 0) return null;

    // Find the max rank to determine our x-axis range (cap at 20 for organic)
    const maxRank = Math.max(...industryRanks, ...brandRanks);
    const rankRange = Math.min(maxRank, 20);

    // Create distribution buckets (rank 1, 2, 3, etc.)
    const industryDistribution: Record<number, number> = {};
    const brandDistribution: Record<number, number> = {};

    // Initialize buckets
    for (let i = 1; i <= rankRange; i++) {
      industryDistribution[i] = 0;
      brandDistribution[i] = 0;
    }

    // Count industry ranks
    industryRanks.forEach(rank => {
      const bucket = Math.min(rank, rankRange);
      industryDistribution[bucket]++;
    });

    // Count brand ranks
    brandRanks.forEach(rank => {
      const bucket = Math.min(rank, rankRange);
      brandDistribution[bucket]++;
    });

    // Convert to percentages for comparison
    const industryTotal = industryRanks.length;
    const brandTotal = brandRanks.length;

    // Build chart data
    const chartData = [];
    for (let rank = 1; rank <= rankRange; rank++) {
      chartData.push({
        rank: `#${rank}${rank === rankRange && maxRank > rankRange ? '+' : ''}`,
        rankNum: rank,
        industry: industryTotal > 0 ? (industryDistribution[rank] / industryTotal) * 100 : 0,
        brand: brandTotal > 0 ? (brandDistribution[rank] / brandTotal) * 100 : 0,
        industryCount: industryDistribution[rank],
        brandCount: brandDistribution[rank]
      });
    }

    // Calculate statistics
    const industryAvg = industryRanks.length > 0
      ? industryRanks.reduce((a, b) => a + b, 0) / industryRanks.length
      : 0;
    const brandAvg = brandRanks.length > 0
      ? brandRanks.reduce((a, b) => a + b, 0) / brandRanks.length
      : 0;

    // Calculate top 3 and top 10 percentages
    const industryTop3 = industryRanks.filter(r => r <= 3).length;
    const brandTop3 = brandRanks.filter(r => r <= 3).length;
    const industryTop10 = industryRanks.filter(r => r <= 10).length;
    const brandTop10 = brandRanks.filter(r => r <= 10).length;

    return {
      chartData,
      stats: {
        industryAvg,
        brandAvg,
        industryTotal,
        brandTotal,
        industryTop3Pct: industryTotal > 0 ? (industryTop3 / industryTotal) * 100 : 0,
        brandTop3Pct: brandTotal > 0 ? (brandTop3 / brandTotal) * 100 : 0,
        industryTop10Pct: industryTotal > 0 ? (industryTop10 / industryTotal) * 100 : 0,
        brandTop10Pct: brandTotal > 0 ? (brandTop10 / brandTotal) * 100 : 0,
        keywordsRanked: brandRanks.length,
        totalKeywords: keywordsWithOrganic.length,
        rankDiff: brandAvg - industryAvg, // Negative is better (lower rank = better)
        performsAboveAvg: brandAvg < industryAvg
      }
    };
  }, [keywords]);

  if (!distributionData || distributionData.stats.brandTotal === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5 text-[var(--color-accent-fg)]" />
            Organic Rank Distribution
          </CardTitle>
          <CardDescription>
            Compare your brand&apos;s organic ranking to industry average
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-md bg-[var(--color-canvas-subtle)] flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-[var(--color-fg-subtle)]" />
            </div>
            <h3 className="text-[var(--color-fg-default)] font-medium mb-1">No organic ranking data</h3>
            <p className="text-sm text-[var(--color-fg-muted)] max-w-sm">
              Your brand needs to appear in organic search results to show rank distribution
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { chartData, stats } = distributionData;

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; dataKey: string; payload: { industry: number; brand: number; industryCount: number; brandCount: number } }>; label?: string }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[var(--color-canvas-default)] border border-[var(--color-border-default)] rounded-md shadow-[var(--color-shadow-large)] p-4 text-sm">
          <p className="font-semibold text-[var(--color-fg-default)] mb-2">Position {label}</p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-fg-subtle)]" />
                <span className="text-[var(--color-fg-muted)]">All Results</span>
              </div>
              <span className="font-medium text-[var(--color-fg-default)]">
                {data.industry.toFixed(1)}% ({data.industryCount})
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent-fg)]" />
                <span className="text-[var(--color-fg-muted)]">{brandName}</span>
              </div>
              <span className="font-medium text-[var(--color-fg-default)]">
                {data.brand.toFixed(1)}% ({data.brandCount})
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-[var(--color-border-default)] shadow-[var(--color-shadow-small)] overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-[var(--color-canvas-subtle)] to-[var(--color-canvas-subtle)] border-b border-[var(--color-border-muted)]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-gradient-to-br from-[var(--color-accent-fg)] to-[var(--color-accent-emphasis)] flex items-center justify-center shadow-[var(--color-shadow-small)]">
              <Search className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Organic Rank Distribution</CardTitle>
              <CardDescription>
                Your brand&apos;s organic search position vs all results
              </CardDescription>
            </div>
          </div>
          {/* Performance indicator */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shadow-[var(--color-shadow-small)] ${
            stats.performsAboveAvg
              ? 'bg-[var(--color-success-subtle)] text-[var(--color-success-fg)] border border-[var(--color-success-subtle)]'
              : stats.rankDiff === 0
                ? 'bg-[var(--color-neutral-muted)] text-[var(--color-fg-muted)] border border-[var(--color-border-default)]'
                : 'bg-[var(--color-danger-subtle)] text-[var(--color-danger-fg)] border border-[var(--color-danger-subtle)]'
          }`}>
            {stats.performsAboveAvg ? (
              <TrendingUp className="h-4 w-4" />
            ) : stats.rankDiff === 0 ? (
              <Minus className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span>
              {stats.performsAboveAvg
                ? `${Math.abs(stats.rankDiff).toFixed(1)} positions better`
                : stats.rankDiff === 0
                  ? 'At average'
                  : `${Math.abs(stats.rankDiff).toFixed(1)} positions behind`
              }
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-[var(--color-canvas-subtle)] to-[var(--color-neutral-muted)] rounded-md p-4 border border-[var(--color-border-default)]">
            <div className="text-xs text-[var(--color-fg-muted)] uppercase tracking-wide font-medium mb-1">Avg Position</div>
            <div className="text-2xl font-bold text-[var(--color-fg-default)]">#{stats.industryAvg.toFixed(1)}</div>
            <div className="text-xs text-[var(--color-fg-subtle)]">{stats.industryTotal} results</div>
          </div>
          <div className="bg-gradient-to-br from-[var(--color-accent-subtle)] to-[var(--color-accent-subtle)] rounded-md p-4 border border-[var(--color-accent-muted)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-12 h-12 bg-[var(--color-accent-subtle)]/30 rounded-bl-full" />
            <div className="text-xs text-[var(--color-accent-fg)] uppercase tracking-wide font-medium mb-1">Your Avg</div>
            <div className="text-2xl font-bold text-[var(--color-accent-fg)]">#{stats.brandAvg.toFixed(1)}</div>
            <div className="text-xs text-[var(--color-accent-fg)]">{stats.keywordsRanked} of {stats.totalKeywords} keywords</div>
          </div>
          <div className="bg-gradient-to-br from-[var(--color-canvas-subtle)] to-[var(--color-neutral-muted)] rounded-md p-4 border border-[var(--color-border-default)]">
            <div className="text-xs text-[var(--color-fg-muted)] uppercase tracking-wide font-medium mb-1">Your Top 3</div>
            <div className="text-2xl font-bold text-[var(--color-fg-default)]">{stats.brandTop3Pct.toFixed(0)}%</div>
            <div className="text-xs text-[var(--color-fg-subtle)]">of your rankings</div>
          </div>
          <div className="bg-gradient-to-br from-[var(--color-accent-subtle)] to-[var(--color-accent-subtle)] rounded-md p-4 border border-[var(--color-accent-muted)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-12 h-12 bg-[var(--color-accent-subtle)]/30 rounded-bl-full" />
            <div className="text-xs text-[var(--color-accent-fg)] uppercase tracking-wide font-medium mb-1">Your Top 10</div>
            <div className="text-2xl font-bold text-[var(--color-accent-fg)]">{stats.brandTop10Pct.toFixed(0)}%</div>
            <div className="text-xs text-[var(--color-accent-fg)]">of your rankings</div>
          </div>
        </div>

        {/* Distribution Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="organicIndustryGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(220 14% 60%)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(220 14% 60%)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="organicBrandGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-border))" vertical={false} />
            <XAxis
              dataKey="rank"
              tick={{ fontSize: 11, fill: 'hsl(var(--chart-fg-muted))' }}
              axisLine={false}
              tickLine={false}
              interval={1}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(var(--chart-fg-muted))' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Industry distribution (background) */}
            <Area
              type="monotone"
              dataKey="industry"
              name="All Results"
              stroke="hsl(220 14% 50%)"
              strokeWidth={2}
              fill="url(#organicIndustryGradient)"
              dot={false}
            />

            {/* Brand distribution (foreground, highlighted) */}
            <Area
              type="monotone"
              dataKey="brand"
              name={brandName}
              stroke="hsl(217 91% 60%)"
              strokeWidth={3}
              fill="url(#organicBrandGradient)"
              dot={{ fill: 'hsl(217 91% 60%)', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: 'white' }}
            />

            {/* Reference lines for averages */}
            <ReferenceLine
              x={`#${Math.round(stats.industryAvg)}`}
              stroke="hsl(220 14% 50%)"
              strokeDasharray="5 5"
              strokeWidth={1.5}
            />
            <ReferenceLine
              x={`#${Math.round(stats.brandAvg)}`}
              stroke="hsl(217 91% 60%)"
              strokeDasharray="5 5"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-2 rounded-full bg-gradient-to-r from-[var(--color-fg-subtle)] to-[var(--color-fg-muted)]" />
            <span className="text-[var(--color-fg-muted)]">All Organic Results</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-2 rounded-full bg-gradient-to-r from-[var(--color-accent-fg)] to-[var(--color-accent-fg)]" />
            <span className="text-[var(--color-fg-muted)]">{brandName}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
