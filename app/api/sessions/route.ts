import { NextRequest, NextResponse } from 'next/server';
import { getProjectSessions, createSession, getSessionKeywords } from '@/lib/db';
import { Reference, KeywordRecord } from '@/lib/types';

// GET /api/sessions?projectId=1 - Get all sessions for a project
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json(
      { success: false, error: 'projectId is required' },
      { status: 400 }
    );
  }

  try {
    const sessions = getProjectSessions(parseInt(projectId, 10));
    return NextResponse.json({ success: true, data: sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// POST /api/sessions - Create a new session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, name, locationCode, languageCode } = body;

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'projectId is required' },
        { status: 400 }
      );
    }

    const session = createSession(projectId, name, locationCode, languageCode);
    return NextResponse.json({ success: true, data: session });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
