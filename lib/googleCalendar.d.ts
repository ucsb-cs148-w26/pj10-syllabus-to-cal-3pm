export interface CalendarEvent {
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  description?: string;
  location?: string;
  class?: string;
  type?: 'assignment' | 'exam' | 'class';
  recurrence?: string[];
}

export declare const getAuthUrl: () => Promise<string>;

export declare const createCalendarEvents: (
  accessToken: string,
  events: CalendarEvent[]
) => Promise<string[]>;
