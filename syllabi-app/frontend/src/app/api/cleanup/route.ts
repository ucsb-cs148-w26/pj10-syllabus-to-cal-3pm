import { NextRequest, NextResponse } from 'next/server';
import { FileStorage } from '../../../../lib/fileStorage';

const storage = new FileStorage();

/**
 * Clean up old files exceeding retentionHours limit
 *
 * Preconditions:
 * - Request must be POST
 * - FILE_RETENTION_HOURS set as environment variable (.env.local)
 * - Upload directory exists
 *
 * Postconditions:
 * - Files older than retentionHours are deleted
 * - Files 'younger' are not modified or deleted
 * - Return count of deleted files
 * - If deletion is successful, return status code = 200
 * - If deletion fails, return status code = 500
 *
 * @param request - Next.js request object
 * @returns NextResponse with cleanup results
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const retentionHours = parseInt(
        process.env.FILE_RETENTION_HOURS || '24'
    );

    const deletedCount = await storage.cleanupOldFiles(retentionHours);

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedCount} old file(s)`,
      deletedCount
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { success: false, error: 'Cleanup failed' },
      { status: 500 }
    );
  }
}