'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Search, Eye, Users, TrendingUp } from 'lucide-react';

interface SummaryCardsProps {
  totalKeywords: number;
  aiOverviewsFound: number;
  competitorsIdentified: number;
}

export function SummaryCards({
  totalKeywords,
  aiOverviewsFound,
  competitorsIdentified
}: SummaryCardsProps) {
  const aioRate = totalKeywords > 0 ? ((aiOverviewsFound / totalKeywords) * 100).toFixed(1) : '0';

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-blue-100">
              <Search className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Keywords</p>
              <p className="text-2xl font-bold">{totalKeywords}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-green-100">
              <Eye className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">AI Overviews</p>
              <p className="text-2xl font-bold text-green-600">{aiOverviewsFound}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-purple-100">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">AIO Rate</p>
              <p className="text-2xl font-bold text-purple-600">{aioRate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-orange-100">
              <Users className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Competitors</p>
              <p className="text-2xl font-bold text-orange-600">{competitorsIdentified}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
