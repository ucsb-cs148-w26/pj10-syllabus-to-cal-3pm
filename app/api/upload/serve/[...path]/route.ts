import { NextRequest, NextResponse } from "next/server";
import { get as getBlob } from "@vercel/blob";
import { resolve } from "path";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { sanitizeFilename } from "@/lib/fileValidation";
import { getRequestUserId, toUserScope } from "@/lib/supabase/requestUser";

export const runtime = "nodejs";

const UPLOADS_DIR = resolve(process.cwd(), "uploads");
const USE_LOCAL = !process.env.BLOB_READ_WRITE_TOKEN;

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const userId = await getRequestUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path: pathSegments } = await params;
  const raw = pathSegments?.join("/");
  if (!raw || pathSegments?.some((p) => p === "..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const filename = sanitizeFilename(raw.split("/").pop() ?? raw);
  if (!filename) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const ownerScope = toUserScope(userId);

  if (USE_LOCAL) {
    const ownerDir = resolve(UPLOADS_DIR, ownerScope);
    const filePath = resolve(ownerDir, filename);
    if (!filePath.startsWith(ownerDir)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    try {
      const buf = await readFile(filePath);
      const ext = filename.split(".").pop()?.toLowerCase() ?? "";
      const ct = CONTENT_TYPE_BY_EXT[ext] ?? "application/octet-stream";
      return new NextResponse(buf, {
        headers: {
          "Content-Type": ct,
          "Cache-Control": "private, max-age=300",
        },
      });
    } catch (err) {
      console.error("Error serving upload:", err);
      return NextResponse.json({ error: "Failed to serve file" }, { status: 500 });
    }
  }

  try {
    const blobPath = `${ownerScope}/${filename}`;
    const blobResult = await getBlob(blobPath, { access: "private" });
    if (!blobResult) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (blobResult.statusCode !== 200 || !blobResult.stream) {
      return NextResponse.json({ error: "Failed to serve file" }, { status: 500 });
    }

    return new NextResponse(blobResult.stream, {
      headers: {
        "Content-Type": blobResult.blob.contentType ?? "application/octet-stream",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err) {
    console.error("Error serving upload from blob:", err);
    return NextResponse.json({ error: "Failed to serve file" }, { status: 500 });
  }
}
