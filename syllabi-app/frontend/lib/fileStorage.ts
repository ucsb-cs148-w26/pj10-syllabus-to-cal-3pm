import { writeFile, mkdir, readdir, unlink, stat } from 'fs/promises';
import path from 'path';
import { UploadedFileInfo } from '@/types/upload';

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

export class FileStorage {
  private uploadPath: string;

  constructor() {
    this.uploadPath = path.join(process.cwd(), UPLOAD_DIR);
  }

  /**
   * Initialize storage directory
   *
   * Preconditions:
   * - UPLOAD_DIR set as environment variable (default to 'uploads')
   * - Process has write permissions in current working directory
   *
   * Postconditions:
   * - Upload directory exists at uploadPath
   * - Directory with recursive option is created, if needed
   * - Throw error if creation of directory fails
   *
   * @throws Error if initialization fails
   */
  async init(): Promise<void> {
    try {
      await mkdir(this.uploadPath, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
      throw new Error('Storage initialization failed');
    }
  }

  /**
   * Save uploaded file to storage directory
   *
   * Preconditions:
   * - file is a valid File object
   * - sanitizedFilename is a valid, 'sanitized' string
   * - Storage directory exists
   *
   * Postconditions:
   * - File saved to uploadPath, filename is prefixed with a timestamp
   * - Return UploadedFileInfo for the complete file metadata
   * - Original file is not modified
   * - File is written as binary buffer to disk
   *
   * @param file - file to save
   * @param sanitizedFilename - pre-sanitized filename
   * @returns UploadedFileInfo object with file metadata
   * @throws error if file write fails
   */
  async saveFile(file: File, sanitizedFilename: string): Promise<UploadedFileInfo> {
    await this.init();

    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${sanitizedFilename}`;
    const filepath = path.join(this.uploadPath, uniqueFilename);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await writeFile(filepath, buffer);

    return {
      filename: uniqueFilename,
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
      path: filepath,
      uploadedAt: new Date().toISOString()
    };
  }

  /**
   * Get absolute file path for a filename
   *
   * Preconditions:
   * - filename is non-empty string and valid (no path traversal)
   *
   * Postconditions:
   * - Return absolute path to file in upload directory
   * - No file is modified
   *
   * @param filename - filename to find path for
   * @returns absolute file path string
   */
  getFilePath(filename: string): string {
    return path.join(this.uploadPath, filename);
  }

  /**
   * Delete file from storage
   *
   * Preconditions:
   * - filename is a valid string
   * - File exists in upload directory
   *
   * Postconditions:
   * - If file exists, it is permanently deleted
   * - If deletion is successful, returns true
   * - If file does not exist or fails to delete, return false
   * - Failures are logged to console
   *
   * @param filename - file to delete
   * @returns boolean indicating success or failure
   */
  async deleteFile(filename: string): Promise<boolean> {
    try {
      const filepath = this.getFilePath(filename);
      await unlink(filepath);
      return true;
    } catch (error) {
      console.error('Failed to delete file:', error);
      return false;
    }
  }

  /**
   * List all files in storage directory
   *
   * Preconditions:
   * - Upload directory exists
   *
   * Postconditions:
   * - Return array of filenames
   * - If directory empty or non-existent, return empty array
   * - No file is modified
   * - If failure, error is logged to console
   *
   * @returns array of filename strings
   */
  async listFiles(): Promise<string[]> {
    try {
      await this.init();
      return await readdir(this.uploadPath);
    } catch (error) {
      console.error('Failed to list files:', error);
      return [];
    }
  }

  /**
   * Clean up files older than retention time
   *
   * Preconditions:
   * - retentionHours must be a positive integer
   * - Upload directory exists
   *
   * Postconditions:
   * - All files older than retentionHours are deleted
   * - Return count of successfully deleted files
   * - Log errors for individual files, if any
   * - No file 'younger' than retentionHours is deleted
   *
   * @param retentionHours - maximum 'age' of file (in hours)
   * @returns number of deleted files
   */
  async cleanupOldFiles(retentionHours: number = 24): Promise<number> {
    const files = await this.listFiles();
    const now = Date.now();
    const maxAge = retentionHours * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const file of files) {
      const filepath = this.getFilePath(file);
      try {
        const stats = await stat(filepath);
        const fileAge = now - stats.mtimeMs;

        if (fileAge > maxAge) {
          await this.deleteFile(file);
          deletedCount++;
        }
      } catch (error) {
        console.error(`Failed to process file ${file}:`, error);
      }
    }

    return deletedCount;
  }

  /**
   * Get total size of all stored files
   *
   * Preconditions:
   * - Upload directory exists
   *
   * Postconditions:
   * - If no files exist, return 0
   * - Log errors for individual files, if any
   * - No file is modified
   *
   * @returns total size in bytes
   */
  async getTotalSize(): Promise<number> {
    const files = await this.listFiles();
    let totalSize = 0;

    for (const file of files) {
      try {
        const filepath = this.getFilePath(file);
        const stats = await stat(filepath);
        totalSize += stats.size;
      } catch (error) {
        console.error(`Failed to get size for ${file}:`, error);
      }
    }

    return totalSize;
  }
}