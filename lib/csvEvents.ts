import type { CalendarEvent } from '@/lib/googleCalendar';

type ColumnIndexes = {
  title: number;
  start: number;
  allDay: number;
  description: number;
  location: number;
  course: number;
  end: number;
  hasHeader: boolean;
};

function isBlankRow(row: string[]): boolean {
  return row.every((cell) => cell.trim() === '');
}

function parseCsvRows(csvText: string): string[][] {
  const text = csvText.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ',') {
      row.push(field);
      field = '';
      continue;
    }

    if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      field = '';
      if (!isBlankRow(row)) rows.push(row);
      row = [];
      continue;
    }

    field += ch;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (!isBlankRow(row)) rows.push(row);
  }

  return rows;
}

function normalizeHeaderCell(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function resolveColumnIndexes(firstRow: string[]): ColumnIndexes {
  const normalized = firstRow.map(normalizeHeaderCell);
  const title = normalized.indexOf('title');
  const start = normalized.indexOf('start');
  const allDay = normalized.indexOf('allday');
  const description = normalized.indexOf('description');
  const location = normalized.indexOf('location');
  const course = normalized.indexOf('class');
  const end = normalized.indexOf('end');

  const hasHeader = title !== -1 && start !== -1;
  return {
    title: hasHeader ? title : 0,
    start: hasHeader ? start : 1,
    allDay: hasHeader ? allDay : 2,
    description: hasHeader ? description : 3,
    location: hasHeader ? location : 4,
    course: hasHeader ? course : 5,
    end: hasHeader ? end : 6,
    hasHeader,
  };
}

function getCell(row: string[], index: number): string {
  if (index < 0 || index >= row.length) return '';
  return row[index] ?? '';
}

export function parseCsvToCalendarEvents(csvText: string): CalendarEvent[] {
  const rows = parseCsvRows(csvText);
  if (rows.length === 0) return [];

  const indexes = resolveColumnIndexes(rows[0]);
  const startRow = indexes.hasHeader ? 1 : 0;
  const events: CalendarEvent[] = [];

  for (let i = startRow; i < rows.length; i += 1) {
    const row = rows[i];
    const title = getCell(row, indexes.title).trim();
    const start = getCell(row, indexes.start).trim();
    const allDayRaw = getCell(row, indexes.allDay).trim().toLowerCase();
    const rawDescription = getCell(row, indexes.description).trim();
    const location = getCell(row, indexes.location).trim();
    const course = getCell(row, indexes.course).trim();
    const end = getCell(row, indexes.end).trim();

    // Skip repeated headers in the middle of output.
    if (normalizeHeaderCell(title) === 'title' && normalizeHeaderCell(start) === 'start') {
      continue;
    }

    if (!title && !start) continue;

    const [typeKeyword, ...notesParts] = rawDescription.split('|');
    const typeKey = typeKeyword.trim();
    const notes = notesParts.join('|').trim();
    const type = typeKey === 'EXAM' ? 'exam' : typeKey === 'ASSIGNMENT' ? 'assignment' : typeKey === 'LECTURE' ? 'class' : undefined;
    const typeLabel = typeKey === 'EXAM' ? 'Exam' : typeKey === 'ASSIGNMENT' ? 'Assignment' : typeKey === 'LECTURE' ? 'Lecture' : typeKey;
    const baseDescription = course ? `${course} | ${typeLabel}` : typeLabel;
    const description = notes ? `${baseDescription} | ${notes}` : baseDescription;

    // Assignments are zero-duration timed events (start == end), never all-day
    const isAssignment = type === 'assignment';
    const allDay = isAssignment ? false : ['true', '1', 'yes', 'y'].includes(allDayRaw);
    const resolvedEnd = end || (isAssignment ? start : undefined);

    events.push({
      title,
      start,
      end: resolvedEnd || undefined,
      allDay,
      description,
      location,
      class: course,
      type,
    });
  }

  return events;
}
