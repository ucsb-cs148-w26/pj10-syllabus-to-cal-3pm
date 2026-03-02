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

  const prompt = `
You are an information extraction system.
Extract calendar events from a syllabus transcript and output ONLY a CSV.
No markdown. No explanations.

Only include: ${eventTypesStr}

RULES:
- Ignore holidays, office hours, breaks, readings, or optional items.

OUTPUT FORMAT (STRICT):
Output EXACTLY 6 columns in this EXACT order:

title,start,allDay,description,location,class

FIRST LINE MUST BE EXACTLY:
title,start,allDay,description,location,class

COLUMN RULES:

title:
- Short human‑friendly event title, should within 15 words
- Do NOT include course name
- Do NOT include commas

start:
- If allDay=false → YYYY-MM-DDTHH:MM:SS
- If allDay=true → YYYY-MM-DD

allDay:
- true or false (lowercase)

description:
- Use event type (LECTURE / ASSIGNMENT / EXAM)

location:
- ALWAYS leave empty

class:
- Use course code if present (CMPSC 130A, WRIT 105CW)
- Otherwise use full course name
- MUST be identical for all rows

EXAMPLE:

title,start,allDay,description,location,class
Lecture,2025-03-31T08:00:00,false,LECTURE,,WRIT 105CW
Service Pledge Due,2025-04-23,true,ASSIGNMENT,,WRIT 105CW

Now extract events from this syllabus transcript:
"""${text}"""
`.trim();

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

