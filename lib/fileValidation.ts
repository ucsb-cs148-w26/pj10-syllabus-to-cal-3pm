// lib/fileValidation.ts

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15MB per file (tweak if needed)

export const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".docx",
  ".txt",
]);

// Some browsers lie or omit file.type; we allow empty type but still require extension.
export const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "", // allow empty; we validate via extension
]);

export const FILE_ACCEPT_ATTR =
  ".pdf,.png,.jpg,.jpeg,.docx,.txt,application/pdf,image/png,image/jpeg,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function sanitizeFilename(filename: string): string {
  const justName = filename.split("/").pop() ?? filename;
  return justName.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

function getExt(name: string): string {
  const clean = (name || "").split("?")[0];
  const dot = clean.lastIndexOf(".");
  return dot >= 0 ? clean.slice(dot).toLowerCase() : "";
}

export function validateUploadFile(file: File): { ok: true; safeName: string } | { ok: false; error: string } {
  if (!file) return { ok: false, error: "No file provided." };

  const ext = getExt(file.name);
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return { ok: false, error: `File format not supported: ${ext || "(no extension)"}` };
  }

  // MIME is best-effort; allow empty but block known unsupported when present.
  const mime = (file.type || "").toLowerCase();
  if (mime && !ALLOWED_MIME_TYPES.has(mime)) {
    return { ok: false, error: `File format not supported: ${mime}` };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    const mb = (MAX_UPLOAD_BYTES / 1024 / 1024).toFixed(0);
    return { ok: false, error: `File too large. Max ${mb}MB per file.` };
  }

  const safeName = sanitizeFilename(file.name);
  return { ok: true, safeName };
}
