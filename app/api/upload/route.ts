import { NextRequest, NextResponse } from 'next/server';
import { getProject, createSession, saveKeywordResult, updateSessionCounts } from '@/lib/db';

// POST /api/upload - Upload JSON file and save to a new session
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const projectIdStr = formData.get('projectId');
    const file = formData.get('file');
    const sessionName = formData.get('sessionName')?.toString();

    // Validation
    if (!projectIdStr) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const projectId = parseInt(projectIdStr.toString(), 10);
    if (isNaN(projectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'JSON file is required' },
        { status: 400 }
      );
    }

    // Check project exists
    const project = getProject(projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Parse JSON file
    const fileContent = await file.text();
    let data: Record<string, unknown>;

    try {
      data = JSON.parse(fileContent);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON file' },
        { status: 400 }
      );
    }

    // Create a new session for this upload
    const session = createSession(
      projectId,
      sessionName || `Upload ${new Date().toLocaleDateString()} (${file.name})`
    );

    // Handle different JSON formats
    let savedCount = 0;

    // Format 1: Direct array of results
    if (Array.isArray(data)) {
      for (const item of data) {
        if (item && typeof item === 'object') {
          const keyword = (item as Record<string, unknown>).keyword as string || `keyword_${savedCount + 1}`;
          saveKeywordResult(projectId, session.id, keyword, item as Record<string, unknown>);
          savedCount++;
        }
      }
    }
    // Format 2: Object with numeric keys (pandas DataFrame JSON format)
    else if (typeof data === 'object' && data !== null) {
      // Check if it's pandas format: { "0": { "0": {...} }, "1": {...} }
      const keys = Object.keys(data);
      const isPandasFormat = keys.every(k => !isNaN(parseInt(k, 10)));

      if (isPandasFormat) {
        // This is the format from the existing api-result.json
        // Structure: { "0": { "0": { keyword, items, ... } } }
        for (const outerKey of keys) {
          const outerValue = (data as Record<string, unknown>)[outerKey];
          if (typeof outerValue === 'object' && outerValue !== null) {
            // Check for nested structure
            const innerKeys = Object.keys(outerValue as Record<string, unknown>);
            if (innerKeys.length === 1 && innerKeys[0] === '0') {
              // Nested pandas format: { "0": { "0": result } }
              const result = (outerValue as Record<string, unknown>)['0'] as Record<string, unknown>;
              const keyword = result.keyword as string || `keyword_${savedCount + 1}`;
              saveKeywordResult(projectId, session.id, keyword, result);
              savedCount++;
            } else {
              // Direct result
              const result = outerValue as Record<string, unknown>;
              const keyword = result.keyword as string || `keyword_${savedCount + 1}`;
              saveKeywordResult(projectId, session.id, keyword, result);
              savedCount++;
            }
          }
        }
      } else {
        // Single result object
        const keyword = data.keyword as string || 'keyword_1';
        saveKeywordResult(projectId, session.id, keyword, data);
        savedCount = 1;
      }
    }

    // Update session counts
    updateSessionCounts(session.id);

    if (savedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid keyword data found in JSON file' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        projectId,
        sessionId: session.id,
        savedCount
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to upload file: ${errorMessage}` },
      { status: 500 }
    );
  }
}
