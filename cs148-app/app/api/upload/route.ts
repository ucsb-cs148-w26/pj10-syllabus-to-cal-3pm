import { NextRequest, NextResponse } from "next/server";
import { list, put, type Blob } from "@vercel/blob";
import { sanitizeFilename } from "@/lib/fileValidation";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const files = formData.getAll("file") as File[];

  const uploadedFiles: { filename: string; url: string }[] = [];

  for (const file of files) {
    const safeName = sanitizeFilename(file.name);
    const uniqueName = `${Date.now()}-${safeName}`;

    const blob = await put(uniqueName, file, {
      access: "public",
      contentType: file.type,
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

    const files = blobs.map((blob: Blob) => ({
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
      { status: 500 },
    );
  }
}
