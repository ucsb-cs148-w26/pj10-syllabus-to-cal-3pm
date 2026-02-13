import { google } from 'googleapis';

export interface CalendarEvent {
  title: string;
  start: string;
  allDay: boolean;
  description?: string;
  location?: string;
}

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/callback';

type AuthUrlOptions = {
  prompt?: string;
};

export const getAuthUrl = async (options: AuthUrlOptions = {}): Promise<string> => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri,
  );

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: options.prompt ?? 'consent',
  });
};

export const createCalendarEvents = async (
  accessToken: string,
  events: CalendarEvent[]
): Promise<string[]> => {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const eventIds: string[] = [];

  for (const event of events) {
    // Normalize and validate the start time coming from Gemini/CSV
    const parsed = new Date(event.start);
    if (isNaN(parsed.getTime())) {
      console.warn('[googleCalendar] Skipping event with invalid start date:', event);
      continue;
    }

    const iso = parsed.toISOString();
    const baseDate = iso.split('T')[0];

    const calendarEvent: any = {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: event.allDay ? { date: baseDate } : { dateTime: iso },
      end: event.allDay ? { date: baseDate } : { dateTime: iso },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: calendarEvent,
    });

    if (response.data.id) {
      eventIds.push(response.data.id);
    }
  }

  return eventIds;
};