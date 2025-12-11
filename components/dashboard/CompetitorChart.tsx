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

  // For horizontal bar chart: we want highest at TOP, so reverse for display
  // (Recharts renders from bottom to top in vertical layout)
  const chartData = [...topCompetitors].reverse();

  const isUserBrandEntry = (entry: CompetitorMetrics) => entry.isUserBrand === true;
  const userBrand = competitors.find(c => c.isUserBrand);
  const userBrandRank = sortedCompetitors.findIndex(c => c.isUserBrand) + 1;

  // Custom tooltip with improved styling
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: CompetitorMetrics }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const rank = sortedCompetitors.findIndex(c => c.brand === data.brand) + 1;
      return (
        <div className="bg-white/95 backdrop-blur border border-gray-200 rounded-xl shadow-xl p-4 text-sm min-w-[180px]">
          <div className="flex items-center gap-2 mb-2">
            {rank <= 3 && <Trophy className={`h-4 w-4 ${rank === 1 ? 'text-amber-500' : rank === 2 ? 'text-gray-400' : 'text-amber-700'}`} />}
            <p className="font-semibold text-gray-900">{data.brand}</p>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-500">Rank</span>
              <span className="font-semibold text-gray-900">#{rank}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Citations</span>
              <span className="font-semibold text-indigo-600">{data.citedCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Avg position</span>
              <span className="font-medium text-gray-700">{data.averageRank > 0 ? `#${data.averageRank.toFixed(1)}` : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Citation rate</span>
              <span className="font-medium text-gray-700">{(data.promptCitedRate * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="overflow-hidden border-gray-200/80 shadow-sm">
      <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Top Cited Sources
            </CardTitle>
            <CardDescription className="mt-1">
              Sources most frequently cited in AI Overviews, ranked by total citations
            </CardDescription>
          </div>
          {userBrand && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
              <Medal className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">
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
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
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
                      fill={isUser ? 'hsl(45 93% 40%)' : 'hsl(var(--foreground))'}
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
                      fill={rank <= 3 ? 'hsl(45 93% 45%)' : 'hsl(var(--muted-foreground))'}
                      fontSize={10}
                      fontWeight={rank <= 3 ? 600 : 400}
                    >
                      #{rank}
                    </text>
                  </g>
                );
              }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.1)' }} />
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
                fill="hsl(var(--foreground))"
                fontSize={12}
                fontWeight={600}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-indigo-500"></div>
              <span className="text-gray-500">Competitors</span>
            </div>
            {userBrand && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-amber-400"></div>
                <span className="text-gray-500">Your brand</span>
              </div>
            )}
          </div>
          {userBrand && (
            <span className="text-sm text-gray-500">
              <span className="font-medium text-gray-700">{userBrand.citedCount}</span> citations
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
