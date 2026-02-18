import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    const { imageUrl } = (await req.json()) as { imageUrl?: string };
    if (!imageUrl) {
      return NextResponse.json({ error: "Missing imageUrl" }, { status: 400 });
    }

    // Download image bytes from Vercel Blob public URL
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      return NextResponse.json({ error: `Failed to fetch image: ${imgRes.status}` }, { status: 400 });
    }

    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    const bytes = new Uint8Array(await imgRes.arrayBuffer());

    // Convert to base64
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
            parts: [
              { text: prompt },
              { inlineData: { mimeType: contentType, data: b64 } },
            ],
          },
        ],
        generationConfig: { temperature: 0, maxOutputTokens: 8000 },
      }),
    });

    if (!gemRes.ok) {
      const errText = await gemRes.text();
      return NextResponse.json({ error: `Gemini OCR HTTP ${gemRes.status}: ${errText}` }, { status: 500 });
    }

    const data: any = await gemRes.json();
    const text =
      (data?.candidates || [])
        .map((c: any) => c?.content?.parts?.map((p: any) => p.text).join("") || "")
        .join("\n")
        .trim();

    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "vision-ocr failed" }, { status: 500 });
  }
}
