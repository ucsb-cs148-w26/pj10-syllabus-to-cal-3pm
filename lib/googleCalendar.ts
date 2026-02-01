import { google } from 'googleapis';
import type { CalendarEvent } from '@/types/events';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback';

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

export async function getAuthUrl(state?: string): Promise<string> {
  const oauth2Client = createOAuth2Client();
  
  const scopes = [
    'https://www.googleapis.com/auth/calendar.events',
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: state || 'default',
    prompt: 'consent',
  });

  return url;
}

export async function getTokenFromCode(code: string) {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function createCalendarEvents(
  accessToken: string,
  events: CalendarEvent[]
): Promise<string[]> {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const eventIds: string[] = [];

  for (const event of events) {
    const startDate = new Date(event.start);
    const endDate = event.allDay
      ? new Date(startDate.getTime() + 24 * 60 * 60 * 1000) // Add 1 day for all-day events
      : new Date(startDate.getTime() + 30 * 60 * 1000); // Add 30 minutes for timed events

    const googleEvent = {
      summary: event.title,
      description: event.description || '',
      location: event.location || '',
      start: event.allDay
        ? {
            date: startDate.toISOString().split('T')[0], // YYYY-MM-DD format for all-day
            timeZone: 'America/Los_Angeles',
          }
        : {
            dateTime: startDate.toISOString(),
            timeZone: 'America/Los_Angeles',
          },
      end: event.allDay
        ? {
            date: endDate.toISOString().split('T')[0],
            timeZone: 'America/Los_Angeles',
          }
        : {
            dateTime: endDate.toISOString(),
            timeZone: 'America/Los_Angeles',
          },
    };

    try {
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: googleEvent,
      });

      if (response.data.id) {
        eventIds.push(response.data.id);
      }
    } catch (error) {
      console.error(`Failed to create event "${event.title}":`, error);
      throw error;
    }
  }

  return eventIds;
}
