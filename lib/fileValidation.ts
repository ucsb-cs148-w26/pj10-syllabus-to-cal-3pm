/**
 * Remove unsafe characters and path segments from filenames
 */
export function sanitizeFilename(filename: string): string {
  const justName = filename.split("/").pop() ?? filename;
  return justName.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

/**
 * Allowed file extensions
 */
export const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".doc",
  ".docx",
]);

/**
 * Allowed MIME types
 * Browsers sometimes send empty or inconsistent MIME values,
 * so we treat extension as the primary validator.
 */
export const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
]);

/**
 * Max upload size (20MB default)
 */
export const DEFAULT_MAX_BYTES = 20 * 1024 * 1024;

/**
 * Result type
 */
export type FileValidationResult =
  | { ok: true; safeName: string }
  | { ok: false; error: string };

/**
 * Validate uploaded file
 */
export function validateUploadFile(
  file: File,
  maxBytes: number = DEFAULT_MAX_BYTES
): FileValidationResult {
  if (!file) {
    return { ok: false, error: "No file selected." };
  }

  // Size check
  if (file.size > maxBytes) {
    return {
      ok: false,
      error: `File too large. Max allowed size is ${Math.round(
        maxBytes / 1024 / 1024
      )} MB.`,
    };
  }

  const safeName = sanitizeFilename(file.name);

  // Extension check
  const dotIndex = safeName.lastIndexOf(".");
  const ext = dotIndex >= 0 ? safeName.slice(dotIndex).toLowerCase() : "";

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      ok: false,
      error: `Unsupported file extension: ${ext || "(none)"}`,
    };
  }

  // MIME check (secondary validation)
  if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
    return {
      ok: false,
      error: `Unsupported file type: ${file.type}`,
    };
  }

  return { ok: true, safeName };
}

/**
 * Accept attribute string for <input type="file" />
 */
export const FILE_ACCEPT_ATTR =
  ".pdf,.png,.jpg,.jpeg,.doc,.docx," +
  "application/pdf,image/png,image/jpeg," +
  "application/msword," +
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
