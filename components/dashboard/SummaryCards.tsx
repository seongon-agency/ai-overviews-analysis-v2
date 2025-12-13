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
      gradient: 'from-[var(--color-canvas-subtle)] to-[var(--color-neutral-muted)]',
      iconBg: 'bg-[var(--color-neutral-muted)]',
      iconColor: 'text-[var(--color-fg-muted)]',
      valueColor: 'text-[var(--color-fg-default)]',
      borderColor: 'border-[var(--color-border-default)]'
    },
    {
      label: 'AI Overviews',
      value: aiOverviewsFound,
      subtext: `${aioRate}% coverage`,
      icon: Eye,
      gradient: 'from-[var(--color-success-subtle)] to-[var(--color-success-subtle)]',
      iconBg: 'bg-[var(--color-success-subtle)]',
      iconColor: 'text-[var(--color-success-fg)]',
      valueColor: 'text-[var(--color-success-fg)]',
      borderColor: 'border-[var(--color-success-subtle)]'
    },
    {
      label: brandName ? `${brandName} Citations` : 'Brand Citations',
      value: brandCitations ?? '-',
      subtext: brandCitations !== undefined ? `${brandCitationRate}% of AIOs` : 'configure brand',
      icon: Award,
      gradient: 'from-[var(--color-warning-subtle)] to-[var(--color-warning-subtle)]',
      iconBg: 'bg-[var(--color-warning-subtle)]',
      iconColor: 'text-[var(--color-warning-fg)]',
      valueColor: 'text-[var(--color-warning-fg)]',
      borderColor: 'border-[var(--color-warning-subtle)]',
      highlight: true
    },
    {
      label: 'Sources Found',
      value: competitorsIdentified,
      subtext: 'unique sources',
      icon: Users,
      gradient: 'from-[var(--color-accent-subtle)] to-[var(--color-purple-subtle)]',
      iconBg: 'bg-[var(--color-accent-subtle)]',
      iconColor: 'text-[var(--color-accent-fg)]',
      valueColor: 'text-[var(--color-accent-fg)]',
      borderColor: 'border-[var(--color-accent-subtle)]'
    }
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.label}
            className={`bg-gradient-to-br ${card.gradient} border ${card.borderColor} shadow-[var(--color-shadow-small)] hover:shadow-[var(--color-shadow-medium)] transition-shadow overflow-hidden relative`}
          >
            {card.highlight && (
              <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--color-warning-subtle)]/30 rounded-bl-full" />
            )}
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[var(--color-fg-muted)]">{card.label}</p>
                  <p className={`text-3xl font-bold ${card.valueColor}`}>{card.value}</p>
                  <p className="text-xs text-[var(--color-fg-subtle)]">{card.subtext}</p>
                </div>
                <div className={`p-2.5 rounded-md ${card.iconBg} shadow-[var(--color-shadow-small)]`}>
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
