import { NextRequest, NextResponse } from 'next/server';
import { getSessionsForComparison, compareTwoSessions } from '@/lib/database';
import { Reference } from '@/lib/types';

// GET /api/sessions/compare?projectId=1&sessionIds=1,2,3&brandDomain=example.com
// Multi-session comparison - returns matrix view data
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get('projectId');
  const sessionIdsParam = searchParams.get('sessionIds');
  const brandDomain = searchParams.get('brandDomain') || '';

  if (!projectId || !sessionIdsParam) {
    return NextResponse.json(
      { success: false, error: 'projectId and sessionIds are required' },
      { status: 400 }
    );
  }

  const sessionIds = sessionIdsParam.split(',').map(id => parseInt(id.trim(), 10));

  if (sessionIds.length < 2) {
    return NextResponse.json(
      { success: false, error: 'At least 2 sessions are required for comparison' },
      { status: 400 }
    );
  }

  try {
    console.log('Comparing sessions:', { projectId, sessionIds });

    const { sessions, keywords, data } = await getSessionsForComparison(
      parseInt(projectId, 10),
      sessionIds
    );

    console.log('Found:', { sessionsCount: sessions.length, keywordsCount: keywords.length, dataCount: data.length });

    // Build matrix
    const matrix: {
      [keyword: string]: {
        [sessionId: number]: {
          hasAIO: boolean;
          brandRank: number | null;
          referenceCount: number;
        } | null;
      };
    } = {};

    // Initialize matrix with null for all keywords/sessions
    for (const keyword of keywords) {
      matrix[keyword] = {};
      for (const session of sessions) {
        matrix[keyword][session.id] = null;
      }
    }

    // Fill matrix with actual data
    for (const item of data) {
      let brandRank: number | null = null;
      let referenceCount = 0;

      if (item.references && brandDomain) {
        try {
          const refs = JSON.parse(item.references) as Reference[];
          referenceCount = refs.length;
          const brandRef = refs.find(r =>
            r.domain?.toLowerCase().includes(brandDomain.toLowerCase())
          );
          if (brandRef) {
            brandRank = refs.indexOf(brandRef) + 1;
          }
        } catch {
          // Invalid JSON, ignore
        }
      }

      matrix[item.keyword][item.sessionId] = {
        hasAIO: item.hasAIO,
        brandRank,
        referenceCount
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        sessions,
        keywords,
        matrix
      }
    });
  } catch (error) {
    console.error('Error comparing sessions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to compare sessions: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// POST /api/sessions/compare - Compare two sessions with change detection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId1, sessionId2, brandDomain } = body;

    if (!sessionId1 || !sessionId2) {
      return NextResponse.json(
        { success: false, error: 'sessionId1 and sessionId2 are required' },
        { status: 400 }
      );
    }

    const comparison = await compareTwoSessions(sessionId1, sessionId2, brandDomain);

    // Calculate summary
    const summary = {
      newKeywords: comparison.changes.filter(c => c.changeType === 'new').length,
      removedKeywords: comparison.changes.filter(c => c.changeType === 'removed').length,
      aioGained: comparison.changes.filter(c => c.changeType === 'aio_gained').length,
      aioLost: comparison.changes.filter(c => c.changeType === 'aio_lost').length,
      rankImproved: comparison.changes.filter(c => c.changeType === 'rank_improved').length,
      rankDeclined: comparison.changes.filter(c => c.changeType === 'rank_declined').length,
      unchanged: comparison.changes.filter(c => c.changeType === 'no_change').length
    };

    return NextResponse.json({
      success: true,
      data: {
        ...comparison,
        summary
      }
    });
  } catch (error) {
    console.error('Error comparing sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to compare sessions' },
      { status: 500 }
    );
  }
}
