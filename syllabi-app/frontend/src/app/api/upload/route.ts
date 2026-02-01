import { put, list } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { sanitizeFilename } from '@/lib/fileValidation';

export const runtime = 'nodejs';

/**
 * Handle file upload requests -- DOCUMENTATION IS OUT OF DATE
 *
 * Preconditions:
 * - Request must be POST with form-data
 * - FormData contains at least one File object
 * - Files are in PDF format and under size limit
 *
 * Postconditions:
 * - Valid files saved to upload directory
 * - Return UploadResponse that has an array of uploaded file information
 * - Reject invalid files with an associated error message
 * - Validation failures return status code = 400
 * - Server errors return status code = 500
 * - Multiple files can be uploaded in a single request
 *
 * @param request - Next.js request object
 * @returns NextResponse with UploadResponse data
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const files = formData.getAll('file') as File[];

  const uploadedFiles = [];

  for (const file of files) {
    const safeName = sanitizeFilename(file.name);
    const uniqueName = `${Date.now()}-${safeName}`;

    const blob = await put(uniqueName, file, { access: 'public', contentType: file.type });

    uploadedFiles.push({
      filename: blob.pathname,
      url: blob.url,
    });
  }

  const { blobs } = await list();
  const allFiles = blobs.map((b) => ({
    filename: b.pathname,
    url: b.url,
    size: b.size,
    uploadedAt: b.uploadedAt,
  }));

  return NextResponse.json({
    success: true,
    uploadedFiles,
    allFiles,
  });
}

/**
 * List all uploaded files and storage information
 *
 * Preconditions:
 * - Request must be GET
 * - Vercel blob database active
 *
 * Postconditions:
 * - Return list of all filenames in storage, file count, and total storage size in bytes and MB
 * - On success, return status code = 200
 * - On server error, return status code = 500
 * - No file is modified
 *
 * @param request - Next.js request object
 * @returns NextResponse with list of files
 */
export async function GET(request: NextRequest) {
  try {
    const { blobs } = await list();

    const files = blobs.map((blob) => ({
      filename: blob.pathname,   // the pathname you used when uploading
      url: blob.url,             // public or accessible URL
      size: blob.size,           // file size in bytes
      uploadedAt: blob.uploadedAt, // upload timestamp
    }));

    const totalSize = files.reduce((acc, f) => acc + (f.size ?? 0), 0);

    return NextResponse.json({
      success: true,
      files,
      count: files.length,
      totalSize,
      totalSizeMB: (totalSize / 1048576).toFixed(2),
    });
  } catch (error) {
    console.error('Error listing files:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list files' },
      { status: 500 }
    );
  }
}
