/**
 * Calendar event shape used for CSV export (Google Calendar import format).
 * Matches extracted syllabus events from PDF → text → events pipeline.
 */
export interface CalendarEvent {
  title: string;
  start: string; // ISO 8601
  allDay: boolean;
  description?: string;
  location?: string;
}
