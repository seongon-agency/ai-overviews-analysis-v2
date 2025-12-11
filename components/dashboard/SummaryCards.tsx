'use client';

import { Card } from '@/components/ui/card';
import { Search, Eye, Users, TrendingUp, Award } from 'lucide-react';

interface SummaryCardsProps {
  totalKeywords: number;
  aiOverviewsFound: number;
  competitorsIdentified: number;
  brandCitations?: number;
  brandName?: string;
}

export function SummaryCards({
  totalKeywords,
  aiOverviewsFound,
  competitorsIdentified,
  brandCitations,
  brandName
}: SummaryCardsProps) {
  const aioRate = totalKeywords > 0 ? ((aiOverviewsFound / totalKeywords) * 100).toFixed(1) : '0';
  const brandCitationRate = aiOverviewsFound > 0 && brandCitations !== undefined
    ? ((brandCitations / aiOverviewsFound) * 100).toFixed(1)
    : '0';

  const cards = [
    {
      label: 'Keywords Analyzed',
      value: totalKeywords,
      subtext: 'total tracked',
      icon: Search,
      gradient: 'from-slate-50 to-slate-100',
      iconBg: 'bg-slate-200',
      iconColor: 'text-slate-600',
      valueColor: 'text-slate-800',
      borderColor: 'border-slate-200'
    },
    {
      label: 'AI Overviews',
      value: aiOverviewsFound,
      subtext: `${aioRate}% coverage`,
      icon: Eye,
      gradient: 'from-emerald-50 to-teal-50',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      valueColor: 'text-emerald-700',
      borderColor: 'border-emerald-200'
    },
    {
      label: brandName ? `${brandName} Citations` : 'Brand Citations',
      value: brandCitations ?? '-',
      subtext: brandCitations !== undefined ? `${brandCitationRate}% of AIOs` : 'configure brand',
      icon: Award,
      gradient: 'from-amber-50 to-orange-50',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      valueColor: 'text-amber-700',
      borderColor: 'border-amber-200',
      highlight: true
    },
    {
      label: 'Sources Found',
      value: competitorsIdentified,
      subtext: 'unique sources',
      icon: Users,
      gradient: 'from-indigo-50 to-purple-50',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      valueColor: 'text-indigo-700',
      borderColor: 'border-indigo-200'
    }
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.label}
            className={`bg-gradient-to-br ${card.gradient} border ${card.borderColor} shadow-sm hover:shadow-md transition-shadow overflow-hidden relative`}
          >
            {card.highlight && (
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-200/30 rounded-bl-full" />
            )}
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">{card.label}</p>
                  <p className={`text-3xl font-bold ${card.valueColor}`}>{card.value}</p>
                  <p className="text-xs text-gray-400">{card.subtext}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${card.iconBg} shadow-sm`}>
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
