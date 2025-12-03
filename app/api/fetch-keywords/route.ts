import { NextRequest, NextResponse } from 'next/server';
import { fetchKeywordsBatch } from '@/lib/dataforseo';
import { getProject, createSession, saveKeywordResult, updateSessionCounts } from '@/lib/database';
import { getUserId } from '@/lib/auth-utils';

// POST /api/fetch-keywords - Fetch keywords from DataForSEO and save to a new session
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { projectId, keywords, locationCode, languageCode, sessionName } = body;

    // Validation
    if (!projectId || typeof projectId !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      );
    }

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Keywords array is required' },
        { status: 400 }
      );
    }

    if (!locationCode || !languageCode) {
      return NextResponse.json(
        { success: false, error: 'Location code and language code are required' },
        { status: 400 }
      );
    }

    // Check project exists and belongs to user
    const project = await getProject(projectId, userId);
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Create a new session for this fetch
    const session = await createSession(
      projectId,
      sessionName || `Check ${new Date().toLocaleDateString()}`,
      locationCode,
      languageCode
    );

    // Fetch keywords from DataForSEO
    const results = await fetchKeywordsBatch(
      keywords,
      locationCode,
      languageCode
    );

    // Save results to database
    let savedCount = 0;
    let errorCount = 0;
    const errors: { keyword: string; error: string }[] = [];

    for (const { keyword, result, error } of results) {
      if (result) {
        await saveKeywordResult(projectId, session.id, keyword, result as unknown as Record<string, unknown>);
        savedCount++;
      } else {
        errorCount++;
        if (error) {
          errors.push({ keyword, error });
        }
      }
    }

    // Update session counts
    await updateSessionCounts(session.id);

    return NextResponse.json({
      success: true,
      data: {
        projectId,
        sessionId: session.id,
        totalKeywords: keywords.length,
        savedCount,
        errorCount,
        errors: errors.slice(0, 10) // Limit error details
      }
    });
  } catch (error) {
    console.error('Error fetching keywords:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to fetch keywords: ${errorMessage}` },
      { status: 500 }
    );
  }
}
