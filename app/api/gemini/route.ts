// app/api/gemini/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type GeminiPart = { text?: string };
type GeminiCandidate = { content?: { parts?: GeminiPart[] } };
type GeminiResponse = { candidates?: GeminiCandidate[] };

function joinText(data: GeminiResponse) {
  return (data?.candidates ?? [])
    .flatMap((c) => c?.content?.parts ?? [])
    .map((p) => (typeof p?.text === "string" ? p.text : ""))
    .join("")
    .trim();
}

function csvEscape(v: string) {
  const s = String(v ?? "").trim();
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * New schema (adds class column):
 * class,title,type,allDay,time,date
 *
 * This function is robust:
 * - If Gemini outputs 6 columns already, we keep them.
 * - If Gemini outputs the old 5 columns (title,type,allDay,time,date), we derive `class` from the title.
 * - Always rebuilds the CSV with OUR header + real newlines (fixes header+row glued together).
 */
function normalizeCsv6(raw: string) {
  let s = String(raw ?? "").replace(/\r\n/g, "\n").trim();

  // Strip ```csv fences if present
  s = s
    .replace(/^```csv\s*\n?/i, "")
    .replace(/^```\s*\n?/i, "")
    .replace(/```$/m, "")
    .trim();

  // If rows are smashed, force newline after dates to help regex scanning
  s = s.replace(/(\d{4}-\d{2}-\d{2})\s+(?=[A-Za-z"“])/g, "$1\n");

  // Drop some common wrong/old headers if they appear (we rebuild anyway)
  s = s.replace(
    /^title\s*,\s*start\s*,\s*allDay\s*,\s*description\s*,\s*location\s*/i,
    ""
  );
  s = s.replace(/^title\s*,\s*type\s*,\s*allDay\s*,\s*time\s*,\s*date\s*/i, "");

  const outRows: string[] = [];

  // Helper: derive class name from a "title" like "Writing 105CW Service Pledge Due"
  function deriveClassFromTitle(fullTitle: string) {
    const t = String(fullTitle ?? "").trim();

    const keywords = [
      " Lecture",
      " Midterm",
      " Final",
      " Exam",
      " Quiz",
      " Test",
      " Due",
      " Assignment",
      " Project",
      " Homework",
    ];

    let cut = -1;
    for (const k of keywords) {
      const idx = t.indexOf(k);
      if (idx > 0) {
        cut = idx;
        break;
      }
    }
    if (cut > 0) return t.slice(0, cut).trim();

    // Fallback: first 2–6 tokens (not perfect but better than blank)
    const tokens = t.split(/\s+/).filter(Boolean);
    return tokens.slice(0, Math.min(6, tokens.length)).join(" ").trim();
  }

  // 1) Try extracting 6-column rows:
  // class,title,type,allDay,time,date
  // 1) Desired 6-col output schema:
  // title,type,allDay,time,date,class

  let m: RegExpExecArray | null;

  // A) If Gemini outputs: title,type,allDay,time,date,class  (correct)
  const reDesired =
    /(.+?),(LECTURE|ASSIGNMENT|EXAM),(true|false),([^,]*),(\d{4}-\d{2}-\d{2}),(.+?)(?:\n|$)/g;

  while ((m = reDesired.exec(s)) !== null) {
    const title = (m[1] ?? "").trim();
    const type = (m[2] ?? "").trim();
    const allDay = (m[3] ?? "").trim();
    const time = (m[4] ?? "").trim();
    const date = (m[5] ?? "").trim();
    const cls = (m[6] ?? "").trim();

    outRows.push([
      csvEscape(title),
      type,
      allDay,
      csvEscape(time),
      date,
      csvEscape(cls),
    ].join(","));
  }

  // B) If Gemini outputs the “wrong 6-col”: title,title,type,allDay,time,date  (your screenshot)
  if (outRows.length === 0) {
    const reDupTitle =
      /(.+?),(.+?),(LECTURE|ASSIGNMENT|EXAM),(true|false),([^,]*),(\d{4}-\d{2}-\d{2})(?:\n|$)/g;

    while ((m = reDupTitle.exec(s)) !== null) {
      const title = (m[1] ?? "").trim();
      // m[2] is duplicated title, ignore it
      const type = (m[3] ?? "").trim();
      const allDay = (m[4] ?? "").trim();
      const time = (m[5] ?? "").trim();
      const date = (m[6] ?? "").trim();

      const cls = deriveClassFromTitle(title);

      outRows.push([
        csvEscape(title),
        type,
        allDay,
        csvEscape(time),
        date,
        csvEscape(cls),
      ].join(","));
    }
  }

  // C) Old 5-col: title,type,allDay,time,date  (fallback)
  if (outRows.length === 0) {
    const re5 =
      /(.+?),(LECTURE|ASSIGNMENT|EXAM),(true|false),([^,]*),(\d{4}-\d{2}-\d{2})(?:\n|$)/g;

    while ((m = re5.exec(s)) !== null) {
      const title = (m[1] ?? "").trim();
      const type = (m[2] ?? "").trim();
      const allDay = (m[3] ?? "").trim();
      const time = (m[4] ?? "").trim();
      const date = (m[5] ?? "").trim();

      const cls = deriveClassFromTitle(title);

      outRows.push([
        csvEscape(title),
        type,
        allDay,
        csvEscape(time),
        date,
        csvEscape(cls),
      ].join(","));
    }
  }

  // 2) If no 6-col rows were found, fall back to old 5-column rows:
  // title,type,allDay,time,date  -> derive class from title
  if (outRows.length === 0) {
    const re5 =
      /(.+?),(LECTURE|ASSIGNMENT|EXAM),(true|false),([^,]*),(\d{4}-\d{2}-\d{2})/g;

    while ((m = re5.exec(s)) !== null) {
      const fullTitle = (m[1] ?? "").trim();
      const type = (m[2] ?? "").trim();
      const allDay = (m[3] ?? "").trim();
      const time = (m[4] ?? "").trim();
      const date = (m[5] ?? "").trim();

      const cls = deriveClassFromTitle(fullTitle);

      outRows.push([
        csvEscape(cls),
        csvEscape(fullTitle),
        type,
        allDay,
        csvEscape(time),
        date,
      ].join(","));
    }
  }

  return ["title,type,allDay,time,date,class", ...outRows].join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    const body = (await req.json().catch(() => ({}))) as any;
    const { text, includeLectures = true, includeAssignments = true, includeExams = true } = body ?? {};

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Failed to provide text" }, { status: 400 });
    }

    const allowed: string[] = [];
    if (includeLectures) allowed.push("LECTURE");
    if (includeAssignments) allowed.push("ASSIGNMENT");
    if (includeExams) allowed.push("EXAM");
    const allowedTypes = allowed.length ? allowed : ["LECTURE", "ASSIGNMENT", "EXAM"];

    const todayISO = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const prompt = `
You are an information extraction system. Extract calendar events from a syllabus transcript and output ONLY a CSV (no markdown, no commentary).

PRIMARY GOAL: High accuracy (~90%+) and no egregious errors. Prefer skipping ambiguity over guessing.

ALLOWED EVENT TYPES (STRICT): ${allowedTypes.join(", ")}
- Only output events whose type is in the allowed list.
- NEVER output holidays, office hours (OH), “no class” days, breaks, vacations, instructor availability, discussion sections, labs, study/review sessions, readings, admin notes, optional meetings.

ALL-DAY RULE:
- If an event has NO specific time, set allDay=true and leave time EMPTY.

YEAR / TERM INFERENCE (STRICT + CONSISTENT):
1) If ANY year appears anywhere (e.g., 2025/2026), use that year for dates missing a year (unless a different explicit year is attached to that specific date).
2) If a term like "Winter 2026" appears, that term/year is the source of truth.
3) If no explicit year/term, infer ONE year that makes the schedule coherent (8–16 weeks) and not more than 12 months after TODAY (${todayISO}). Apply consistently.
4) NEVER mix inferred years. If you cannot infer one consistent year, SKIP ambiguous events.

DATE HEADING SCOPE RULE:
- If the transcript has a date heading like "Wednesday: 4/23/25", then all bullet items under "Assignments Due" until the next date heading use that same date.

COURSE NAME:
- Identify the course/class name near the top (e.g., "Writing 105CW", "CHST 1B").
- Output it in the CSV column named "class" for EVERY row.

CSV OUTPUT FORMAT (STRICT — DO NOT DEVIATE):
Output ONLY CSV with EXACTLY 6 columns in this EXACT order:
title,type,allDay,time,date,class

Rules:
- The FIRST line MUST be EXACTLY:
  title,type,allDay,time,date,class
- There MUST be a newline after the header and each event must be on its own line.
- title: a specific event title. title MUST NOT contain commas.If a title contains a comma, replace every comma with " - ".Do NOT wrap titles in quotes. Do NOT include any extra commas inside any column.
  TITLE NORMALIZATION (VERY IMPORTANT):
  - title must be short and human-friendly (max 80 characters).
  - For LECTURE: title should be "Lecture: <main topic>" (use the first/main topic only).
  - For ASSIGNMENT: title should be "<assignment name>" (no "Lab -", no extra context).
  - For quizzes: title should be "Quiz 1", "Quiz 2", etc.
  - Remove prefixes like "Lecture -", "Lab -", and extra chained topics after the first separator.
  - DO NOT include commas in title. If the source has commas, replace them with " - " (dash) or ";".
- type must be one of: ${allowedTypes.join(", ")}
- allDay must be true/false (lowercase)
- time must be HH:MM (24h) or empty (empty => allDay=true)
- date must be YYYY-MM-DD (required)
- class: the course/class name.
    RULES (STRICT):
    1) If a course number/code exists (e.g., "CMPSC 130A", "WRIT 105CW", "MATH 3B"), output ONLY the course code.
      Examples:
      - "CMPSC 130A - Data Structures" → CMPSC 130A
      - "Writing 105CW: Writing & Community" → WRIT 105CW

    2) If NO course code exists, output the full course name as written.
      Example:
      - "Introduction to Sociology" → Introduction to Sociology

    3) NEVER include:
      - section titles
      - lecture titles
      - assignment names
      - extra punctuation
      - dates or times

    4) The class column MUST contain the SAME value for all rows in the same syllabus.
    - DO NOT output any other columns. Do not rename columns.

    EXAMPLE (match exactly):
    title,type,allDay,time,date,class
    Lecture,LECTURE,false,08:00,2025-03-31,Writing 105CW,
    Service Pledge Due,ASSIGNMENT,true,,2025-04-23,Writing 105CW,

Now extract events from this syllabus transcript:
"""${text}"""
`.trim();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 12000 },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Gemini HTTP ${response.status}: ${errText}` }, { status: 500 });
    }

    const data: GeminiResponse = await response.json();
    const rawCsv = joinText(data);

    if (!rawCsv) {
      return NextResponse.json({ error: "Failed to return CSV" }, { status: 500 });
    }

    // Always rebuild into the correct CSV (fixes header/row glued + one-line issues)
    const csvText = normalizeCsv6(rawCsv);
    return NextResponse.json({ csvText });
  } catch (err) {
    console.error("Failed to call Gemini", err);
    return NextResponse.json({ error: "Failed to call Gemini" }, { status: 500 });
  }
}