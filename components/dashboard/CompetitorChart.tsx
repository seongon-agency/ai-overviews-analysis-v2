'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { CompetitorMetrics } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Medal } from 'lucide-react';

interface CompetitorChartProps {
  competitors: CompetitorMetrics[];
  brandName: string;
  limit?: number;
}

export function CompetitorChart({ competitors, brandName, limit = 12 }: CompetitorChartProps) {
  // Sort by citation count (highest first) - competitors are already sorted from analysis
  const sortedCompetitors = [...competitors].sort((a, b) => b.citedCount - a.citedCount);

  // Take top N competitors
  const topCompetitors = sortedCompetitors.slice(0, limit);

  // For horizontal bar chart with layout="vertical", Recharts renders from top to bottom
  // So we keep the sorted order (highest first) without reversing
  const chartData = topCompetitors;

  const isUserBrandEntry = (entry: CompetitorMetrics) => entry.isUserBrand === true;
  const userBrand = competitors.find(c => c.isUserBrand);
  const userBrandRank = sortedCompetitors.findIndex(c => c.isUserBrand) + 1;

  // Custom tooltip with improved styling
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: CompetitorMetrics }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const rank = sortedCompetitors.findIndex(c => c.brand === data.brand) + 1;
      return (
        <div className="bg-[var(--color-canvas-default)]/95 backdrop-blur border border-[var(--color-border-default)] rounded-md shadow-[var(--color-shadow-large)] p-4 text-sm min-w-[180px]">
          <div className="flex items-center gap-2 mb-2">
            {rank <= 3 && <Trophy className={`h-4 w-4 ${rank === 1 ? 'text-[var(--color-warning-fg)]' : rank === 2 ? 'text-[var(--color-fg-subtle)]' : 'text-[var(--color-warning-fg)]'}`} />}
            <p className="font-semibold text-[var(--color-fg-default)]">{data.brand}</p>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[var(--color-fg-muted)]">Rank</span>
              <span className="font-semibold text-[var(--color-fg-default)]">#{rank}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-fg-muted)]">Citations</span>
              <span className="font-semibold text-[var(--color-accent-fg)]">{data.citedCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-fg-muted)]">Avg position</span>
              <span className="font-medium text-[var(--color-fg-default)]">{data.averageRank > 0 ? `#${data.averageRank.toFixed(1)}` : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-fg-muted)]">Citation rate</span>
              <span className="font-medium text-[var(--color-fg-default)]">{(data.promptCitedRate * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="overflow-hidden border-[var(--color-border-default)] shadow-[var(--color-shadow-small)]">
      <CardHeader className="pb-3 bg-gradient-to-r from-[var(--color-canvas-subtle)] to-[var(--color-canvas-default)] border-b border-[var(--color-border-muted)]">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[var(--color-warning-fg)]" />
              Top Cited Sources
            </CardTitle>
            <CardDescription className="mt-1">
              Sources most frequently cited in AI Overviews, ranked by total citations
            </CardDescription>
          </div>
          {userBrand && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-warning-subtle)] border border-[var(--color-warning-subtle)]">
              <Medal className="h-4 w-4 text-[var(--color-warning-fg)]" />
              <span className="text-sm font-medium text-[var(--color-warning-fg)]">
                Your rank: #{userBrandRank}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ResponsiveContainer width="100%" height={Math.max(380, topCompetitors.length * 42)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 10, right: 65, top: 5, bottom: 5 }}
            barCategoryGap="25%"
          >
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--chart-fg-muted))' }}
            />
            <YAxis
              type="category"
              dataKey="brand"
              width={140}
              axisLine={false}
              tickLine={false}
              tick={({ x, y, payload }) => {
                const entry = chartData.find(d => d.brand === payload.value);
                const isUser = entry?.isUserBrand;
                const rank = sortedCompetitors.findIndex(c => c.brand === payload.value) + 1;
                return (
                  <g>
                    <text
                      x={x - 25}
                      y={y}
                      dy={4}
                      textAnchor="end"
                      fill={isUser ? 'hsl(45 93% 40%)' : 'hsl(var(--chart-fg))'}
                      fontSize={12}
                      fontWeight={isUser ? 600 : 400}
                    >
                      {payload.value.length > 16 ? `${payload.value.slice(0, 16)}...` : payload.value}
                    </text>
                    <text
                      x={x - 5}
                      y={y}
                      dy={4}
                      textAnchor="end"
                      fill={rank <= 3 ? 'hsl(45 93% 45%)' : 'hsl(var(--chart-fg-muted))'}
                      fontSize={10}
                      fontWeight={rank <= 3 ? 600 : 400}
                    >
                      #{rank}
                    </text>
                  </g>
                );
              }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
            <Bar
              dataKey="citedCount"
              name="Citations"
              radius={[0, 8, 8, 0]}
              maxBarSize={28}
            >
              {chartData.map((entry, index) => {
                const rank = sortedCompetitors.findIndex(c => c.brand === entry.brand) + 1;
                let fillColor = 'hsl(217 91% 60%)'; // Default blue

                if (isUserBrandEntry(entry)) {
                  fillColor = 'hsl(45 93% 50%)'; // Amber for user brand
                } else if (rank === 1) {
                  fillColor = 'hsl(217 91% 50%)'; // Darker blue for #1
                } else if (rank === 2) {
                  fillColor = 'hsl(217 91% 58%)';
                } else if (rank === 3) {
                  fillColor = 'hsl(217 91% 65%)';
                } else {
                  // Fade out for lower ranks
                  const opacity = Math.max(0.4, 1 - (rank - 3) * 0.08);
                  fillColor = `hsla(217, 91%, 60%, ${opacity})`;
                }

                return (
                  <Cell
                    key={`cite-${index}`}
                    fill={fillColor}
                  />
                );
              })}
              <LabelList
                dataKey="citedCount"
                position="right"
                fill="hsl(var(--chart-fg))"
                fontSize={12}
                fontWeight={600}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-[var(--color-border-muted)] flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[var(--color-accent-emphasis)]"></div>
              <span className="text-[var(--color-fg-muted)]">Competitors</span>
            </div>
            {userBrand && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-[var(--color-warning-fg)]"></div>
                <span className="text-[var(--color-fg-muted)]">Your brand</span>
              </div>
            )}
          </div>
          {userBrand && (
            <span className="text-sm text-[var(--color-fg-muted)]">
              <span className="font-medium text-[var(--color-fg-default)]">{userBrand.citedCount}</span> citations
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
