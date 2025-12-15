'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
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
import { TrendingUp, TrendingDown, Minus, Activity, Target, BarChart3, Zap, Search, Sparkles } from 'lucide-react';

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

export function MetricsTrends({ sessionMetrics, brandName }: MetricsTrendsProps) {
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
            Track {brandName ? `${brandName}'s` : 'your brand\'s'} performance in AI Overviews and organic search
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

  const aioRankTrend = latest.avgBrandRank && previous.avgBrandRank
    ? calculateTrend(previous.avgBrandRank, latest.avgBrandRank) // Inverted: lower rank is better
    : null;
  const organicRankTrend = latest.avgOrganicRank && previous.avgOrganicRank
    ? calculateTrend(previous.avgOrganicRank, latest.avgOrganicRank) // Inverted: lower rank is better
    : null;
  const aioCitationTrend = calculateTrend(latest.brandCitations, previous.brandCitations);
  const organicVisibilityTrend = calculateTrend(latest.organicRankings, previous.organicRankings);

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
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string; dataKey: string }>; label?: string }) => {
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
                  {entry.dataKey.includes('Rank') || entry.dataKey.includes('avg')
                    ? entry.value ? `#${entry.value.toFixed(1)}` : '-'
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

  const brandLabel = brandName || 'Your Brand';

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[var(--color-accent-emphasis)] to-[var(--color-purple-fg)] flex items-center justify-center">
          <Activity className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-fg-default)]">{brandLabel} Performance Trends</h2>
          <p className="text-sm text-[var(--color-fg-muted)]">Compare your visibility in AI Overviews vs organic search results</p>
        </div>
      </div>

      {/* Summary Cards - 2x2 Grid: AIO vs Organic comparison */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* AIO Citations Count */}
        <Card className="bg-gradient-to-br from-[var(--color-warning-subtle)] to-[var(--color-canvas-default)] border-[var(--color-warning-muted)]">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--color-warning-fg)] flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  AIO Citations
                </p>
                <p className="text-2xl font-bold text-[var(--color-fg-default)] mt-1">{latest.brandCitations}</p>
                <p className="text-[10px] text-[var(--color-fg-muted)] mt-0.5">of {latest.withAIO} AI Overviews</p>
              </div>
            </div>
            <div className="mt-2">
              <TrendBadge trend={aioCitationTrend} label="vs last" />
            </div>
          </CardContent>
        </Card>

        {/* AIO Avg Rank */}
        <Card className="bg-gradient-to-br from-[var(--color-warning-subtle)] to-[var(--color-canvas-default)] border-[var(--color-warning-muted)]">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--color-warning-fg)] flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  AIO Avg Rank
                </p>
                <p className="text-2xl font-bold text-[var(--color-fg-default)] mt-1">
                  {latest.avgBrandRank ? `#${latest.avgBrandRank.toFixed(1)}` : '-'}
                </p>
                <p className="text-[10px] text-[var(--color-fg-muted)] mt-0.5">{latest.topRanked} in top 3</p>
              </div>
            </div>
            <div className="mt-2">
              {aioRankTrend ? (
                <TrendBadge trend={aioRankTrend} label="vs last" inverted />
              ) : (
                <span className="text-xs text-[var(--color-fg-muted)]">Not cited yet</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Organic Rankings Count */}
        <Card className="bg-gradient-to-br from-[var(--color-accent-subtle)] to-[var(--color-canvas-default)] border-[var(--color-accent-muted)]">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--color-accent-fg)] flex items-center gap-1">
                  <Search className="h-3 w-3" />
                  Organic Rankings
                </p>
                <p className="text-2xl font-bold text-[var(--color-fg-default)] mt-1">{latest.organicRankings}</p>
                <p className="text-[10px] text-[var(--color-fg-muted)] mt-0.5">of {latest.totalKeywords} keywords</p>
              </div>
            </div>
            <div className="mt-2">
              <TrendBadge trend={organicVisibilityTrend} label="vs last" />
            </div>
          </CardContent>
        </Card>

        {/* Organic Avg Rank */}
        <Card className="bg-gradient-to-br from-[var(--color-accent-subtle)] to-[var(--color-canvas-default)] border-[var(--color-accent-muted)]">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--color-accent-fg)] flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  Organic Avg Rank
                </p>
                <p className="text-2xl font-bold text-[var(--color-fg-default)] mt-1">
                  {latest.avgOrganicRank ? `#${latest.avgOrganicRank.toFixed(1)}` : '-'}
                </p>
                <p className="text-[10px] text-[var(--color-fg-muted)] mt-0.5">{latest.topRankedOrganic} in top 3</p>
              </div>
            </div>
            <div className="mt-2">
              {organicRankTrend ? (
                <TrendBadge trend={organicRankTrend} label="vs last" inverted />
              ) : (
                <span className="text-xs text-[var(--color-fg-muted)]">Not ranked yet</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Comparison Chart: AIO vs Organic Rank Over Time */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            {brandLabel}: AIO vs Organic Rank Comparison
          </CardTitle>
          <CardDescription>
            Lower rank is better. Compare where {brandLabel} appears in AI Overview citations vs organic search results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                domain={[1, 20]}
                tickFormatter={(value) => `#${value}`}
                label={{ value: 'Rank (lower is better)', angle: -90, position: 'insideLeft', fontSize: 10, fill: 'hsl(var(--chart-fg-muted))' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                iconSize={10}
                wrapperStyle={{ fontSize: '12px' }}
              />
              <ReferenceLine y={3} stroke="hsl(142 71% 45%)" strokeDasharray="5 5" label={{ value: 'Top 3', position: 'right', fontSize: 10, fill: 'hsl(142 71% 45%)' }} />
              <ReferenceLine y={10} stroke="hsl(220 14% 70%)" strokeDasharray="3 3" label={{ value: 'Top 10', position: 'right', fontSize: 10, fill: 'hsl(220 14% 60%)' }} />
              <Line
                type="monotone"
                dataKey="avgBrandRank"
                name={`${brandLabel} AIO Rank`}
                stroke="hsl(45 93% 47%)"
                strokeWidth={3}
                dot={{ fill: 'hsl(45 93% 47%)', strokeWidth: 0, r: 5 }}
                activeDot={{ r: 8, strokeWidth: 2, stroke: 'white' }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="avgOrganicRank"
                name={`${brandLabel} Organic Rank`}
                stroke="hsl(217 91% 60%)"
                strokeWidth={3}
                dot={{ fill: 'hsl(217 91% 60%)', strokeWidth: 0, r: 5 }}
                activeDot={{ r: 8, strokeWidth: 2, stroke: 'white' }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Secondary Charts: Visibility Counts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AIO Visibility Over Time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--color-warning-fg)]" />
              {brandLabel} in AI Overviews
            </CardTitle>
            <CardDescription>
              How often {brandLabel} is cited in AI Overview results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                  wrapperStyle={{ fontSize: '11px' }}
                />
                <Bar
                  dataKey="withAIO"
                  name="Keywords with AIO"
                  fill="hsl(220 14% 80%)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="brandCitations"
                  name={`${brandLabel} Cited`}
                  fill="hsl(45 93% 47%)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="topRanked"
                  name={`${brandLabel} Top 3`}
                  fill="hsl(142 71% 45%)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Organic Visibility Over Time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4 text-[var(--color-accent-fg)]" />
              {brandLabel} in Organic Search
            </CardTitle>
            <CardDescription>
              How often {brandLabel} appears in top 20 organic results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                  wrapperStyle={{ fontSize: '11px' }}
                />
                <Bar
                  dataKey="totalKeywords"
                  name="Total Keywords"
                  fill="hsl(220 14% 80%)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="organicRankings"
                  name={`${brandLabel} Ranked`}
                  fill="hsl(217 91% 60%)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="topRankedOrganic"
                  name={`${brandLabel} Top 3`}
                  fill="hsl(142 71% 45%)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
