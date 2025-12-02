'use client';

import { Card } from '@/components/ui/card';
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

  const cards = [
    {
      label: 'Keywords Analyzed',
      value: totalKeywords,
      icon: Search,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      valueColor: 'text-blue-700'
    },
    {
      label: 'AI Overviews Found',
      value: aiOverviewsFound,
      icon: Eye,
      color: 'green',
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      valueColor: 'text-green-700'
    },
    {
      label: 'AIO Coverage',
      value: `${aioRate}%`,
      icon: TrendingUp,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      valueColor: 'text-purple-700'
    },
    {
      label: 'Sources Identified',
      value: competitorsIdentified,
      icon: Users,
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      valueColor: 'text-orange-700'
    }
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} className={`${card.bgColor} border-0 shadow-sm`}>
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${card.valueColor}`}>{card.value}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
