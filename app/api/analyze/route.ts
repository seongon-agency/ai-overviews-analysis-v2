import { NextRequest, NextResponse } from 'next/server';
import { getProject, getProjectKeywords, getSessionKeywords } from '@/lib/database';
import { analyzeKeywords, keywordsToCSV, competitorsToCSV } from '@/lib/analysis';

// POST /api/analyze - Run analysis on project keywords
// Can optionally specify sessionId to analyze a specific session instead of latest
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, brandName, brandDomain, sessionId } = body;

    // Validation
    if (!projectId || typeof projectId !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      );
    }

    if (!brandName || typeof brandName !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Brand name is required' },
        { status: 400 }
      );
    }

    if (!brandDomain || typeof brandDomain !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Brand domain is required' },
        { status: 400 }
      );
    }

    // Check project exists
    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get keywords from database - use specific session if provided, otherwise latest
    const keywords = sessionId
      ? await getSessionKeywords(sessionId)
      : await getProjectKeywords(projectId);

    if (keywords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No keywords found in project' },
        { status: 400 }
      );
    }

    // Run analysis
    const result = analyzeKeywords(keywords, brandName, brandDomain);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error analyzing keywords:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to analyze keywords: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// GET /api/analyze?projectId=X&brandName=Y&brandDomain=Z&format=csv&sessionId=Z
// Export analysis as CSV
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = parseInt(searchParams.get('projectId') || '', 10);
    const brandName = searchParams.get('brandName') || '';
    const brandDomain = searchParams.get('brandDomain') || '';
    const format = searchParams.get('format') || 'json';
    const type = searchParams.get('type') || 'keywords'; // 'keywords' or 'competitors'
    const sessionIdParam = searchParams.get('sessionId');
    const sessionId = sessionIdParam ? parseInt(sessionIdParam, 10) : null;

    // Validation
    if (isNaN(projectId)) {
      return NextResponse.json(
        { success: false, error: 'Valid project ID is required' },
        { status: 400 }
      );
    }

    if (!brandName || !brandDomain) {
      return NextResponse.json(
        { success: false, error: 'Brand name and domain are required' },
        { status: 400 }
      );
    }

    // Get project and keywords
    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get keywords - use specific session if provided, otherwise latest
    const keywords = sessionId
      ? await getSessionKeywords(sessionId)
      : await getProjectKeywords(projectId);
    if (keywords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No keywords found in project' },
        { status: 400 }
      );
    }

    // Run analysis
    const result = analyzeKeywords(keywords, brandName, brandDomain);

    // Return CSV if requested
    if (format === 'csv') {
      const csv = type === 'competitors'
        ? competitorsToCSV(result.competitors)
        : keywordsToCSV(result.keywordsAnalysis);

      const filename = type === 'competitors'
        ? `competitors_analysis_${projectId}.csv`
        : `keywords_analysis_${projectId}.csv`;

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    }

    // Return JSON by default
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error exporting analysis:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to export analysis: ${errorMessage}` },
      { status: 500 }
    );
  }
}
