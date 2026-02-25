import { NextRequest, NextResponse } from "next/server";

type GeminiPart = { text?: string };
type GeminiCandidate = { content?: { parts?: GeminiPart[] } };
type GeminiResponse = { candidates?: GeminiCandidate[] };

export async function POST(req: NextRequest) {
  const body = await req.json();
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
            maxOutputTokens: 30000,
          },
        }),
      }
    );

    const data: GeminiResponse = await response.json();

    const csvText = (data?.candidates || [])
      .map((candidate: GeminiCandidate) =>
        (candidate?.content?.parts || []).map((part: GeminiPart) => part.text ?? "").join("")
      )
      .join("\n");

    if (!csvText) {
      return NextResponse.json({ error: "Failed to return CSV" }, { status: 500 });
    }

    return NextResponse.json({ csvText });
  } catch (err) {
    console.error("Failed to call Gemini", err);
    return NextResponse.json({ error: "Failed to call Gemini" }, { status: 500 });
  }
}

