import { NextRequest, NextResponse } from 'next/server';
import { createProject, getAllProjects } from '@/lib/database';
import { getUserId } from '@/lib/auth-utils';

// GET /api/projects - List all projects for the authenticated user
export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const projects = await getAllProjects(userId);
    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project for the authenticated user
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
    const { name, brandName, brandDomain, locationCode, languageCode } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Project name is required' },
        { status: 400 }
      );
    }

    const result = await createProject(name, brandName, brandDomain, locationCode, languageCode, userId);

    return NextResponse.json({
      success: true,
      data: { id: result.id, name, brandName, brandDomain, locationCode, languageCode }
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
