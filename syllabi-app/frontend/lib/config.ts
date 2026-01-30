/**
 * Centralized application configuration
 *
 * Preconditions:
 * - Environment variables should be loaded from .env.local
 *
 * Postconditions:
 * - Provide type-safe access to all configuration values
 * - Use default values if environment variables are not set
 * - All values are parsed to correct types
 */
export const config = {
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE || '10485760') / 1048576,
    maxFiles: parseInt(process.env.MAX_FILES_PER_REQUEST || '10'),
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'application/pdf').split(','),
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
  },

  storage: {
    retentionHours: parseInt(process.env.FILE_RETENTION_HOURS || '24'),
    cleanupSchedule: process.env.CLEANUP_SCHEDULE || '0 2 * * *',
  },

  app: {
    name: 'Syllabus to Calendar',
    version: '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000'),
  },

  api: {
    bodyParserSizeLimit: process.env.API_BODY_SIZE_LIMIT || '10mb',
    timeout: parseInt(process.env.API_TIMEOUT || '30000'),
  }
} as const;

/**
 * Validate configuration on application startup
 *
 * Preconditions:
 * - Config object must be initialized
 *
 * Postconditions:
 * - Log warnings for non-critical issues
 *
 * @throws error if critical config is missing or invalid
 * @returns boolean indicating success or failure
 */
export function validateConfig(): boolean {
  if (!config.upload.maxFileSize || config.upload.maxFileSize <= 0) {
    throw new Error('MAX_FILE_SIZE must be a positive number');
  }

  if (!config.upload.maxFiles || config.upload.maxFiles <= 0) {
    throw new Error('MAX_FILES_PER_REQUEST must be a positive number');
  }

  if (config.upload.allowedTypes.length === 0) {
    throw new Error('ALLOWED_FILE_TYPES must contain at least one type');
  }

  if (!config.upload.uploadDir) {
    throw new Error('UPLOAD_DIR must be specified')
  }

  if (config.storage.retentionHours <= 0) {
    console.warn('FILE_RETENTION_HOURS is set to 0 or negative, files will be deleted immediately');
  }

  return true;
}

/**
 * Get readable configuration summary
 *
 * Preconditions:
 * - Config object must be initialized
 *
 * Postconditions:
 * - Return formatted string with key config values
 * - No sensitive information is exposed
 * - Safe to log or display
 *
 * @returns config summary string
 */
export function getConfigSummary(): string {
  return `
Application Configuration:
- Environment: ${config.app.environment}
- Max File Size: ${config.upload.maxFileSizeMB.toFixed(1)}MB
- Max Files Per Request: ${config.upload.maxFiles}
- Allowed Types: ${config.upload.allowedTypes.join(', ')}
- Upload Directory: ${config.upload.uploadDir}
- File Retention: ${config.storage.retentionHours} hours
  `.trim();
}
