export function sanitizeFilename(filename: string): string {
  // Remove directory paths
  const justName = filename.split("/").pop() ?? filename;
  // Replace unsafe characters
  return justName.replace(/[^a-zA-Z0-9_.-]/g, "_");
}
