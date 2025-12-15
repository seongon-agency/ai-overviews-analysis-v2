import { NextRequest, NextResponse } from 'next/server';
import {
  getSession,
  getSessionKeywords,
  updateSessionName,
  deleteSession,
  getPreviousSession,
  getRecentSessionIds,
  getKeywordResultsForSessions,
  verifyProjectOwnership
} from '@/lib/database';
import { Reference, KeywordRecord, CheckSession, OrganicResult, SERPItem } from '@/lib/types';
import { findBrandInReferences, isBrandMentionedInText, brandMatchesDomain } from '@/lib/analysis';
import { getUserId } from '@/lib/auth-utils';

// Helper to extract organic results from raw API response
function extractOrganicResults(rawApiResult: string | null): OrganicResult[] {
  if (!rawApiResult) return [];

  try {
    const apiResult = JSON.parse(rawApiResult);
    const items: SERPItem[] = apiResult.items || [];

    // Filter organic results and map to our format
    const organicItems = items
      .filter(item => item.type === 'organic')
      .map((item, idx) => ({
        rank: item.rank_group || idx + 1,
        domain: item.domain || '',
        title: item.title || '',
        url: item.url || '',
        description: item.description || ''
      }))
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 20); // Top 20 organic results

    return organicItems;
  } catch {
    return [];
  }
}

// Find brand position in organic results
function findBrandInOrganicResults(
  organicResults: OrganicResult[],
  brandDomain: string
): number | null {
  if (!brandDomain || organicResults.length === 0) return null;

  const matchIndex = organicResults.findIndex(result =>
    brandMatchesDomain(brandDomain, result.domain, result.url)
  );

  return matchIndex >= 0 ? organicResults[matchIndex].rank : null;
}

// GET /api/sessions/[id] - Get session details with keywords
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { id } = await params;
  const sessionId = parseInt(id, 10);

  try {
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify user owns the project this session belongs to
    const hasAccess = await verifyProjectOwnership(session.project_id, userId);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    const keywordRows = await getSessionKeywords(sessionId);

    // Get brand info from query params for rank calculation
    const searchParams = request.nextUrl.searchParams;
    const brandDomain = searchParams.get('brandDomain') || '';
    const brandName = searchParams.get('brandName') || '';
    const includeChanges = searchParams.get('includeChanges') === 'true';

    // Get previous session data if requested
    let previousSessionData: Map<string, { hasAIO: boolean; brandRank: number | null }> | null = null;
    let previousSession: CheckSession | null = null;
    let rankHistory: { [keyword: string]: { rank: number | null }[] } = {};

    if (includeChanges) {
      // Find the previous session
      const prevSession = await getPreviousSession(session.project_id, session.created_at);

      if (prevSession) {
        previousSession = prevSession;
        const prevKeywords = await getSessionKeywords(prevSession.id);
        previousSessionData = new Map();

        prevKeywords.forEach(kw => {
          let brandRank: number | null = null;
          if (kw.aio_references && (brandDomain || brandName)) {
            try {
              const refs = JSON.parse(kw.aio_references).map((r: { domain?: string; source?: string; url?: string }, idx: number) => ({
                rank: idx + 1,
                domain: r.domain || '',
                source: r.source || '',
                url: r.url || ''
              }));
              const brandMatch = findBrandInReferences(refs, brandName, brandDomain);
              if (brandMatch) brandRank = brandMatch.rank;
            } catch {}
          }
          previousSessionData!.set(kw.keyword, {
            hasAIO: kw.has_ai_overview === 1,
            brandRank
          });
        });
      }

      // Get rank history for sparklines (last 5 sessions)
      if (brandDomain || brandName) {
        const recentSessionIds = await getRecentSessionIds(session.project_id, 5);

        if (recentSessionIds.length > 1) {
          const histResults = await getKeywordResultsForSessions(recentSessionIds);

          // Group by keyword, ordered by session
          histResults.forEach(row => {
            let rank: number | null = null;
            if (row.aio_references) {
              try {
                const refs = JSON.parse(row.aio_references).map((r: { domain?: string; source?: string; url?: string }, idx: number) => ({
                  rank: idx + 1,
                  domain: r.domain || '',
                  source: r.source || '',
                  url: r.url || ''
                }));
                const brandMatch = findBrandInReferences(refs, brandName, brandDomain);
                if (brandMatch) rank = brandMatch.rank;
              } catch {}
            }

            if (!rankHistory[row.keyword]) {
              rankHistory[row.keyword] = [];
            }
            rankHistory[row.keyword].push({ rank });
          });
        }
      }
    }

    // Convert to KeywordRecords
    const keywords: KeywordRecord[] = keywordRows.map(kw => {
      const refs: Reference[] = kw.aio_references
        ? JSON.parse(kw.aio_references).map((r: { domain?: string; source?: string; url?: string }, idx: number) => ({
            rank: idx + 1,
            domain: r.domain || '',
            source: r.source || '',
            url: r.url || ''
          }))
        : [];

      // Find brand in citations using unified matching
      const brandMatch = findBrandInReferences(refs, brandName, brandDomain);
      const currentBrandRank = brandMatch?.rank || null;

      // Check if brand is mentioned in AIO text content
      const brandMentioned = isBrandMentionedInText(kw.aio_markdown, brandName);

      // Extract organic search results
      const organicResults = extractOrganicResults(kw.raw_api_result);
      const organicBrandRank = findBrandInOrganicResults(organicResults, brandDomain);

      // Calculate change from previous session
      let changeType: string | null = null;
      let previousBrandRank: number | null = null;

      if (previousSessionData) {
        const prev = previousSessionData.get(kw.keyword);
        previousBrandRank = prev?.brandRank || null;
        const currentHasAIO = kw.has_ai_overview === 1;

        if (!prev) {
          changeType = 'new';
        } else if (!prev.hasAIO && currentHasAIO) {
          changeType = 'aio_gained';
        } else if (prev.hasAIO && !currentHasAIO) {
          changeType = 'aio_lost';
        } else if (prev.brandRank !== null && currentBrandRank !== null) {
          if (currentBrandRank < prev.brandRank) changeType = 'rank_improved';
          else if (currentBrandRank > prev.brandRank) changeType = 'rank_declined';
        } else if (prev.brandRank === null && currentBrandRank !== null) {
          changeType = 'rank_improved';
        } else if (prev.brandRank !== null && currentBrandRank === null) {
          changeType = 'rank_declined';
        }
      }

      return {
        id: kw.id,
        keyword: kw.keyword,
        hasAIOverview: kw.has_ai_overview === 1,
        aioMarkdown: kw.aio_markdown,
        references: refs,
        referenceCount: refs.length,
        brandRank: currentBrandRank,
        brandMentioned,
        sessionId: kw.session_id,
        createdAt: kw.created_at,
        // Change tracking fields
        changeType,
        previousBrandRank,
        // Organic search results
        organicResults,
        organicBrandRank
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        session,
        keywords,
        previousSession: previousSession ? {
          id: previousSession.id,
          name: previousSession.name,
          created_at: previousSession.created_at
        } : null,
        rankHistory: Object.keys(rankHistory).length > 0 ? rankHistory : null
      }
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

// PATCH /api/sessions/[id] - Update session (name)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { id } = await params;
  const sessionId = parseInt(id, 10);

  try {
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    const hasAccess = await verifyProjectOwnership(session.project_id, userId);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name } = body;

    if (name !== undefined) {
      await updateSessionName(sessionId, name);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

// DELETE /api/sessions/[id] - Delete session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { id } = await params;
  const sessionId = parseInt(id, 10);

  try {
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    const hasAccess = await verifyProjectOwnership(session.project_id, userId);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    await deleteSession(sessionId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
