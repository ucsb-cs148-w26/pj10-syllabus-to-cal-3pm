import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { url } = (await req.json()) as { url?: string };
    if (!url) {
      return NextResponse.json({ success: false, error: "Missing url" }, { status: 400 });
    }

    const r = await fetch(url);
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
  } catch (e: any) {
    console.error("DOCX extraction failed:", e);
    return NextResponse.json(
      { success: false, error: e?.message ?? "DOCX extraction failed" },
      { status: 500 }
    );
  }
}
