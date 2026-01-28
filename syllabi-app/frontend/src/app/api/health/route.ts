import { NextRequest, NextResponse } from "next/server";
import { FileStorage } from "@/lib/fileStorage";

const storage = new FileStorage();

/**
 * Health check endpoint for server status
 *
 * Preconditions:
 * - Request must be GET
 *
 * Postconditions:
 * - Return server status and timestamp
 * - Return storage stats
 * - Return service availability status
 * - If no server error, always return status code = 200
 * - No data is modified
 *
 * @param request - Next.js request object
 * @returns NextResponse with health status information
 */

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const files = await storage.listFiles();
    const totalSize = await storage.getTotalSize();

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        upload:'active',
        storage: 'active',
        cleanup: 'active'
      },
      storage: {
        fileCount: files.length,
        totalSizeBytes: totalSize,
        totalSizeMB: (totalSize / 1048576).toFixed(2)
      },
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      },
      { status: 500 }
    );
  }
}