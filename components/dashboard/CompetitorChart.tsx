'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { CompetitorMetrics } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface CompetitorChartProps {
  competitors: CompetitorMetrics[];
  brandName: string;
  limit?: number;
}

export function CompetitorChart({ competitors, brandName, limit = 12 }: CompetitorChartProps) {
  // Find user's brand and separate it
  const userBrand = competitors.find(c => c.isUserBrand);
  const otherBrands = competitors.filter(c => !c.isUserBrand);

  // Take top N + ensure user's brand is included
  const topOthers = otherBrands.slice(0, limit - (userBrand ? 1 : 0));
  const chartData = userBrand ? [userBrand, ...topOthers] : topOthers;

  // Reverse for horizontal bar chart (top items at top)
  const reversedData = [...chartData].reverse();

  const isUserBrandEntry = (entry: CompetitorMetrics) => entry.isUserBrand === true;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: CompetitorMetrics }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-semibold text-gray-900">{data.brand}</p>
          <p className="text-blue-600 mt-1">{data.citedCount} citations</p>
          <p className="text-gray-500">Avg rank: {data.averageRank > 0 ? data.averageRank.toFixed(1) : '-'}</p>
          <p className="text-gray-500">Citation rate: {(data.promptCitedRate * 100).toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Top Cited Sources</CardTitle>
        <CardDescription>
          Sources most frequently cited in AI Overviews
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <ResponsiveContainer width="100%" height={Math.max(350, chartData.length * 40)}>
          <BarChart
            data={reversedData}
            layout="vertical"
            margin={{ left: 10, right: 60, top: 10, bottom: 10 }}
            barCategoryGap="20%"
          >
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              type="category"
              dataKey="brand"
              width={130}
              axisLine={false}
              tickLine={false}
              tick={({ x, y, payload }) => {
                const entry = reversedData.find(d => d.brand === payload.value);
                const isUser = entry?.isUserBrand;
                return (
                  <text
                    x={x}
                    y={y}
                    dy={4}
                    textAnchor="end"
                    fill={isUser ? 'hsl(45 93% 35%)' : 'hsl(var(--foreground))'}
                    fontSize={12}
                    fontWeight={isUser ? 600 : 400}
                  >
                    {payload.value.length > 18 ? `${payload.value.slice(0, 18)}...` : payload.value}
                  </text>
                );
              }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
            <Bar
              dataKey="citedCount"
              name="Citations"
              radius={[0, 6, 6, 0]}
              maxBarSize={32}
            >
              {reversedData.map((entry, index) => (
                <Cell
                  key={`cite-${index}`}
                  fill={isUserBrandEntry(entry) ? 'hsl(45 93% 55%)' : 'hsl(217 91% 60%)'}
                />
              ))}
              <LabelList
                dataKey="citedCount"
                position="right"
                fill="hsl(var(--muted-foreground))"
                fontSize={12}
                fontWeight={500}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {userBrand && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-sm bg-amber-400"></div>
            <span className="text-muted-foreground">
              <span className="font-medium text-foreground">{brandName}</span> is ranked #{competitors.findIndex(c => c.isUserBrand) + 1} with {userBrand.citedCount} citations
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
