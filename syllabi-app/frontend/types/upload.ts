export interface UploadConfig {
  maxFileSize: number;
  maxFilesPerRequest: number;
  allowedTypes: string[];
  uploadDir: string;
  retentionHours: number;
}

export interface UploadedFileInfo {
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  path: string;
  uploadedAt: string;
}

export interface UploadResponse {
  success: boolean;
  files?: UploadedFileInfo[];
  error?: string;
  message?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}