import fs from "fs";
import path from "path";

const OUT_DIR = "gemini_output_csv";
const HEADER = "Title,Start,AllDay,Description,Location";

function isValidStart(s: string) {
  // YYYY-MM-DD  OR  YYYY-MM-DD HH:MM (24h)
  return /^\d{4}-\d{2}-\d{2}$/.test(s) || /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(s);
}

function splitCsvLine(line: string) {
  // because you forbid commas in fields, simple split is OK
  return line.split(",");
}

let files = fs.readdirSync(OUT_DIR).filter(f => f.endsWith(".csv"));
if (files.length === 0) {
  console.error(`No CSV files found in ${OUT_DIR}`);
  process.exit(1);
}

let totalRows = 0;
let badRows = 0;
let badFiles = 0;

for (const f of files) {
  const p = path.join(OUT_DIR, f);
  const content = fs.readFileSync(p, "utf-8").trim();
  const lines = content.split(/\r?\n/).filter(Boolean);

  let fileBad = false;

  if (lines[0] !== HEADER) {
    console.log(`[FAIL] ${f}: bad header`);
    fileBad = true;
  }

  for (let i = 1; i < lines.length; i++) {
    totalRows++;
    const cols = splitCsvLine(lines[i]);

    if (cols.length !== 5) {
      badRows++; fileBad = true;
      continue;
    }

    const [title, start, allDay, desc, loc] = cols;

    if (!title || !start) { badRows++; fileBad = true; continue; }
    if (!isValidStart(start.trim())) { badRows++; fileBad = true; continue; }

    const ad = allDay.trim().toUpperCase();
    if (ad !== "TRUE" && ad !== "FALSE") { badRows++; fileBad = true; continue; }

    // No commas inside fields (your rule). If split created 5 cols, this is basically guaranteed,
    // but we keep this check conceptually:
    if ([title, desc, loc].some(x => x.includes(","))) { badRows++; fileBad = true; continue; }
  }

  if (fileBad) {
    badFiles++;
    console.log(`[FAIL] ${f}`);
  } else {
    console.log(`[PASS] ${f}`);
  }
}

const rowPassRate = totalRows === 0 ? 0 : ((totalRows - badRows) / totalRows);
const filePassRate = (files.length - badFiles) / files.length;

console.log("\n=== Format Report ===");
console.log("Files:", files.length, "Pass:", files.length - badFiles, "Fail:", badFiles);
console.log("Rows:", totalRows, "Valid:", totalRows - badRows, "Invalid:", badRows);
console.log("File pass rate:", filePassRate.toFixed(3));
console.log("Row pass rate:", rowPassRate.toFixed(3));

process.exit(badFiles > 0 ? 1 : 0);
