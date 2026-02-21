import { NextRequest, NextResponse } from "next/server";
import { resolve } from "path";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { sanitizeFilename } from "@/lib/fileValidation";

export const runtime = "nodejs";

const UPLOADS_DIR = resolve(process.cwd(), "uploads");

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  const raw = pathSegments?.join("/");
  if (!raw || pathSegments?.some((p) => p === "..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  const filename = sanitizeFilename(raw.split("/").pop() ?? raw);
  if (!filename) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  const filePath = resolve(UPLOADS_DIR, filename);
  if (!filePath.startsWith(UPLOADS_DIR)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const buf = await readFile(filePath);
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    const contentType: Record<string, string> = {
      pdf: "application/pdf",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      txt: "text/plain",
    };
    const ct = contentType[ext] ?? "application/octet-stream";
    return new NextResponse(buf, {
      headers: {
        "Content-Type": ct,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Error serving upload:", err);
    return NextResponse.json({ error: "Failed to serve file" }, { status: 500 });
  }
}
