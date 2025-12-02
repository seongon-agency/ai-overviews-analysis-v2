import { NextRequest, NextResponse } from 'next/server';
import db, { getSession, getSessionKeywords, updateSessionName, deleteSession } from '@/lib/db';
import { Reference, KeywordRecord, CheckSession } from '@/lib/types';
import { findBrandInReferences, isBrandMentionedInText } from '@/lib/analysis';

// GET /api/sessions/[id] - Get session details with keywords
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionId = parseInt(id, 10);

  try {
    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    const keywordRows = getSessionKeywords(sessionId);

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
      const prevSession = db.prepare(`
        SELECT * FROM check_sessions
        WHERE project_id = ? AND created_at < ?
        ORDER BY created_at DESC LIMIT 1
      `).get(session.project_id, session.created_at) as CheckSession | undefined;

      if (prevSession) {
        previousSession = prevSession;
        const prevKeywords = getSessionKeywords(prevSession.id);
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
        const recentSessions = db.prepare(`
          SELECT id FROM check_sessions
          WHERE project_id = ?
          ORDER BY created_at ASC
          LIMIT 5
        `).all(session.project_id) as { id: number }[];

        if (recentSessions.length > 1) {
          const sessionIds = recentSessions.map(s => s.id);
          const placeholders = sessionIds.map(() => '?').join(',');

          const histResults = db.prepare(`
            SELECT session_id, keyword, aio_references
            FROM keyword_results
            WHERE session_id IN (${placeholders})
            ORDER BY session_id ASC
          `).all(...sessionIds) as { session_id: number; keyword: string; aio_references: string | null }[];

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
        previousBrandRank
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
  const { id } = await params;
  const sessionId = parseInt(id, 10);

  try {
    const body = await request.json();
    const { name } = body;

    if (name !== undefined) {
      updateSessionName(sessionId, name);
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
  const { id } = await params;
  const sessionId = parseInt(id, 10);

  try {
    deleteSession(sessionId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
