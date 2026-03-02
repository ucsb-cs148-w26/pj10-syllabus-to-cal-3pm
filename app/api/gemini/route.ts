import { NextRequest, NextResponse } from "next/server";

type GeminiPart = { text?: string };
type GeminiCandidate = { content?: { parts?: GeminiPart[] } };
type GeminiResponse = { candidates?: GeminiCandidate[] };

/**
 * Sanitize user-provided prompt text to prevent prompt injection and XSS.
 * - Strips HTML/script tags
 * - Removes null bytes and non-printable control characters
 * - Enforces a hard length cap
 */
function sanitizeUserPrompt(raw: unknown): string {
  if (typeof raw !== "string") return "";

  let s = raw;
  // Strip HTML/XML tags
  s = s.replace(/<[^>]*>/g, "");
  // Remove null bytes and ASCII control chars except tab/newline/carriage-return
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  // Enforce length (server-side cap, same as client MAX_PROMPT_LENGTH)
  s = s.slice(0, 500);
  return s.trim();
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    text,
    includeLectures = true,
    includeAssignments = true,
    includeExams = true,
    userPrompt,
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

  const sanitizedUserPrompt = sanitizeUserPrompt(userPrompt);
  const userInstructionsSection = sanitizedUserPrompt
    ? `
USER ADDITIONAL INSTRUCTIONS:
<user_instructions>
${sanitizedUserPrompt}
</user_instructions>
Apply ALL of the following rules that are relevant to the instruction above:

RULE A — FILTERING: If the instruction removes or excludes events (e.g. "remove Friday lectures"),
  delete those rows from the output. Do not add them.

RULE B — ADDING RECURRING EVENTS: If the instruction provides a schedule (e.g. section time, lab time),
  generate new CSV rows — one per weekly occurrence — across the FULL date range of the syllabus.
  CRITICAL: Do NOT extract or copy section/discussion events that already exist in the syllabus text.
  Instead, compute the dates yourself using the day-of-week and time the user stated.
  - If no day-of-week is given, do NOT generate any events (cannot infer the day).
  - If a day-of-week is given but no time, generate as all-day events (allDay=true, start=YYYY-MM-DD).
  - If both day-of-week and time are given, generate as timed events (allDay=false, start=YYYY-MM-DDTHH:MM:SS).
  - For the class column: if the user mentions a course name or number (e.g. "CS64", "CS 148"),
    use that course name for the generated rows. Do NOT inherit the syllabus course code.
  - Set title to a short descriptive name (e.g. "Discussion Section").
  - Set description to LECTURE.
  - Example A (time given): user says "My CS148 section meets Fridays 2:00-2:50pm", syllabus spans 2026-01-13 to 2026-03-17
    → one row per Friday at 14:00:00, class=CS 148:
    Discussion Section,2026-01-16T14:00:00,false,LECTURE,,CS 148
    Discussion Section,2026-01-23T14:00:00,false,LECTURE,,CS 148
  - Example B (no time given): user says "My CS64 section happens every Friday", syllabus spans 2026-01-13 to 2026-03-17
    → one all-day row per Friday, class=CS 64:
    Discussion Section,2026-01-16,true,LECTURE,,CS 64
    Discussion Section,2026-01-23,true,LECTURE,,CS 64
    ... (one row per occurrence — computed from the calendar, not copied from the syllabus)

RULE C — ADDING ONE-TIME EVENTS: If the instruction mentions a specific date and event
  (e.g. "I have a meeting on March 6 at 7pm"), generate exactly one CSV row for it.
  - Use the exact date and time the user stated.
  - If a time is given, generate as a timed event (allDay=false, start=YYYY-MM-DDTHH:MM:SS).
  - If no time is given, generate as an all-day event (allDay=true, start=YYYY-MM-DD).
  - Set title to a short descriptive name matching what the user said (e.g. "Meeting").
  - Set description to LECTURE.
  - Leave class empty unless the user specifies a course.
  - Example: user says "I have a meeting at 2026/03/06 at 7:00 pm"
    → Meeting,2026-03-06T19:00:00,false,LECTURE,,

Output ONLY valid CSV rows in the established format. No markdown, no explanations.
`
    : "";

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
- Specify Location if mentioned in the files, else ALWAYS leave empty

class:
- Use course code if present (CMPSC 130A, WRIT 105CW)
- Otherwise use full course name
- MUST be identical for all rows

EXAMPLE:

title,start,allDay,description,location,class
Lecture,2025-03-31T08:00:00,false,LECTURE,,WRIT 105CW
Service Pledge Due,2025-04-23,true,ASSIGNMENT,,WRIT 105CW

${userInstructionsSection}
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

