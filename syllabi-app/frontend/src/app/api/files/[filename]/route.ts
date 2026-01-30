import { NextRequest, NextResponse } from 'next/server';
import { FileStorage } from '../../../../../lib/fileStorage';
import { readFile } from 'fs/promises';

const storage = new FileStorage();

/**
 * Retrieve specific file by filename
 *
 * Preconditions:
 * - Request must be GET
 * - filename is a valid filename string
 * - File exists in uploads directory
 *
 * Postconditions:
 * - Return file content as PDF
 * - Set Content-Type to application/pdf
 * - Set Content-Disposition for inline display
 * - If file not found, return status code = 404
 * - No file is modified
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing filename
 * @returns NextResponse with file content or error
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ filename: string }> }): Promise<NextResponse> {
  try {
    const { filename } = await params;
    const filepath = storage.getFilePath(filename);

    const fileBuffer = await readFile(filepath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error retrieving file:', error);
    return NextResponse.json(
      { success: false, error: 'File not found' },
      { status: 404 }
    );
  }
}

/**
 * Delete specific file by filename
 *
 * Preconditions:
 * - Request must be DELETE
 * - filename is a valid filename string
 * - File exists in uploads directory
 *
 * Postconditions:
 * - If file exists, it is permanently deleted
 * - If file is successfully deleted, return status code = 200
 * - If file not found, return status code = 404
 * - If file fails to delete, return status code = 500
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing filename
 * @returns NextResponse with success or error message
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ filename: string }> }): Promise<NextResponse> {
  try {
    const { filename } = await params;
    const deleted = await storage.deleteFile(filename);

    if (deleted) {
      return NextResponse.json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}