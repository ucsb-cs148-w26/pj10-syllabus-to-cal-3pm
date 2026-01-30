import { ValidationResult } from '@/types/upload';

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760');
const ALLOWED_TYPES = (process.env.ALLOWED_FILE_TYPES || 'application/pdf').split(',');

/**
 * Validate a single file for upload
 *
 * Preconditions:
 * - File must be a valid File object
 * - MAX_FILE_SIZE and ALLOWED_FILE_TYPES set in environment variables (.env.local)
 *
 * Postconditions:
 * - If file passes all conditions, return ValidationResult with valid = true
 * - If file fails validation, return ValidationResult with valid = false and associated error message
 * - Input file is not modified
 *
 * @param file - the file to validate
 * @returns ValidationResult object which indicates success or failure with an associated error message
 */
export function validateFile(file: File): ValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Only ${ALLOWED_TYPES.join(', ')} allowed`
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (MAX_FILE_SIZE / 1048576).toFixed(1);
    return {
      valid: false,
      error: `File size exceeds ${sizeMB}MB limit`
    };
  }

  if (file.name.length > 255) {
    return { valid: false, error: 'Filename too long' };
  }

  return { valid: true };
}


/**
 * Validate multiple files before uploading in a batch
 *
 * Preconditions:
 * - Files are a valid array of File objects
 * - MAX_FILES_PER_REQUEST set in environment variables (.env.local)
 *
 * Postconditions:
 * - If all files validated, return ValidationResult with valid = true
 * - If any file fails validation, return ValidationResult with valid = false and associated error message
 * - Checks if file count does not exceed limit before individual files are validated
 * - No input files in array are modified
 *
 * @param files - array of File objects to validate
 * @returns ValidationResult object for the array
 */

export function validateMultipleFiles(files: File[]): ValidationResult {
  const maxFiles = parseInt(process.env.MAX_FILES_PER_REQUEST || '10');

  if (files.length === 0) {
    return { valid: false, error: 'No files provided' };
  }

  if (files.length > maxFiles) {
    return {
      valid: false,
      error: `Maximum ${maxFiles} files allowed per request`
    };
  }

  for (const file of files) {
    const result = validateFile(file);
    if (!result.valid) {
      return result;
    }
  }

  return { valid: true };
}

/**
 * Sanitize a filename for safe storage
 *
 * Preconditions:
 * - filename must be non-empty string
 *
 * Postconditions:
 * - Return sanitized filename
 * - Remove attempts of path traversal
 * - Replace special characters
 * - Preserve file extension
 * - Limit filename length to 200 characters
 * - Original filename is not modified
 *
 *
 * @param filename - Original file name to sanitize
 * @returns - filename string after sanitizing
 */
export function sanitizeFilename(filename: string): string {
  filename = filename.replace(/\.\./g, '');

  filename = filename.replace(/[^a-zA-Z0-9.-_]/g, '_');

  if (filename.length > 200) {
    const ext = filename.split('.').pop();
    filename = filename.substring(0, 195) + '.' + ext;
  }

  return filename;
}