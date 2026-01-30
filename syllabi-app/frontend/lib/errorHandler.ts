import { NextResponse } from 'next/server';

/**
 * Custom application error class
 *
 * Preconditions:
 * - message must be a non-empty string
 * - statusCode must be a valid HTTP status code (100-599)
 *
 * Postconditions:
 * - Creates an Error object with additional HTTP context
 * - Preserves stack trace for debugging
 * - Can be caught and handled by error handlers
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * File upload specific error class
 *
 * Preconditions:
 * - message must describe the file upload error
 * - filename is optional but recommended for clarity
 *
 * Postconditions:
 * - Creates an AppError with 400 status code
 * - Includes filename in error details if provided
 * - Sets error code to 'FILE_UPLOAD_ERROR'
 */
export class FileUploadError extends AppError {
  constructor(message: string, filename?: string) {
    super(message, 400, 'FILE_UPLOAD_ERROR', { filename });
    this.name = 'FileUploadError';
  }
}

/**
 * File validation specific error class
 *
 * Preconditions:
 * - message must describe the validation failure
 * - validationType should indicate what failed (size, type, etc.)
 *
 * Postconditions:
 * - Creates an AppError with 400 status code
 * - Sets error code to 'VALIDATION_ERROR'
 * - Includes validation type in details
 */
export class ValidationError extends AppError {
  constructor(message: string, validationType?: string) {
    super(message, 400, 'VALIDATION_ERROR', { validationType });
    this.name = 'ValidationError';
  }
}

/**
 * Storage specific error class
 *
 * Preconditions:
 * - message must describe the storage operation failure
 * - operation should indicate what was attempted (save, delete, etc.)
 *
 * Postconditions:
 * - Creates an AppError with 500 status code
 * - Sets error code to 'STORAGE_ERROR'
 * - Includes operation type in details
 */
export class StorageError extends AppError {
  constructor(message: string, operation?: string) {
    super(message, 500, 'STORAGE_ERROR', { operation });
    this.name = 'StorageError';
  }
}

/**
 * Handles errors and formats them for API responses
 *
 * Preconditions:
 * - error can be any type (Error, AppError, string, unknown)
 * - includeStack determines if stack trace is included (default: false)
 *
 * Postconditions:
 * - Returns formatted error object suitable for JSON response
 * - AppErrors preserve their status code and details
 * - Unknown errors default to 500 status
 * - Stack traces only included in development or when requested
 * - Logs error to console
 *
 * @param error - The error to handle
 * @param includeStack - Whether to include stack trace in response
 * @returns Formatted error response object
 */
export function handleError(error: unknown, includeStack: boolean = false) {
  console.error('Error occurred:', error);

  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
      ...(includeStack && { stack: error.stack })
    };
  }

  if (error instanceof Error) {
    return {
      error: error.message,
      statusCode: 500,
      ...(includeStack && { stack: error.stack })
    };
  }

  return {
    error: 'An unexpected error occurred',
    statusCode: 500
  };
}

/**
 * Creates a NextResponse from an error
 *
 * Preconditions:
 * - error can be any type
 * - Will use handleError to format the error
 *
 * Postconditions:
 * - Returns NextResponse with appropriate status code
 * - Response body contains formatted error information
 * - Content-Type is application/json
 *
 * @param error - The error to convert to a response
 * @returns NextResponse with error data
 */
export function errorResponse(error: unknown): NextResponse {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorData = handleError(error, isDevelopment);

  const responseBody: {
    success: false;
    error: string;
    code?: string;
    details?: unknown;
    stack?: string;
  } = {
    success: false,
    error: errorData.error,
  };

  if ('details' in errorData && errorData.details) {
    responseBody.details = errorData.details;
  }

  if (isDevelopment && errorData.stack) {
    responseBody.stack = errorData.stack;
  }

  return NextResponse.json(responseBody, { status: errorData.statusCode });
}

/**
 * Wraps an async API handler with error handling
 *
 * Preconditions:
 * - handler must be an async function that returns NextResponse
 *
 * Postconditions:
 * - Returns a new function with automatic error handling
 * - Any errors thrown in handler are caught and formatted
 * - Errors are logged and returned as proper API responses
 * - Does not affect successful responses
 *
 * @param handler - The API handler function to wrap
 * @returns Wrapped handler with error handling
 */
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return errorResponse(error);
    }
  };
}