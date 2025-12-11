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
import { TrendingUp, TrendingDown, Minus, Activity, Target, BarChart3, Zap } from 'lucide-react';

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
            <Activity className="h-5 w-5 text-indigo-500" />
            Performance Trends
          </CardTitle>
          <CardDescription>
            Track your brand&apos;s AI Overview performance over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
              <BarChart3 className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-gray-900 font-medium mb-1">Not enough data yet</h3>
            <p className="text-sm text-gray-500 max-w-sm">
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

  const TrendIcon = ({ direction }: { direction: string }) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const TrendBadge = ({ trend, label, inverted = false }: { trend: ReturnType<typeof calculateTrend>; label: string; inverted?: boolean }) => {
    const isPositive = inverted ? trend.direction === 'down' : trend.direction === 'up';
    const colorClass = trend.direction === 'stable'
      ? 'bg-gray-100 text-gray-600'
      : isPositive
        ? 'bg-green-100 text-green-700'
        : 'bg-red-100 text-red-700';

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
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-sm">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <div className="space-y-1.5">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-gray-600">{entry.name}</span>
                </div>
                <span className="font-medium text-gray-900">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">AI Overview Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{latest.aioRate.toFixed(1)}%</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-3">
              <TrendBadge trend={aioTrend} label="vs last" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Brand Citation Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{latest.brandCitationRate.toFixed(1)}%</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-3">
              <TrendBadge trend={citationTrend} label="vs last" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600">Average Rank</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {latest.avgBrandRank ? `#${latest.avgBrandRank.toFixed(1)}` : '-'}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Activity className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <div className="mt-3">
              {rankTrend ? (
                <TrendBadge trend={rankTrend} label="vs last" inverted />
              ) : (
                <span className="text-xs text-gray-500">No rank data</span>
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
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="shortDate"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
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

        {/* Rank & Top 3 Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ranking Performance</CardTitle>
            <CardDescription>Average rank position and top 3 placements</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="shortDate"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="rank"
                  orientation="left"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  reversed
                  domain={[1, 'dataMax']}
                  tickFormatter={(value) => `#${value}`}
                />
                <YAxis
                  yAxisId="count"
                  orientation="right"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
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
                <ReferenceLine yAxisId="rank" y={3} stroke="hsl(45 93% 55%)" strokeDasharray="5 5" label={{ value: 'Top 3', position: 'right', fontSize: 10, fill: 'hsl(45 93% 47%)' }} />
                <Line
                  yAxisId="rank"
                  type="monotone"
                  dataKey="avgBrandRank"
                  name="Avg Rank"
                  stroke="hsl(45 93% 47%)"
                  strokeWidth={2.5}
                  dot={{ fill: 'hsl(45 93% 47%)', strokeWidth: 0, r: 5 }}
                  activeDot={{ r: 7, strokeWidth: 2, stroke: 'white' }}
                  connectNulls
                />
                <Line
                  yAxisId="count"
                  type="monotone"
                  dataKey="topRanked"
                  name="Top 3 Count"
                  stroke="hsl(142 71% 45%)"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(142 71% 45%)', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: 'white' }}
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
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="shortDate"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
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
