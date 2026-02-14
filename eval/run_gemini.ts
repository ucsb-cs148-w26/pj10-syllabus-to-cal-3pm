import fs from "fs";
import path from "path";

// CONFIG
const TXT_DIR = "syllabi_txt";
const OUT_DIR = "gemini_output_csv";

const CSV_HEADER = "Title,Start,AllDay,Description,Location";

function buildPrompt(text: string) {
  return (
    "You will receive a transcript of a syllabus from a class.\n" +
    "Your task is to output a CSV file that can be imported into Google Calendar.\n" +
    "Return ONLY raw CSV text (no markdown, no extra text).\n\n" +

    "OUTPUT FORMAT:\n" +
    "Title,Start,AllDay,Description,Location\n\n" +

    "STRICT RULES:\n" +
    "1) The FIRST line MUST be exactly:\n" +
    "Title,Start,AllDay,Description,Location\n" +
    "2) Every row MUST have exactly 5 comma-separated fields in that order.\n" +
    "3) Start MUST be either:\n" +
    " - YYYY-MM-DD (for all-day events)\n" +
    " - YYYY-MM-DD HH:MM (24-hour time)\n" +
    "4) AllDay MUST be TRUE or FALSE.\n" +
    "5) If time is missing: Start uses date only and AllDay=TRUE.\n" +
    "6) If time exists: AllDay=FALSE.\n" +
    "7) Do NOT invent dates/times/locations.\n" +
    "8) If an item has no valid date: SKIP it.\n" +
    "9) Deduplicate identical events (same Title + Start).\n" +
    "10) IMPORTANT CSV RULE: Do NOT use commas inside ANY field values (Title, Start, AllDay, Description, Location).\n" +
    " If the source text contains commas, replace them with a semicolon (;) or a space.\n" +
    " Commas are ONLY allowed as column separators between the 5 fields.\n" +
    "11) Do NOT generate recurring meeting patterns (e.g., 'MWF 2-3pm', 'every Tuesday') as dated events.\n" +
    " Only output events with explicit calendar dates (e.g., assignments due, quizzes, exams, specifically dated lectures).\n\n" +

    "TEXT NORMALIZATION RULES (PDF extraction issues):\n" +
    "- The transcript may have broken lines mid-sentence.\n" +
    "- Treat a single newline as a space unless it clearly starts a new item (bullet/number/date heading).\n" +
    "- If a line looks incomplete, combine it with the next line(s) to form a complete sentence before extracting events.\n" +
    "- If multiple events appear on one line separated by commas/semicolons, split them into separate events ONLY if each has (or clearly shares) a valid date.\n\n" +

    'Here is the syllabus transcript:\n"""' +
    text +
    '"""'
  );
}

function normalizeInputText(raw: string) {
  // Merge single newlines into spaces; keep paragraph breaks.
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/([^\n])\n([^\n])/g, "$1 $2")
    .trim();
}

function sanitizeCsvOutput(csv: string) {
  // Remove weird trailing characters (like %) and normalize newlines
  let out = csv.replace(/\r\n/g, "\n").trim();

  // Sometimes the terminal shows a trailing %, remove it if present
  out = out.replace(/%+$/g, "").trim();

  // Ensure header exists; if not, prepend it
  if (!out.startsWith(CSV_HEADER)) {
    out = `${CSV_HEADER}\n${out}`;
  }

  // Ensure final newline so wc -l works as expected
  return out.trimEnd() + "\n";
}

function csvHasRows(csv: string) {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return false;
  if (lines[0].trim() !== CSV_HEADER) return lines.length >= 1; // unknown header, but non-empty
  return lines.length >= 2; // header + at least 1 data row
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY in env");

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 30000,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini HTTP ${response.status}: ${errText}`);
  }

  const data: any = await response.json();

  const csvText = (data?.candidates || [])
    .map(
      (candidate: any) =>
        candidate?.content?.parts?.map((part: any) => part.text).join("") || ""
    )
    .join("\n")
    .trim();

  if (!csvText) throw new Error("Gemini returned empty csvText");
  return csvText;
}

function ensureDirs() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function generateCsvWithRetry(text: string) {
  // attempt 1
  let csvRaw = await callGemini(buildPrompt(text));
  let csv = sanitizeCsvOutput(csvRaw);

  if (csvHasRows(csv)) return csv;

  // attempt 2 (nudge if header-only)
  const nudge =
    "\n\nIMPORTANT: You returned only the header. Search again for explicitly dated milestones " +
    "(due dates, exams, quizzes, project checkpoints). If any explicit dates exist, output them.\n";
  csvRaw = await callGemini(buildPrompt(text + nudge));
  csv = sanitizeCsvOutput(csvRaw);

  return csv;
}

async function main() {
  ensureDirs();

  const files = fs.readdirSync(TXT_DIR).filter((f) => f.endsWith(".txt"));
  if (files.length === 0) {
    console.error(`No .txt files found in ${TXT_DIR}`);
    process.exit(1);
  }

  for (const file of files) {
    console.log("Processing:", file);

    const raw = fs.readFileSync(path.join(TXT_DIR, file), "utf-8");
    const text = normalizeInputText(raw);

    const csv = await generateCsvWithRetry(text);

    const outPath = path.join(OUT_DIR, file.replace(/\.txt$/i, ".csv"));
    fs.writeFileSync(outPath, csv, "utf-8");

    console.log("Saved:", outPath, `(rows=${csv.trim().split(/\r?\n/).length - 1})`);
  }
}

main().catch((e) => {
  console.error("Eval runner failed:", e);
  process.exit(1);
});
