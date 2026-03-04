import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { getRequestUserId } from "@/lib/supabase/requestUser";

export const runtime = "nodejs";

function resolveAllowedUploadUrl(request: NextRequest, rawUrl: string): string | null {
  try {
    const absolute = new URL(rawUrl, request.url);
    const requestOrigin = new URL(request.url).origin;
    if (absolute.origin !== requestOrigin) return null;
    if (!absolute.pathname.startsWith("/api/upload/serve/")) return null;
    return absolute.toString();
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getRequestUserId(req);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { url } = (await req.json()) as { url?: string };
    if (!url) {
      return NextResponse.json({ success: false, error: "Missing url" }, { status: 400 });
    }
    const safeUrl = resolveAllowedUploadUrl(req, url);
    if (!safeUrl) {
      return NextResponse.json(
        { success: false, error: "Invalid document URL" },
        { status: 400 }
      );
    }

    const cookie = req.headers.get("cookie");
    const r = await fetch(safeUrl, {
      headers: cookie ? { cookie } : undefined,
      cache: "no-store",
    });
    if (!r.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch docx (HTTP ${r.status})` },
        { status: 400 }
      );
    }

    const arrayBuffer = await r.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer)); // ✅ key change

    const result = await mammoth.extractRawText({ buffer }); // ✅ use { buffer }
    const text = (result.value || "").trim();

    return NextResponse.json({ success: true, text });
  } catch (e: unknown) {
    console.error("DOCX extraction failed:", e);
    const message = e instanceof Error ? e.message : "DOCX extraction failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
