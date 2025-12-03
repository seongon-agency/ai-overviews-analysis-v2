import { NextResponse } from 'next/server';
import { migrateProjectsToUser, getOrphanedProjectsCount } from '@/lib/database';
import { getUserId } from '@/lib/auth-utils';

// POST /api/migrate - Migrate orphaned projects to the current user
export async function POST() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if there are orphaned projects to migrate
    const orphanedCount = await getOrphanedProjectsCount();

    if (orphanedCount === 0) {
      return NextResponse.json({
        success: true,
        data: { migratedCount: 0, message: 'No orphaned projects to migrate' }
      });
    }

    // Migrate all orphaned projects to the current user
    const migratedCount = await migrateProjectsToUser(userId);

    return NextResponse.json({
      success: true,
      data: {
        migratedCount,
        message: `Successfully migrated ${migratedCount} project(s) to your account`
      }
    });
  } catch (error) {
    console.error('Error migrating projects:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to migrate projects' },
      { status: 500 }
    );
  }
}

// GET /api/migrate - Check if there are orphaned projects
export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const orphanedCount = await getOrphanedProjectsCount();

    return NextResponse.json({
      success: true,
      data: { orphanedCount }
    });
  } catch (error) {
    console.error('Error checking orphaned projects:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check orphaned projects' },
      { status: 500 }
    );
  }
}
