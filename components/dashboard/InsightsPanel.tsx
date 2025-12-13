'use client';

import { useMemo } from 'react';
import { CompetitorMetrics } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Target,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Shield,
  Zap
} from 'lucide-react';

interface InsightsPanelProps {
  competitors: CompetitorMetrics[];
  brandName: string;
  totalAIOs: number;
}

interface Insight {
  type: 'success' | 'warning' | 'opportunity' | 'info';
  title: string;
  description: string;
  metric?: string;
  action?: string;
  priority: number;
}

export function InsightsPanel({ competitors, brandName, totalAIOs }: InsightsPanelProps) {
  const insights = useMemo(() => {
    const results: Insight[] = [];
    const userBrand = competitors.find(c => c.isUserBrand);
    const userRank = competitors.findIndex(c => c.isUserBrand) + 1;
    const topCompetitors = competitors.filter(c => !c.isUserBrand).slice(0, 5);

    if (!userBrand) {
      results.push({
        type: 'warning',
        title: 'Brand not found in citations',
        description: `${brandName} was not found as a cited source in any AI Overview. This could indicate a visibility gap.`,
        action: 'Focus on creating authoritative content for your target keywords',
        priority: 1
      });
      return results;
    }

    // Citation rate analysis
    const citationRate = userBrand.promptCitedRate * 100;
    if (citationRate >= 50) {
      results.push({
        type: 'success',
        title: 'Strong AI Overview presence',
        description: `Your brand is cited in ${citationRate.toFixed(0)}% of AI Overviews - excellent visibility!`,
        metric: `${citationRate.toFixed(0)}% citation rate`,
        priority: 2
      });
    } else if (citationRate >= 25) {
      results.push({
        type: 'info',
        title: 'Moderate AI Overview presence',
        description: `Your brand appears in ${citationRate.toFixed(0)}% of AI Overviews. There's room for improvement.`,
        metric: `${citationRate.toFixed(0)}% citation rate`,
        action: 'Identify keywords where competitors are cited but you are not',
        priority: 3
      });
    } else {
      results.push({
        type: 'warning',
        title: 'Low AI Overview visibility',
        description: `Your brand only appears in ${citationRate.toFixed(0)}% of AI Overviews.`,
        metric: `${citationRate.toFixed(0)}% citation rate`,
        action: 'Prioritize creating comprehensive, authoritative content',
        priority: 1
      });
    }

    // Rank position analysis
    if (userBrand.averageRank > 0) {
      if (userBrand.averageRank <= 2) {
        results.push({
          type: 'success',
          title: 'Top citation positions',
          description: `When cited, you typically appear in position ${userBrand.averageRank.toFixed(1)} - a strong signal of authority.`,
          metric: `Avg rank #${userBrand.averageRank.toFixed(1)}`,
          priority: 2
        });
      } else if (userBrand.averageRank <= 4) {
        results.push({
          type: 'info',
          title: 'Mid-tier citation positions',
          description: `Your average rank is ${userBrand.averageRank.toFixed(1)}. Improving content depth could help you rank higher.`,
          metric: `Avg rank #${userBrand.averageRank.toFixed(1)}`,
          action: 'Add more comprehensive coverage and unique insights to your content',
          priority: 3
        });
      } else {
        results.push({
          type: 'warning',
          title: 'Lower citation positions',
          description: `Your average rank of ${userBrand.averageRank.toFixed(1)} suggests your content may need enhancement.`,
          metric: `Avg rank #${userBrand.averageRank.toFixed(1)}`,
          action: 'Review top-ranked competitor content for inspiration',
          priority: 2
        });
      }
    }

    // Competitive position
    if (userRank === 1) {
      results.push({
        type: 'success',
        title: 'Market leader position',
        description: `You're the #1 most cited source - maintain this position by continuing to produce quality content.`,
        metric: `#1 of ${competitors.length}`,
        priority: 1
      });
    } else if (userRank <= 3) {
      const leader = competitors[0];
      const gap = leader.citedCount - userBrand.citedCount;
      results.push({
        type: 'opportunity',
        title: 'Close to market leader',
        description: `You're #${userRank} overall. Just ${gap} more citations would put you at ${leader.brand}'s level.`,
        metric: `${gap} citations behind #1`,
        action: 'Target keywords where the leader is cited but you are not',
        priority: 2
      });
    } else if (userRank <= 10) {
      results.push({
        type: 'info',
        title: 'Competitive opportunity',
        description: `Ranked #${userRank} among ${competitors.length} sources. Focus on key keywords to climb higher.`,
        metric: `#${userRank} overall`,
        action: 'Analyze top 3 competitors to identify their content strategies',
        priority: 3
      });
    }

    // Competitor analysis
    if (topCompetitors.length > 0) {
      const topCompetitor = topCompetitors[0];
      if (!userBrand.isUserBrand && topCompetitor.citedCount > (userBrand?.citedCount || 0) * 2) {
        results.push({
          type: 'warning',
          title: 'Dominant competitor detected',
          description: `${topCompetitor.brand} has ${topCompetitor.citedCount} citations - significantly ahead of others.`,
          action: 'Study their content format and coverage to understand their advantage',
          priority: 2
        });
      }
    }

    // Mention vs Citation gap
    if (userBrand.mentionedCount > userBrand.citedCount) {
      const gap = userBrand.mentionedCount - userBrand.citedCount;
      results.push({
        type: 'opportunity',
        title: 'Conversion opportunity',
        description: `Your brand is mentioned ${gap} more times than it's cited - mentions could become citations.`,
        metric: `${gap} mentions without citation`,
        action: 'Ensure your content is the authoritative source for these topics',
        priority: 3
      });
    }

    // Sort by priority
    return results.sort((a, b) => a.priority - b.priority);
  }, [competitors, brandName, totalAIOs]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-[var(--color-success-fg)]" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-[var(--color-warning-fg)]" />;
      case 'opportunity':
        return <Sparkles className="h-5 w-5 text-[var(--color-purple-fg)]" />;
      default:
        return <Lightbulb className="h-5 w-5 text-[var(--color-accent-fg)]" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-[var(--color-success-subtle)] border-[var(--color-success-subtle)]';
      case 'warning':
        return 'bg-[var(--color-warning-subtle)] border-[var(--color-warning-subtle)]';
      case 'opportunity':
        return 'bg-[var(--color-purple-subtle)] border-[var(--color-purple-subtle)]';
      default:
        return 'bg-[var(--color-accent-subtle)] border-[var(--color-accent-subtle)]';
    }
  };

  if (insights.length === 0) return null;

  return (
    <Card className="border-[var(--color-border-default)] shadow-[var(--color-shadow-small)] overflow-hidden">
      <CardHeader className="pb-4 bg-gradient-to-r from-[var(--color-accent-subtle)] via-[var(--color-purple-subtle)] to-[var(--color-purple-subtle)] border-b border-[var(--color-border-muted)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-gradient-to-br from-[var(--color-accent-emphasis)] to-[var(--color-purple-emphasis)] flex items-center justify-center shadow-[var(--color-shadow-small)]">
              <Zap className="h-5 w-5 text-[var(--color-canvas-default)]" />
            </div>
            <div>
              <CardTitle className="text-lg">Smart Insights</CardTitle>
              <CardDescription>Actionable recommendations for your brand</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-canvas-default)]/80 border border-[var(--color-border-default)] text-xs font-medium text-[var(--color-fg-muted)]">
            <Sparkles className="h-3.5 w-3.5 text-[var(--color-purple-fg)]" />
            {insights.length} insights
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`rounded-md border p-4 transition-all hover:shadow-[var(--color-shadow-medium)] ${getBgColor(insight.type)}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 p-2 rounded-md bg-[var(--color-canvas-default)]/60 shadow-[var(--color-shadow-small)]">
                  {getIcon(insight.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-[var(--color-fg-default)]">{insight.title}</h4>
                    {insight.metric && (
                      <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[var(--color-canvas-default)] shadow-[var(--color-shadow-small)] text-[var(--color-fg-default)] border border-[var(--color-border-default)]">
                        {insight.metric}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--color-fg-muted)] mt-1.5 leading-relaxed">{insight.description}</p>
                  {insight.action && (
                    <div className="mt-3 flex items-center gap-2 text-sm font-medium text-[var(--color-fg-default)] bg-[var(--color-canvas-default)]/50 rounded-md px-3 py-2 border border-[var(--color-border-default)]/50">
                      <ArrowRight className="h-4 w-4 text-[var(--color-accent-fg)]" />
                      <span>{insight.action}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
