import { NextResponse } from 'next/server';
import { getProjectSessions, getSessionKeywordsBasic } from '@/lib/database';
import { Reference } from '@/lib/types';

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
        const keywords = await getSessionKeywordsBasic(session.id);

        const totalKeywords = keywords.length;
        const withAIO = keywords.filter(k => k.has_ai_overview === 1).length;
        const aioRate = totalKeywords > 0 ? (withAIO / totalKeywords) * 100 : 0;

        // Calculate brand metrics
        let brandCitations = 0;
        let totalRank = 0;
        let topRanked = 0;

        keywords.forEach(kw => {
          if (kw.has_ai_overview && kw.aio_references && brandDomain) {
            try {
              const refs = JSON.parse(kw.aio_references) as Reference[];
              const brandRefIndex = refs.findIndex(r =>
                r.domain?.toLowerCase().includes(brandDomain.toLowerCase())
              );
              if (brandRefIndex !== -1) {
                brandCitations++;
                const rank = brandRefIndex + 1;
                totalRank += rank;
                if (rank <= 3) {
                  topRanked++;
                }
              }
            } catch {}
          }
        });

        const avgBrandRank = brandCitations > 0 ? totalRank / brandCitations : null;
        const brandCitationRate = withAIO > 0 ? (brandCitations / withAIO) * 100 : 0;

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
          topRanked
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
