import { NextRequest, NextResponse } from "next/server";
import { list, put, del } from "@vercel/blob";
import { writeFile, readdir, stat, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { sanitizeFilename, validateUploadFile } from "@/lib/fileValidation";

type UploadedFileMeta = { filename: string; url: string };
export const runtime = "nodejs";

const UPLOADS_DIR = join(process.cwd(), "uploads");
const USE_LOCAL = !process.env.BLOB_READ_WRITE_TOKEN;

async function ensureUploadsDir() {
  await mkdir(UPLOADS_DIR, { recursive: true });
}

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
  const origin = request.headers.get("host")
    ? `${request.headers.get("x-forwarded-proto") || "http"}://${request.headers.get("host")}`
    : "http://localhost:3000";

  if (USE_LOCAL) {
    await ensureUploadsDir();
    for (const file of files) {
      const v = validateUploadFile(file);
      if (!v.ok) {
        return NextResponse.json(
          { success: false, error: v.error },
          { status: 400 }
        );
      }
      const uniqueName = `${Date.now()}-${v.safeName}`;
      const filePath = join(UPLOADS_DIR, uniqueName);
      const buf = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buf);
      const url = `${origin}/api/upload/serve/${uniqueName}`;
      uploadedFiles.push({ filename: uniqueName, url });
    }
    const allFiles = await listLocalFiles(origin);
    return NextResponse.json({
      success: true,
      uploadedFiles,
      allFiles,
    });
  }

  for (const file of files) {
    const v = validateUploadFile(file);
    if (!v.ok) {
      return NextResponse.json(
        { success: false, error: v.error },
        { status: 400 }
      );
    }
    const uniqueName = `${Date.now()}-${v.safeName}`;
    const blob = await put(uniqueName, file, {
      access: "public",
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

async function listLocalFiles(origin: string) {
  try {
    await ensureUploadsDir();
    const names = await readdir(UPLOADS_DIR);
    const files: Array<{ filename: string; url: string; size?: number; uploadedAt?: Date }> = [];
    for (const name of names) {
      const p = join(UPLOADS_DIR, name);
      const st = await stat(p);
      if (st.isFile()) {
        files.push({
          filename: name,
          url: `${origin}/api/upload/serve/${name}`,
          size: st.size,
          uploadedAt: st.mtime,
        });
      }
    }
    return files;
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const origin = request.headers.get("host")
      ? `${request.headers.get("x-forwarded-proto") || "http"}://${request.headers.get("host")}`
      : "http://localhost:3000";

    if (USE_LOCAL) {
      const files = await listLocalFiles(origin);
      const totalSize = files.reduce((acc: number, f) => acc + (f.size ?? 0), 0);
      return NextResponse.json({
        success: true,
        files,
        count: files.length,
        totalSize,
        totalSizeMB: (totalSize / 1048576).toFixed(2),
      });
    }

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

    if (USE_LOCAL) {
      const deleteAll = url.searchParams.get("all") === "true";
      if (deleteAll) {
        const limitRaw = url.searchParams.get("limit");
        const limit = limitRaw
          ? Math.max(1, Math.min(1000, Number(limitRaw)))
          : undefined;
        const names = await readdir(UPLOADS_DIR).catch(() => []);
        const targets = limit ? names.slice(0, limit) : names;
        for (const name of targets) {
          const p = join(UPLOADS_DIR, name);
          try {
            await unlink(p);
          } catch { /* ignore */ }
        }
        const remaining = names.length - targets.length;
        return NextResponse.json({
          success: true,
          deleted: targets.length,
          remaining: Math.max(0, remaining),
        });
      }

      const filenameFromQuery = url.searchParams.get("filename") ?? undefined;
      let filenameFromBody: string | undefined;
      if (!filenameFromQuery) {
        const contentType = request.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          const body = (await request.json().catch(() => null)) as { filename?: string } | null;
          filenameFromBody = body?.filename;
        }
      }
      const filenameRaw = filenameFromQuery ?? filenameFromBody;
      if (!filenameRaw) {
        return NextResponse.json({ success: false, error: "Missing filename" }, { status: 400 });
      }
      const filename = sanitizeFilename(filenameRaw);
      const filePath = join(UPLOADS_DIR, filename);
      if (!filePath.startsWith(UPLOADS_DIR)) {
        return NextResponse.json({ success: false, error: "Invalid path" }, { status: 400 });
      }
      await unlink(filePath);
      return NextResponse.json({ success: true, filename });
    }

    // Vercel Blob
    const deleteAll = url.searchParams.get("all") === "true";
    if (deleteAll) {
      const limitRaw = url.searchParams.get("limit");
      const limit = limitRaw ? Math.max(1, Math.min(1000, Number(limitRaw))) : undefined;
      const { blobs } = await list();
      const targets = limit ? blobs.slice(0, limit) : blobs;
      await Promise.all(targets.map((b) => del(b.pathname)));
      return NextResponse.json({
        success: true,
        deleted: targets.length,
        remaining: Math.max(0, blobs.length - targets.length),
      });
    }

    const filenameFromQuery = url.searchParams.get("filename") ?? undefined;
    let filenameFromBody: string | undefined;
    if (!filenameFromQuery) {
      const contentType = request.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const body = (await request.json().catch(() => null)) as { filename?: string } | null;
        filenameFromBody = body?.filename;
      }
    }
    const filenameRaw = filenameFromQuery ?? filenameFromBody;
    if (!filenameRaw) {
      return NextResponse.json({ success: false, error: "Missing filename" }, { status: 400 });
    }
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
