import { NextRequest, NextResponse } from 'next/server';
import { FileStorage } from '../../../../lib/fileStorage';
import { validateFile, sanitizeFilename } from '../../../../lib/fileValidation';
import { UploadResponse, UploadedFileInfo } from '../../../../types/upload';

const storage = new FileStorage();

/**
 * Handle file upload requests
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
export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
  try {
    const formData = await request.formData();
    const uploadedFiles: UploadedFileInfo[] = [];
    const errors: string[] = [];

    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      );
    }

    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) {
        errors.push(`${file.name}: ${validation.error}`);
        continue;
      }

      try {
        const sanitized = sanitizeFilename(file.name);

        const fileInfo = await storage.saveFile(file, sanitized);
        uploadedFiles.push(fileInfo);

      } catch (error) {
        console.error(`Failed to save ${file.name}:`, error);
        errors.push(`${file.name}: Upload failed`);
      }
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No files uploaded successfully',
          message: errors.join(', ')
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
      ...(errors.length > 0 && {
        error: `${errors.length} file(s) failed: ${errors.join(', ')}`
      })
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * List all uploaded files and storage information
 *
 * Preconditions:
 * - Request must be GET
 * - Upload directory exists
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
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const files = await storage.listFiles();
    const totalSize = await storage.getTotalSize();

    return NextResponse.json({
      success: true,
      files: files,
      count: files.length,
      totalSize: totalSize,
      totalSizeMB: (totalSize / 1048576).toFixed(2)
    });
  } catch (error) {
    console.error('Error listing files:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list files' },
      { status: 500 }
    );
  }
}
