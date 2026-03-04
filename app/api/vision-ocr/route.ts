import { NextRequest, NextResponse } from "next/server";
import { getRequestUserId } from "@/lib/supabase/requestUser";

export const runtime = "nodejs";

type GeminiOcrPart = { text?: string };
type GeminiOcrCandidate = { content?: { parts?: GeminiOcrPart[] } };
type GeminiOcrResponse = { candidates?: GeminiOcrCandidate[] };

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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }
    const userId = await getRequestUserId(req);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { imageUrl } = (await req.json()) as { imageUrl?: string };
    if (!imageUrl) {
      return NextResponse.json({ success: false, error: "Missing imageUrl" }, { status: 400 });
    }
    const safeImageUrl = resolveAllowedUploadUrl(req, imageUrl);
    if (!safeImageUrl) {
      return NextResponse.json({ success: false, error: "Invalid image URL" }, { status: 400 });
    }

    const cookie = req.headers.get("cookie");
    const imgRes = await fetch(safeImageUrl, {
      headers: cookie ? { cookie } : undefined,
      cache: "no-store",
    });
    if (!imgRes.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch image: ${imgRes.status}` },
        { status: 400 }
      );
    }

    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    const bytes = new Uint8Array(await imgRes.arrayBuffer());
    const b64 = Buffer.from(bytes).toString("base64");

    const prompt =
      "Extract ALL visible text from this image. Return ONLY the extracted text. " +
      "Preserve line breaks when helpful. Do not add commentary.";

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `gemini-2.5-flash:generateContent?key=${apiKey}`;

    const gemRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }, { inlineData: { mimeType: contentType, data: b64 } }],
          },
        ],
        generationConfig: { temperature: 0, maxOutputTokens: 4096 },
      }),
    });

    if (!gemRes.ok) {
      const errText = await gemRes.text();
      return NextResponse.json(
        { success: false, error: `Gemini OCR HTTP ${gemRes.status}: ${errText}` },
        { status: 500 }
      );
    }

    const data = (await gemRes.json()) as GeminiOcrResponse;

    const text =
      (data?.candidates ?? [])
        .flatMap((c: GeminiOcrCandidate) => c?.content?.parts ?? [])
        .map((p: GeminiOcrPart) => (typeof p?.text === "string" ? p.text : ""))
        .join("")
        .trim();

    return NextResponse.json({ success: true, text });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "vision-ocr failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
