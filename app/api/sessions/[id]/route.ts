import { NextRequest, NextResponse } from 'next/server';
import { getSession, getSessionKeywords, updateSessionName, deleteSession } from '@/lib/db';
import { Reference, KeywordRecord } from '@/lib/types';

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

    // Get brandDomain from query params for rank calculation
    const searchParams = request.nextUrl.searchParams;
    const brandDomain = searchParams.get('brandDomain') || '';

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

      // Find brand rank
      const brandRef = refs.find(r =>
        brandDomain && r.domain.toLowerCase().includes(brandDomain.toLowerCase())
      );

      return {
        id: kw.id,
        keyword: kw.keyword,
        hasAIOverview: kw.has_ai_overview === 1,
        aioMarkdown: kw.aio_markdown,
        references: refs,
        referenceCount: refs.length,
        brandRank: brandRef?.rank || null,
        sessionId: kw.session_id,
        createdAt: kw.created_at
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        session,
        keywords
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
