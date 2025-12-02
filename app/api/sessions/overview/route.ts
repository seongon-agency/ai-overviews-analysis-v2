import { NextResponse } from 'next/server';
import {
  getProjectSessions,
  compareTwoSessions,
  getSessionKeywordsBasic,
  getKeywordResultsForSessions
} from '@/lib/database';
import { Reference } from '@/lib/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const brandDomain = searchParams.get('brandDomain') || '';

  if (!projectId) {
    return NextResponse.json({ success: false, error: 'projectId required' }, { status: 400 });
  }

  try {
    const sessions = await getProjectSessions(parseInt(projectId, 10));

    if (sessions.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          hasData: false,
          sessions: [],
          latestSession: null,
          previousSession: null,
          changes: null,
          summary: null
        }
      });
    }

    const latestSession = sessions[0];
    const previousSession = sessions.length > 1 ? sessions[1] : null;

    // Get keywords for latest session with brand rank
    const latestKeywords = await getSessionKeywordsBasic(latestSession.id);

    // Get historical rank data for sparklines (last 5 sessions)
    const recentSessionIds = sessions.slice(0, 5).map(s => s.id);
    const historicalData = new Map<string, { rank: number | null }[]>();

    if (recentSessionIds.length > 1 && brandDomain) {
      const histResults = await getKeywordResultsForSessions(recentSessionIds);

      // Group by keyword and calculate ranks
      histResults.forEach(row => {
        let rank: number | null = null;
        if (row.aio_references) {
          try {
            const refs = JSON.parse(row.aio_references) as Reference[];
            const brandRef = refs.find(r =>
              r.domain?.toLowerCase().includes(brandDomain.toLowerCase())
            );
            if (brandRef) {
              rank = refs.indexOf(brandRef) + 1;
            }
          } catch {}
        }

        if (!historicalData.has(row.keyword)) {
          historicalData.set(row.keyword, []);
        }
        historicalData.get(row.keyword)!.push({ rank });
      });
    }

    // Calculate brand ranks for latest session
    const keywordsWithRank = latestKeywords.map(kw => {
      let brandRank: number | null = null;
      if (kw.has_ai_overview && kw.aio_references && brandDomain) {
        try {
          const refs = JSON.parse(kw.aio_references) as Reference[];
          const brandRef = refs.find(r =>
            r.domain?.toLowerCase().includes(brandDomain.toLowerCase())
          );
          if (brandRef) {
            brandRank = refs.indexOf(brandRef) + 1;
          }
        } catch {}
      }
      return {
        keyword: kw.keyword,
        hasAIO: kw.has_ai_overview === 1,
        brandRank,
        rankHistory: historicalData.get(kw.keyword)?.reverse() || []
      };
    });

    // Calculate overall stats
    const totalKeywords = keywordsWithRank.length;
    const withAIO = keywordsWithRank.filter(k => k.hasAIO).length;
    const withBrandCited = keywordsWithRank.filter(k => k.brandRank !== null).length;
    const topRanked = keywordsWithRank.filter(k => k.brandRank !== null && k.brandRank <= 3).length;
    const avgBrandRank = withBrandCited > 0
      ? keywordsWithRank.filter(k => k.brandRank).reduce((sum, k) => sum + (k.brandRank || 0), 0) / withBrandCited
      : null;

    // Compare with previous session if exists
    let changes = null;
    let changeSummary = null;

    if (previousSession) {
      const comparison = await compareTwoSessions(previousSession.id, latestSession.id, brandDomain);

      const improved = comparison.changes.filter(c => c.changeType === 'rank_improved').length;
      const declined = comparison.changes.filter(c => c.changeType === 'rank_declined').length;
      const aioGained = comparison.changes.filter(c => c.changeType === 'aio_gained').length;
      const aioLost = comparison.changes.filter(c => c.changeType === 'aio_lost').length;
      const newKeywords = comparison.changes.filter(c => c.changeType === 'new').length;
      const removed = comparison.changes.filter(c => c.changeType === 'removed').length;

      changeSummary = {
        improved,
        declined,
        aioGained,
        aioLost,
        newKeywords,
        removed,
        totalChanges: improved + declined + aioGained + aioLost + newKeywords + removed
      };

      // Get top changes (most important ones to show)
      changes = comparison.changes
        .filter(c => c.changeType !== 'no_change')
        .sort((a, b) => {
          // Prioritize rank improvements/declines, then AIO changes
          const priority: Record<string, number> = {
            rank_improved: 1,
            rank_declined: 2,
            aio_gained: 3,
            aio_lost: 4,
            new: 5,
            removed: 6
          };
          return (priority[a.changeType] || 99) - (priority[b.changeType] || 99);
        })
        .slice(0, 10); // Top 10 changes
    }

    return NextResponse.json({
      success: true,
      data: {
        hasData: true,
        sessions: sessions.slice(0, 5), // Last 5 sessions for quick access
        latestSession,
        previousSession,
        keywords: keywordsWithRank,
        stats: {
          totalKeywords,
          withAIO,
          aioRate: totalKeywords > 0 ? (withAIO / totalKeywords) * 100 : 0,
          withBrandCited,
          brandCitationRate: withAIO > 0 ? (withBrandCited / withAIO) * 100 : 0,
          topRanked,
          avgBrandRank
        },
        changes,
        changeSummary
      }
    });
  } catch (error) {
    console.error('Error fetching overview:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch overview'
    }, { status: 500 });
  }
}
