export interface CalendarEvent {
  title: string;
  start: string;
  allDay: boolean;
  description?: string;
  location?: string;
}

export declare const getAuthUrl: () => Promise<string>;

export declare const createCalendarEvents: (
  accessToken: string,
  events: CalendarEvent[]
) => Promise<string[]>;