import { NextRequest, NextResponse } from "next/server";

type GeminiPart = { text?: string };
type GeminiCandidate = { content?: { parts?: GeminiPart[] } };
type GeminiResponse = { candidates?: GeminiCandidate[] };
type GeminiErrorResponse = { error?: { message?: string } };

function getGeminiErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const maybeError = (data as GeminiErrorResponse).error;
  if (!maybeError || typeof maybeError !== "object") return null;
  if (typeof maybeError.message !== "string" || maybeError.message.trim() === "") return null;
  return maybeError.message;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
  }

  let body: {
    text?: string;
    includeLectures?: boolean;
    includeAssignments?: boolean;
    includeExams?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    text,
    includeLectures = true,
    includeAssignments = true,
    includeExams = true,
  } = body;

  if (!text) {
    return NextResponse.json({ error: "Failed to provide text" }, { status: 400 });
  }

  const types: string[] = [];
  if (includeLectures) types.push("lectures");
  if (includeAssignments) types.push("assignments");
  if (includeExams) types.push("test/exams");
  const eventTypesStr =
    types.length === 0
      ? "assignments, lectures, test/exams"
      : types.length === 1
        ? types[0]
        : types.length === 2
          ? `${types[0]} and ${types[1]}`
          : `${types[0]}, ${types[1]}, and ${types[2]}`;

  const prompt = `You will receive a transcript of a syllabus from a class. Your task is to output a CSV file with all class events (${eventTypesStr}) that can be imported into Google Calendar. Only include the event types requested. Only provide the CSV content; no markdown or extra text. Here is the syllabus transcript:"""${text}"""`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.25,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    const data: GeminiResponse | GeminiErrorResponse = await response.json().catch(() => ({}));

    if (!response.ok) {
      const detail = getGeminiErrorMessage(data) ?? `HTTP ${response.status}`;
      return NextResponse.json(
        { error: `Gemini request failed: ${detail}` },
        { status: 502 }
      );
    }

    const csvText = (data?.candidates || [])
      .map((candidate: GeminiCandidate) =>
        (candidate?.content?.parts || []).map((part: GeminiPart) => part.text ?? "").join("")
      )
      .join("\n");

    const cleanedCsv = csvText
      .replace(/^```csv\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    if (!cleanedCsv) {
      return NextResponse.json({ error: "Failed to return CSV" }, { status: 500 });
    }

    return NextResponse.json({ csvText: cleanedCsv });
  } catch (err) {
    console.error("Failed to call Gemini", err);
    return NextResponse.json({ error: "Failed to call Gemini" }, { status: 500 });
  }
}
