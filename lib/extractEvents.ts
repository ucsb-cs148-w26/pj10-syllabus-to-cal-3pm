import * as chrono from "chrono-node";

export type TextBlock = {
  page?: number;
  text: string;
};

export type EventCandidate = {
  title: string;
  start: string;
  allDay: boolean;
  description?: string;
};

const KEYWORDS = ["due", "exam", "midterm", "final", "quiz", "homework", "project"];

/*
input:
  blocks: TextBlock[]
    - Each TextBlock represents a chunk of text extracted from a syllabus.
    - `text` contains raw syllabus text.
    - `page` (optional) is the page number where the text came from.

output:
  EventCandidate[]
    - A list of extracted calendar event candidates.
    - Each event includes a title, start date/time (ISO string),
      whether it is an all-day event, and a short description.
    - These events can later be sent to Google Calendar or shown to the user.
*/
export function extractEvents(blocks: TextBlock[]): EventCandidate[] {
  const events: EventCandidate[] = [];

  for (const block of blocks) {
    const lines = block.text.split("\n");

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (!KEYWORDS.some(k => lower.includes(k))) continue;

      const results = chrono.parse(line);
      if (results.length === 0) continue;

      const startDate = results[0].start?.date();
      if (!startDate) continue;

      const hasTime = lower.includes("am") || lower.includes("pm") || lower.includes(":");

      events.push({
        title: line.trim(),
        start: startDate.toISOString(),
        allDay: !hasTime,
        description: line.trim(),
      });
    }
  }

  return events;
}
