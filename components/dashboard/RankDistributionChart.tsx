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
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface RankDistributionChartProps {
  keywords: KeywordRecord[];
  brandName: string;
  brandDomain: string;
}

export function RankDistributionChart({ keywords, brandName, brandDomain }: RankDistributionChartProps) {
  const distributionData = useMemo(() => {
    // Get all keywords with AI overviews that have citations
    const aioKeywords = keywords.filter(k => k.hasAIOverview && k.references.length > 0);

    if (aioKeywords.length === 0) return null;

    // Collect all ranks from all brands (industry)
    const industryRanks: number[] = [];
    // Collect brand's ranks
    const brandRanks: number[] = [];

    aioKeywords.forEach(kw => {
      kw.references.forEach(ref => {
        industryRanks.push(ref.rank);
      });

      // Check if brand is cited in this keyword
      if (kw.brandRank !== null) {
        brandRanks.push(kw.brandRank);
      }
    });

    if (industryRanks.length === 0) return null;

    // Find the max rank to determine our x-axis range
    const maxRank = Math.max(...industryRanks, ...brandRanks);
    const rankRange = Math.min(maxRank, 10); // Cap at 10 for readability

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

    // Calculate median
    const sortedIndustry = [...industryRanks].sort((a, b) => a - b);
    const sortedBrand = [...brandRanks].sort((a, b) => a - b);
    const industryMedian = sortedIndustry.length > 0
      ? sortedIndustry[Math.floor(sortedIndustry.length / 2)]
      : 0;
    const brandMedian = sortedBrand.length > 0
      ? sortedBrand[Math.floor(sortedBrand.length / 2)]
      : 0;

    // Calculate top 3 percentage
    const industryTop3 = industryRanks.filter(r => r <= 3).length;
    const brandTop3 = brandRanks.filter(r => r <= 3).length;

    return {
      chartData,
      stats: {
        industryAvg,
        brandAvg,
        industryMedian,
        brandMedian,
        industryTotal,
        brandTotal,
        industryTop3Pct: industryTotal > 0 ? (industryTop3 / industryTotal) * 100 : 0,
        brandTop3Pct: brandTotal > 0 ? (brandTop3 / brandTotal) * 100 : 0,
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
            <BarChart3 className="h-5 w-5 text-indigo-500" />
            Rank Distribution
          </CardTitle>
          <CardDescription>
            Compare your brand&apos;s citation ranking to industry average
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
              <BarChart3 className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-gray-900 font-medium mb-1">No citation data</h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Your brand needs to be cited in AI Overviews to show rank distribution
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
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-sm">
          <p className="font-semibold text-gray-900 mb-2">Position {label}</p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                <span className="text-gray-600">Industry</span>
              </div>
              <span className="font-medium text-gray-900">
                {data.industry.toFixed(1)}% ({data.industryCount})
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-gray-600">{brandName}</span>
              </div>
              <span className="font-medium text-gray-900">
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
    <Card className="border-gray-200/80 shadow-sm overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-sm">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Rank Distribution</CardTitle>
              <CardDescription>
                Your brand&apos;s citation position vs industry average
              </CardDescription>
            </div>
          </div>
          {/* Performance indicator */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm ${
            stats.performsAboveAvg
              ? 'bg-green-100 text-green-700 border border-green-200'
              : stats.rankDiff === 0
                ? 'bg-gray-100 text-gray-600 border border-gray-200'
                : 'bg-red-100 text-red-700 border border-red-200'
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
                  ? 'At industry average'
                  : `${Math.abs(stats.rankDiff).toFixed(1)} positions behind`
              }
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
            <div className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">Industry Avg</div>
            <div className="text-2xl font-bold text-slate-700">#{stats.industryAvg.toFixed(1)}</div>
            <div className="text-xs text-slate-400">{stats.industryTotal} citations</div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-12 h-12 bg-amber-200/30 rounded-bl-full" />
            <div className="text-xs text-amber-600 uppercase tracking-wide font-medium mb-1">Your Avg</div>
            <div className="text-2xl font-bold text-amber-700">#{stats.brandAvg.toFixed(1)}</div>
            <div className="text-xs text-amber-500">{stats.brandTotal} citations</div>
          </div>
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
            <div className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">Industry Top 3</div>
            <div className="text-2xl font-bold text-slate-700">{stats.industryTop3Pct.toFixed(0)}%</div>
            <div className="text-xs text-slate-400">of citations</div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-12 h-12 bg-amber-200/30 rounded-bl-full" />
            <div className="text-xs text-amber-600 uppercase tracking-wide font-medium mb-1">Your Top 3</div>
            <div className="text-2xl font-bold text-amber-700">{stats.brandTop3Pct.toFixed(0)}%</div>
            <div className="text-xs text-amber-500">of citations</div>
          </div>
        </div>

        {/* Distribution Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="industryGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(220 14% 60%)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(220 14% 60%)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="brandGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(45 93% 55%)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(45 93% 55%)" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="rank"
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Industry distribution (background) */}
            <Area
              type="monotone"
              dataKey="industry"
              name="Industry"
              stroke="hsl(220 14% 50%)"
              strokeWidth={2}
              fill="url(#industryGradient)"
              dot={false}
            />

            {/* Brand distribution (foreground, highlighted) */}
            <Area
              type="monotone"
              dataKey="brand"
              name={brandName}
              stroke="hsl(45 93% 47%)"
              strokeWidth={3}
              fill="url(#brandGradient)"
              dot={{ fill: 'hsl(45 93% 47%)', strokeWidth: 0, r: 4 }}
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
              stroke="hsl(45 93% 47%)"
              strokeDasharray="5 5"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-2 rounded-full bg-gradient-to-r from-gray-300 to-gray-400" />
            <span className="text-gray-600">Industry Distribution</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-2 rounded-full bg-gradient-to-r from-amber-300 to-amber-500" />
            <span className="text-gray-600">{brandName}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
