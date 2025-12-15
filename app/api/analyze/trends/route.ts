import { NextResponse } from 'next/server';
import { getProjectSessions, getSessionKeywords } from '@/lib/database';
import { Reference, SERPItem } from '@/lib/types';

// Helper to extract organic results from raw API response
function extractOrganicBrandRank(rawApiResult: string | null, brandDomain: string): number | null {
  if (!rawApiResult || !brandDomain) return null;

  try {
    const apiResult = JSON.parse(rawApiResult);
    const items: SERPItem[] = apiResult.items || [];

    // Find organic results and look for brand
    const organicItems = items
      .filter(item => item.type === 'organic')
      .sort((a, b) => (a.rank_group || 0) - (b.rank_group || 0));

    const brandIndex = organicItems.findIndex(item =>
      item.domain?.toLowerCase().includes(brandDomain.toLowerCase())
    );

    if (brandIndex !== -1) {
      return organicItems[brandIndex].rank_group || brandIndex + 1;
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const brandDomain = searchParams.get('brandDomain') || '';
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  if (!projectId) {
    return NextResponse.json({ success: false, error: 'projectId required' }, { status: 400 });
  }

  try {
    const sessions = await getProjectSessions(parseInt(projectId, 10));

    if (sessions.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          sessions: [],
          metrics: []
        }
      });
    }

    // Get metrics for each session (limited to most recent N)
    const sessionsToAnalyze = sessions.slice(0, limit);
    const metrics = await Promise.all(
      sessionsToAnalyze.map(async (session) => {
        const keywords = await getSessionKeywords(session.id);

        const totalKeywords = keywords.length;
        const withAIO = keywords.filter(k => k.has_ai_overview === 1).length;
        const aioRate = totalKeywords > 0 ? (withAIO / totalKeywords) * 100 : 0;

        // Calculate brand metrics for AIO citations
        let brandCitations = 0;
        let totalAIORank = 0;
        let topRankedAIO = 0;

        // Calculate organic ranking metrics
        let organicRankings = 0;
        let totalOrganicRank = 0;
        let topRankedOrganic = 0; // Top 3 in organic

        keywords.forEach(kw => {
          // AIO Citations
          if (kw.has_ai_overview && kw.aio_references && brandDomain) {
            try {
              const refs = JSON.parse(kw.aio_references) as Reference[];
              const brandRefIndex = refs.findIndex(r =>
                r.domain?.toLowerCase().includes(brandDomain.toLowerCase())
              );
              if (brandRefIndex !== -1) {
                brandCitations++;
                const rank = brandRefIndex + 1;
                totalAIORank += rank;
                if (rank <= 3) {
                  topRankedAIO++;
                }
              }
            } catch {}
          }

          // Organic Rankings
          if (kw.raw_api_result && brandDomain) {
            const organicRank = extractOrganicBrandRank(kw.raw_api_result, brandDomain);
            if (organicRank !== null) {
              organicRankings++;
              totalOrganicRank += organicRank;
              if (organicRank <= 3) {
                topRankedOrganic++;
              }
            }
          }
        });

        const avgBrandRank = brandCitations > 0 ? totalAIORank / brandCitations : null;
        const brandCitationRate = withAIO > 0 ? (brandCitations / withAIO) * 100 : 0;

        // Organic metrics
        const avgOrganicRank = organicRankings > 0 ? totalOrganicRank / organicRankings : null;
        const organicVisibilityRate = totalKeywords > 0 ? (organicRankings / totalKeywords) * 100 : 0;

        const date = new Date(session.created_at);

        return {
          sessionId: session.id,
          sessionName: session.name || `Session ${session.id}`,
          date: session.created_at,
          shortDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          totalKeywords,
          withAIO,
          aioRate,
          brandCitations,
          brandCitationRate,
          avgBrandRank,
          topRanked: topRankedAIO,
          // Organic metrics
          organicRankings,
          avgOrganicRank,
          organicVisibilityRate,
          topRankedOrganic
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        sessions: sessionsToAnalyze,
        metrics
      }
    });
  } catch (error) {
    console.error('Error fetching trends:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch trends'
    }, { status: 500 });
  }
}
