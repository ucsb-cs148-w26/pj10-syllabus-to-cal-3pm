/**
 * Abbreviated day-name stems used to detect day words in lookaheads.
 */
const DAY_STEMS = "sun|mon|tue|wed|thu|fri|sat";

/**
 * Day-of-week patterns mapped to JS getDay() values (0 = Sun … 6 = Sat).
 */
const DAY_PATTERNS: [RegExp, number][] = [
  [/\bsun(?:day)?\b/, 0],
  [/\bmon(?:day)?\b/, 1],
  [/\btue(?:s(?:day)?)?\b/, 2],
  [/\bwed(?:nesday)?\b/, 3],
  [/\bthu(?:r(?:s(?:day)?)?)?\b/, 4],
  [/\bfri(?:day)?\b/, 5],
  [/\bsat(?:urday)?\b/, 6],
];

const DAY_PATTERN_COMBINED = new RegExp(DAY_PATTERNS.map(([r]) => r.source).join("|"), "g");

/**
 * Parse day-of-week numbers to filter out from a free-text user prompt.
 *
 * Two tiers of keyword matching:
 *
 * Tier 1 — strong keywords (phrase-level scan):
 *   remove / exclude / skip / without / omit / delete / filter out /
 *   ignore / don't include / do not include
 *   → extract the removal phrase up to the next sentence boundary or
 *     ", and <non-day-word>", then collect all day names in that phrase.
 *
 * Tier 2 — weak keyword "no" (proximity guard):
 *   Only fires when a day name is the very next content word after "no"
 *   (with optional fillers: all / the / more / any).
 *   Prevents false positives like "I have no labs on Monday".
 *
 * Examples:
 *   "remove all Tuesday and Friday events"                     → {2, 5}
 *   "exclude Mon, Wed, Fri lectures"                          → {1, 3, 5}
 *   "ignore Monday lectures"                                  → {1}
 *   "don't include Friday events"                             → {5}
 *   "do not include Tuesday or Thursday"                      → {2, 4}
 *   "no Friday lectures"                                      → {5}
 *   "I have no labs on Monday"                                → {}  (false-positive guard)
 *   "Remove Friday lectures, and My section meets Wednesday"  → {5}
 *   "My section meets every Friday"                           → {}
 */
export function parseFilterDays(prompt: string): Set<number> {
  const normalized = prompt.toLowerCase();
  const days = new Set<number>();

  /** Shared helper: scan `phrase` and add every recognised day number. */
  function collectDays(phrase: string) {
    DAY_PATTERN_COMBINED.lastIndex = 0;
    let dayMatch: RegExpExecArray | null;
    while ((dayMatch = DAY_PATTERN_COMBINED.exec(phrase)) !== null) {
      const token = dayMatch[0];
      for (const [pattern, dayNum] of DAY_PATTERNS) {
        if (pattern.test(token)) {
          days.add(dayNum);
          break;
        }
      }
    }
  }

  // End-of-phrase sentinel: sentence boundary OR ", and <non-day-word>".
  const endPattern = new RegExp(
    `[.!?\\n]|,\\s*and\\s+(?!(?:${DAY_STEMS})\\b)`,
  );

  // ── Tier 1: strong removal keywords ──────────────────────────────────────
  const tier1Kw =
    /\b(?:remove|exclude|skip|without|omit|delete|filter\s+out|ignore|don'?t\s+include|do\s+not\s+include)\b/g;

  let m: RegExpExecArray | null;
  while ((m = tier1Kw.exec(normalized)) !== null) {
    const rest = normalized.slice(m.index);
    const endMatch = endPattern.exec(rest);
    const phrase = endMatch ? rest.slice(0, endMatch.index) : rest;
    collectDays(phrase);
  }

  // ── Tier 2: weak keyword "no" (proximity guard) ───────────────────────────
  // Only triggers when a day name is the first content word after "no"
  // (optionally preceded by: all / the / more / any).
  const tier2Pattern = new RegExp(
    `\\bno\\b\\s+(?:(?:all|the|more|any)\\s+)?(?:${DAY_STEMS})`,
    "g",
  );

  while ((m = tier2Pattern.exec(normalized)) !== null) {
    const rest = normalized.slice(m.index);
    const endMatch = endPattern.exec(rest);
    const phrase = endMatch ? rest.slice(0, endMatch.index) : rest;
    collectDays(phrase);
  }

  return days;
}

/**
 * Return the day of week (0 = Sun … 6 = Sat) for a CSV date string,
 * treating it as local time to avoid UTC-midnight off-by-one errors.
 *
 * Handles both "YYYY-MM-DD" (all-day) and "YYYY-MM-DDTHH:MM:SS" (timed).
 */
export function getDayOfWeek(dateStr: string): number {
  const [year, month, day] = dateStr.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).getDay();
}
