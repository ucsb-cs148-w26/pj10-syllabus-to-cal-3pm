import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    const { imageUrl } = (await req.json()) as { imageUrl?: string };
    if (!imageUrl) {
      return NextResponse.json({ success: false, error: "Missing imageUrl" }, { status: 400 });
    }

    const imgRes = await fetch(imageUrl);
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

    const data: any = await gemRes.json();

    const text =
      (data?.candidates ?? [])
        .flatMap((c: any) => c?.content?.parts ?? [])
        .map((p: any) => (typeof p?.text === "string" ? p.text : ""))
        .join("")
        .trim();

    return NextResponse.json({ success: true, text });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? "vision-ocr failed" }, { status: 500 });
  }
}
