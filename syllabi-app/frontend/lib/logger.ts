/**
 * Application logging utility
 *
 * Preconditions:
 * - NODE_ENV is set in environment
 *
 * Postconditions:
 * - Provide consistent logging interface across application
 * - Logs include timestamps in development
 * - Different log levels for different severity
 * - Can be extended to use external logging services
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'upload' | 'http';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: unknown;
}

/**
 * Format and output a log entry
 *
 * Preconditions:
 * - level must be valid LogLevel
 * - message must be non-empty string
 *
 * Postconditions:
 * - Log is written to console with appropriate method
 * - Log includes timestamp and formatting
 * - Data is stringified if provided
 * - Does not throw errors
 *
 * @param level - log level
 * @param message - log message
 * @param data - Optional additional data to log
 */
function log(level: LogLevel, message: string, data?: unknown): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    data
  };

  const isDevelopment = process.env.NODE_ENV === 'development';
  const prefix = isDevelopment ? `[${entry.timestamp}] [${level.toUpperCase()}]` : `[${level.toUpperCase()}]`;

  switch (level) {
    case 'error':
      console.error(prefix, message, data ? data : '');
      break;
    case 'warn':
      console.warn(prefix, message, data ? data : '');
      break;
    case 'debug':
      if (isDevelopment) {
        console.debug(prefix, message, data ? data : '');
      }
      break;
    default:
      console.log(prefix, message, data ? data : '');
  }
}

export const logger = {
  /**
   * Log informational messages
   *
   * Preconditions:
   * - Descriptive message
   *
   * Postconditions:
   * - Message logged to console at info level
   *
   * @param message - Information to log
   * @param data - Optional additional context
   */
  info: (message: string, data?: unknown) => {
    log('info', message, data);
  },

  /**
   * Log warning messages
   *
   * Preconditions:
   * - Message describes warning
   *
   * Postconditions:
   * - Warning logged to console
   *
   * @param message - Warning message
   * @param data - Optional additional context
   */
  warn: (message: string, data?: unknown) => {
    log('warn', message, data);
  },

  /**
   * Log error messages
   *
   * Preconditions:
   * - Message describes error
   * - error can be Error object or any data
   *
   * Postconditions:
   * - Error logged to console with stack trace if available
   *
   * @param message - Error description
   * @param error - error object or data
   */
  error: (message: string, error?: unknown) => {
    log('error', message, error);
  },

  /**
   * Log debug messages (only in development)
   *
   * Preconditions:
   * - Only used for detailed debugging info
   *
   * Postconditions:
   * - Message logged only in development environment
   *
   * @param message - Debug message
   * @param data - Optional debug data
   */
  debug: (message: string, data?: unknown) => {
    log('debug', message, data);
  },

  /**
   * Log file upload events
   *
   * Preconditions:
   * - filename and size should be from actual upload
   *
   * Postconditions:
   * - Upload event logged with file details
   *
   * @param filename - Name of uploaded file
   * @param size - File size in bytes
   */
  upload: (filename: string, size: number) => {
    log('upload', `File uploaded: ${filename}`, {
      filename,
      sizeBytes: size,
      sizeMB: (size / 1048576).toFixed(2)
    });
  },

  /**
   * Log HTTP requests
   *
   * Preconditions:
   * - method should be valid HTTP method
   * - path should be request URL path
   *
   * Postconditions:
   * - HTTP request logged with method and path
   *
   * @param method - HTTP method (GET, POST, etc.)
   * @param path - Request path
   * @param statusCode - Optional response status code
   */
  http: (method: string, path: string, statusCode?: number) => {
    log('http', `${method} ${path}`, { statusCode });
  }
};