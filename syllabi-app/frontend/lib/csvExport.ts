import type { CalendarEvent } from '@/types/events';

const GOOGLE_CALENDAR_HEADERS =
  'Subject,Start Date,Start Time,End Date,End Time,All Day Event,Description,Location';

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const y = d.getFullYear();
  return `${m}/${day}/${y}`;
}

function formatTime12h(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const am = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${am}`;
}

/**
 * Convert calendar events to Google Calendar–importable CSV.
 * Uses required columns: Subject, Start Date; optional: Start Time, End Date, End Time, All Day Event, Description, Location.
 */
export function toGoogleCalendarCsv(events: CalendarEvent[]): string {
  const rows: string[] = [GOOGLE_CALENDAR_HEADERS];

  for (const e of events) {
    const startDate = formatDate(e.start);
    const allDay = e.allDay ? 'TRUE' : 'FALSE';
    const subject = escapeCsvField(e.title);
    const desc = escapeCsvField(e.description ?? '');
    const loc = escapeCsvField(e.location ?? '');

    if (e.allDay) {
      rows.push(
        [subject, startDate, '', startDate, '', allDay, desc, loc].join(',')
      );
    } else {
      const startTime = formatTime12h(e.start);
      const end = new Date(e.start);
      end.setMinutes(end.getMinutes() + 30);
      const endDate = formatDate(end.toISOString());
      const endTime = formatTime12h(end.toISOString());
      rows.push(
        [subject, startDate, startTime, endDate, endTime, allDay, desc, loc].join(
          ','
        )
      );
    }
  }

  return rows.join('\n');
}

/**
 * Trigger browser download of a CSV file with a descriptive name.
 * @param csvContent - Raw CSV string
 * @param baseName - Optional base (e.g. "syllabus-events"); date will be appended.
 */
export function downloadCsv(
  csvContent: string,
  baseName: string = 'syllabus-events'
): void {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const filename = `${baseName}-${y}-${m}-${d}.csv`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
