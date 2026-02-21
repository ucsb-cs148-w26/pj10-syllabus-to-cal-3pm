import { NextRequest, NextResponse } from "next/server";
import { list, put, del } from "@vercel/blob";
import { sanitizeFilename, validateUploadFile } from "@/lib/fileValidation";

type UploadedFileMeta = { filename: string; url: string };
export const runtime = "nodejs";


export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const files = formData.getAll("file") as File[];

  if (!files || files.length === 0) {
    return NextResponse.json(
      { success: false, error: "No files provided" },
      { status: 400 }
    );
  }

  const uploadedFiles: UploadedFileMeta[] = [];

  for (const file of files) {
    // ✅ Validate file (size + extension + mime)
    const v = validateUploadFile(file);
    if (!v.ok) {
      return NextResponse.json(
        { success: false, error: v.error },
        { status: 400 }
      );
    }

    // ✅ Use safe name from validator
    const uniqueName = `${Date.now()}-${v.safeName}`;

    const blob = await put(uniqueName, file, {
      access: "public",
      // Some browsers may not provide file.type reliably; omit if empty.
      contentType: file.type || undefined,
    });

    uploadedFiles.push({
      filename: blob.pathname,
      url: blob.url,
    });
  }

  const { blobs } = await list();
  const allFiles = blobs.map((b) => ({
    filename: b.pathname,
    url: b.url,
    size: b.size,
    uploadedAt: b.uploadedAt,
  }));

  return NextResponse.json({
    success: true,
    uploadedFiles,
    allFiles,
  });
}

export async function GET(_request: NextRequest) {
  try {
    const { blobs } = await list();

    const files = blobs.map((blob) => ({
      filename: blob.pathname,
      url: blob.url,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
    }));

    const totalSize = files.reduce((acc: number, f) => acc + (f.size ?? 0), 0);

    return NextResponse.json({
      success: true,
      files,
      count: files.length,
      totalSize,
      totalSizeMB: (totalSize / 1048576).toFixed(2),
    });
  } catch (error) {
    console.error("Error listing files:", error);
    return NextResponse.json(
      { success: false, error: "Failed to list files" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);

    // Bulk delete support: DELETE /api/upload?all=true[&limit=123]
    const deleteAll = url.searchParams.get("all") === "true";
    if (deleteAll) {
      const limitRaw = url.searchParams.get("limit");
      const limit = limitRaw
        ? Math.max(1, Math.min(1000, Number(limitRaw)))
        : undefined;

      const { blobs } = await list();
      const targets = limit ? blobs.slice(0, limit) : blobs;

      await Promise.all(targets.map((b) => del(b.pathname)));

      return NextResponse.json({
        success: true,
        deleted: targets.length,
        remaining: Math.max(0, blobs.length - targets.length),
      });
    }

    // Prefer query param (?filename=...), fall back to JSON body
    const filenameFromQuery = url.searchParams.get("filename") ?? undefined;

    let filenameFromBody: string | undefined;
    if (!filenameFromQuery) {
      const contentType = request.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const body = (await request.json().catch(() => null)) as
          | { filename?: string }
          | null;
        filenameFromBody = body?.filename;
      }
    }

    const filenameRaw = filenameFromQuery ?? filenameFromBody;
    if (!filenameRaw) {
      return NextResponse.json(
        { success: false, error: "Missing filename" },
        { status: 400 }
      );
    }

    // Ensure callers can't smuggle paths in
    const filename = sanitizeFilename(filenameRaw);

    await del(filename);

    return NextResponse.json({ success: true, filename });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
