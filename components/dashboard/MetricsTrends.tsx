'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ReferenceLine
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckSessionWithStats } from '@/lib/types';
import { TrendingUp, TrendingDown, Minus, Activity, Target, BarChart3, Zap, Search } from 'lucide-react';

interface SessionMetrics {
  sessionId: number;
  sessionName: string;
  date: string;
  shortDate: string;
  totalKeywords: number;
  withAIO: number;
  aioRate: number;
  brandCitations: number;
  brandCitationRate: number;
  avgBrandRank: number | null;
  topRanked: number;
  // Organic metrics
  organicRankings: number;
  avgOrganicRank: number | null;
  organicVisibilityRate: number;
  topRankedOrganic: number;
}

interface MetricsTrendsProps {
  sessions: CheckSessionWithStats[];
  sessionMetrics: SessionMetrics[];
  brandName: string;
}

export function MetricsTrends({ sessions, sessionMetrics, brandName }: MetricsTrendsProps) {
  // Need at least 2 sessions for trends
  if (sessionMetrics.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-[var(--color-accent-fg)]" />
            Performance Trends
          </CardTitle>
          <CardDescription>
            Track your brand&apos;s AI Overview performance over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-md bg-[var(--color-canvas-subtle)] flex items-center justify-center mb-4">
              <BarChart3 className="w-8 h-8 text-[var(--color-fg-subtle)]" />
            </div>
            <h3 className="text-[var(--color-fg-default)] font-medium mb-1">Not enough data yet</h3>
            <p className="text-sm text-[var(--color-fg-muted)] max-w-sm">
              Run at least 2 analysis sessions to see performance trends over time
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Reverse to show oldest first (chronological order)
  const chartData = useMemo(() => [...sessionMetrics].reverse(), [sessionMetrics]);

  // Calculate trend indicators
  const calculateTrend = (current: number, previous: number) => {
    const diff = current - previous;
    const percentChange = previous !== 0 ? ((diff / previous) * 100) : 0;
    return {
      direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable',
      value: Math.abs(diff),
      percent: Math.abs(percentChange)
    };
  };

  const latest = chartData[chartData.length - 1];
  const previous = chartData[chartData.length - 2];

  const aioTrend = calculateTrend(latest.aioRate, previous.aioRate);
  const citationTrend = calculateTrend(latest.brandCitationRate, previous.brandCitationRate);
  const rankTrend = latest.avgBrandRank && previous.avgBrandRank
    ? calculateTrend(previous.avgBrandRank, latest.avgBrandRank) // Inverted: lower rank is better
    : null;
  const organicRankTrend = latest.avgOrganicRank && previous.avgOrganicRank
    ? calculateTrend(previous.avgOrganicRank, latest.avgOrganicRank) // Inverted: lower rank is better
    : null;
  const organicVisibilityTrend = calculateTrend(latest.organicVisibilityRate, previous.organicVisibilityRate);

  const TrendIcon = ({ direction }: { direction: string }) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-[var(--color-success-fg)]" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-[var(--color-danger-fg)]" />;
      default:
        return <Minus className="h-4 w-4 text-[var(--color-fg-subtle)]" />;
    }
  };

  const TrendBadge = ({ trend, label, inverted = false }: { trend: ReturnType<typeof calculateTrend>; label: string; inverted?: boolean }) => {
    const isPositive = inverted ? trend.direction === 'down' : trend.direction === 'up';
    const colorClass = trend.direction === 'stable'
      ? 'bg-[var(--color-neutral-muted)] text-[var(--color-fg-muted)]'
      : isPositive
        ? 'bg-[var(--color-success-subtle)] text-[var(--color-success-fg)]'
        : 'bg-[var(--color-danger-subtle)] text-[var(--color-danger-fg)]';

    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        <TrendIcon direction={inverted && trend.direction !== 'stable' ? (trend.direction === 'up' ? 'down' : 'up') : trend.direction} />
        <span>{trend.percent.toFixed(1)}% {label}</span>
      </div>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--color-canvas-default)] border border-[var(--color-border-default)] rounded-md shadow-[var(--color-shadow-large)] p-4 text-sm">
          <p className="font-semibold text-[var(--color-fg-default)] mb-2">{label}</p>
          <div className="space-y-1.5">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-[var(--color-fg-muted)]">{entry.name}</span>
                </div>
                <span className="font-medium text-[var(--color-fg-default)]">
                  {entry.name.includes('Rate') || entry.name.includes('%')
                    ? `${entry.value.toFixed(1)}%`
                    : entry.name.includes('Rank')
                      ? entry.value?.toFixed(1) || '-'
                      : entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Trend Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[var(--color-accent-subtle)] to-[var(--color-accent-subtle)] border-[var(--color-accent-subtle)]">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--color-accent-fg)]">AI Overview Rate</p>
                <p className="text-2xl font-bold text-[var(--color-fg-default)] mt-1">{latest.aioRate.toFixed(1)}%</p>
              </div>
              <div className="h-8 w-8 rounded-md bg-[var(--color-accent-subtle)] flex items-center justify-center">
                <Zap className="h-4 w-4 text-[var(--color-accent-fg)]" />
              </div>
            </div>
            <div className="mt-2">
              <TrendBadge trend={aioTrend} label="vs last" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[var(--color-warning-subtle)] to-[var(--color-warning-subtle)] border-[var(--color-warning-subtle)]">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--color-warning-fg)]">Avg AIO Rank</p>
                <p className="text-2xl font-bold text-[var(--color-fg-default)] mt-1">
                  {latest.avgBrandRank ? `#${latest.avgBrandRank.toFixed(1)}` : '-'}
                </p>
              </div>
              <div className="h-8 w-8 rounded-md bg-[var(--color-warning-subtle)] flex items-center justify-center">
                <Target className="h-4 w-4 text-[var(--color-warning-fg)]" />
              </div>
            </div>
            <div className="mt-2">
              {rankTrend ? (
                <TrendBadge trend={rankTrend} label="vs last" inverted />
              ) : (
                <span className="text-xs text-[var(--color-fg-muted)]">No rank data</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[var(--color-success-subtle)] to-[var(--color-success-subtle)] border-[var(--color-success-subtle)]">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--color-success-fg)]">Organic Visibility</p>
                <p className="text-2xl font-bold text-[var(--color-fg-default)] mt-1">{latest.organicVisibilityRate.toFixed(1)}%</p>
              </div>
              <div className="h-8 w-8 rounded-md bg-[var(--color-success-subtle)] flex items-center justify-center">
                <Search className="h-4 w-4 text-[var(--color-success-fg)]" />
              </div>
            </div>
            <div className="mt-2">
              <TrendBadge trend={organicVisibilityTrend} label="vs last" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[var(--color-purple-subtle)] to-[var(--color-purple-subtle)] border-[var(--color-purple-subtle)]">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--color-purple-fg)]">Avg Organic Rank</p>
                <p className="text-2xl font-bold text-[var(--color-fg-default)] mt-1">
                  {latest.avgOrganicRank ? `#${latest.avgOrganicRank.toFixed(1)}` : '-'}
                </p>
              </div>
              <div className="h-8 w-8 rounded-md bg-[var(--color-purple-subtle)] flex items-center justify-center">
                <Activity className="h-4 w-4 text-[var(--color-purple-fg)]" />
              </div>
            </div>
            <div className="mt-2">
              {organicRankTrend ? (
                <TrendBadge trend={organicRankTrend} label="vs last" inverted />
              ) : (
                <span className="text-xs text-[var(--color-fg-muted)]">No rank data</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AIO Rate & Citation Rate Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Visibility Trends</CardTitle>
            <CardDescription>AI Overview and brand citation rates over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="aioGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="citationGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(280 65% 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(280 65% 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-border))" vertical={false} />
                <XAxis
                  dataKey="shortDate"
                  tick={{ fontSize: 11, fill: 'hsl(var(--chart-fg-muted))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--chart-fg-muted))' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="aioRate"
                  name="AIO Rate %"
                  stroke="hsl(217 91% 60%)"
                  strokeWidth={2}
                  fill="url(#aioGradient)"
                  dot={{ fill: 'hsl(217 91% 60%)', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: 'white' }}
                />
                <Area
                  type="monotone"
                  dataKey="brandCitationRate"
                  name="Citation Rate %"
                  stroke="hsl(280 65% 60%)"
                  strokeWidth={2}
                  fill="url(#citationGradient)"
                  dot={{ fill: 'hsl(280 65% 60%)', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: 'white' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* AIO vs Organic Rank Comparison */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">AIO vs Organic Rank</CardTitle>
            <CardDescription>Compare your ranking in AI Overviews vs organic search</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-border))" vertical={false} />
                <XAxis
                  dataKey="shortDate"
                  tick={{ fontSize: 11, fill: 'hsl(var(--chart-fg-muted))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--chart-fg-muted))' }}
                  axisLine={false}
                  tickLine={false}
                  reversed
                  domain={[1, 10]}
                  tickFormatter={(value) => `#${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <ReferenceLine y={3} stroke="hsl(142 71% 45%)" strokeDasharray="5 5" label={{ value: 'Top 3', position: 'right', fontSize: 10, fill: 'hsl(142 71% 45%)' }} />
                <Line
                  type="monotone"
                  dataKey="avgBrandRank"
                  name="Avg AIO Rank"
                  stroke="hsl(45 93% 47%)"
                  strokeWidth={2.5}
                  dot={{ fill: 'hsl(45 93% 47%)', strokeWidth: 0, r: 5 }}
                  activeDot={{ r: 7, strokeWidth: 2, stroke: 'white' }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="avgOrganicRank"
                  name="Avg Organic Rank"
                  stroke="hsl(280 65% 60%)"
                  strokeWidth={2.5}
                  dot={{ fill: 'hsl(280 65% 60%)', strokeWidth: 0, r: 5 }}
                  activeDot={{ r: 7, strokeWidth: 2, stroke: 'white' }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Organic Ranking Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">AIO Ranking Performance</CardTitle>
            <CardDescription>Average AI Overview rank and top 3 placements</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-border))" vertical={false} />
                <XAxis
                  dataKey="shortDate"
                  tick={{ fontSize: 11, fill: 'hsl(var(--chart-fg-muted))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="rank"
                  orientation="left"
                  tick={{ fontSize: 11, fill: 'hsl(var(--chart-fg-muted))' }}
                  axisLine={false}
                  tickLine={false}
                  reversed
                  domain={[1, 'dataMax']}
                  tickFormatter={(value) => `#${value}`}
                />
                <YAxis
                  yAxisId="count"
                  orientation="right"
                  tick={{ fontSize: 11, fill: 'hsl(var(--chart-fg-muted))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <ReferenceLine yAxisId="rank" y={3} stroke="hsl(45 93% 55%)" strokeDasharray="5 5" />
                <Line
                  yAxisId="rank"
                  type="monotone"
                  dataKey="avgBrandRank"
                  name="Avg AIO Rank"
                  stroke="hsl(45 93% 47%)"
                  strokeWidth={2.5}
                  dot={{ fill: 'hsl(45 93% 47%)', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: 'white' }}
                  connectNulls
                />
                <Line
                  yAxisId="count"
                  type="monotone"
                  dataKey="topRanked"
                  name="Top 3 AIO"
                  stroke="hsl(142 71% 45%)"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(142 71% 45%)', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: 'white' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Organic Ranking Performance</CardTitle>
            <CardDescription>Average organic rank and top 3 placements</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-border))" vertical={false} />
                <XAxis
                  dataKey="shortDate"
                  tick={{ fontSize: 11, fill: 'hsl(var(--chart-fg-muted))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="rank"
                  orientation="left"
                  tick={{ fontSize: 11, fill: 'hsl(var(--chart-fg-muted))' }}
                  axisLine={false}
                  tickLine={false}
                  reversed
                  domain={[1, 10]}
                  tickFormatter={(value) => `#${value}`}
                />
                <YAxis
                  yAxisId="count"
                  orientation="right"
                  tick={{ fontSize: 11, fill: 'hsl(var(--chart-fg-muted))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <ReferenceLine yAxisId="rank" y={3} stroke="hsl(280 65% 60%)" strokeDasharray="5 5" />
                <Line
                  yAxisId="rank"
                  type="monotone"
                  dataKey="avgOrganicRank"
                  name="Avg Organic Rank"
                  stroke="hsl(280 65% 60%)"
                  strokeWidth={2.5}
                  dot={{ fill: 'hsl(280 65% 60%)', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: 'white' }}
                  connectNulls
                />
                <Line
                  yAxisId="count"
                  type="monotone"
                  dataKey="topRankedOrganic"
                  name="Top 3 Organic"
                  stroke="hsl(142 71% 45%)"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(142 71% 45%)', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: 'white' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Volume Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Coverage Overview</CardTitle>
          <CardDescription>Keywords tracked, AI Overviews found, and brand citations per session</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="keywordsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(220 14% 70%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(220 14% 70%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="aioCountGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="brandGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(45 93% 55%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(45 93% 55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-border))" vertical={false} />
              <XAxis
                dataKey="shortDate"
                tick={{ fontSize: 11, fill: 'hsl(var(--chart-fg-muted))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--chart-fg-muted))' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '12px' }}
              />
              <Area
                type="monotone"
                dataKey="totalKeywords"
                name="Keywords"
                stroke="hsl(220 14% 60%)"
                strokeWidth={2}
                fill="url(#keywordsGradient)"
                dot={{ fill: 'hsl(220 14% 60%)', strokeWidth: 0, r: 3 }}
              />
              <Area
                type="monotone"
                dataKey="withAIO"
                name="With AIO"
                stroke="hsl(217 91% 60%)"
                strokeWidth={2}
                fill="url(#aioCountGradient)"
                dot={{ fill: 'hsl(217 91% 60%)', strokeWidth: 0, r: 3 }}
              />
              <Area
                type="monotone"
                dataKey="brandCitations"
                name="Brand Cited"
                stroke="hsl(45 93% 47%)"
                strokeWidth={2}
                fill="url(#brandGradient)"
                dot={{ fill: 'hsl(45 93% 47%)', strokeWidth: 0, r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
