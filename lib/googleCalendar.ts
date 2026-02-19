import { google } from 'googleapis';

export interface CalendarEvent {
  title: string;
  start: string;
  end?: string; // required for timed events (ISO)
  allDay: boolean;
  description?: string;
  location?: string;
  /** Recurrence rules, e.g. ['RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR'] */
  recurrence?: string[];
}

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/callback';

type AuthUrlOptions = {
  prompt?: string;
};

export const getAuthUrl = async (options: AuthUrlOptions = {}): Promise<string> => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      'Google Calendar is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local (see .env.example).'
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri,
  );

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: options.prompt ?? 'consent',
  });
};

export const getTokenFromCode = async (code: string) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri,
  );

  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
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
    const endParsed = event.end ? new Date(event.end) : null;
    const endIso = endParsed && !isNaN(endParsed.getTime()) ? endParsed.toISOString() : iso;

    const calendarEvent: Record<string, unknown> = {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: event.allDay ? { date: baseDate } : { dateTime: iso },
      end: event.allDay ? { date: baseDate } : { dateTime: endIso },
    };
    if (event.recurrence && event.recurrence.length > 0) {
      calendarEvent.recurrence = event.recurrence;
    }

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

/** Event shape returned when listing from Google Calendar (for display) */
export interface GoogleCalendarEventItem {
  id: string;
  title: string;
  start: string; // ISO or YYYY-MM-DD
  end?: string;
  allDay: boolean;
  description?: string;
  location?: string;
  recurrence?: string[];
}

/**
 * List events from the user's primary Google Calendar within a time range.
 */
export const listCalendarEvents = async (
  accessToken: string,
  timeMin: string, // ISO datetime
  timeMax: string
): Promise<GoogleCalendarEventItem[]> => {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: 'startTime',
  });

  const items = response.data.items ?? [];
  return items
    .filter((e): e is NonNullable<typeof e> => e != null && e.id != null)
    .map((e) => {
      const start = e.start?.dateTime ?? e.start?.date ?? '';
      const end = e.end?.dateTime ?? e.end?.date ?? start;
      return {
        id: e.id,
        title: e.summary ?? '(No title)',
        start,
        end,
        allDay: !e.start?.dateTime,
        description: e.description ?? undefined,
        location: e.location ?? undefined,
        recurrence: e.recurrence ?? undefined,
      };
    });
};

/**
 * Update an existing event on the user's primary Google Calendar.
 */
export const updateCalendarEvent = async (
  accessToken: string,
  eventId: string,
  patch: {
    title?: string;
    start?: string;
    end?: string;
    allDay?: boolean;
    description?: string;
    recurrence?: string[];
  }
): Promise<void> => {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const body: {
    summary?: string;
    description?: string;
    start?: { date?: string; dateTime?: string };
    end?: { date?: string; dateTime?: string };
    recurrence?: string[];
  } = {};
  if (patch.title !== undefined) body.summary = patch.title;
  if (patch.description !== undefined) body.description = patch.description;
  if (patch.recurrence !== undefined) body.recurrence = patch.recurrence.length ? patch.recurrence : [];
  if (patch.start !== undefined) {
    const useDateOnly = patch.allDay ?? !patch.start.includes('T');
    const parsed = new Date(patch.start);
    const baseDate = isNaN(parsed.getTime()) ? patch.start.split('T')[0] : parsed.toISOString().split('T')[0];
    body.start = useDateOnly ? { date: baseDate } : { dateTime: patch.start };
    body.end = useDateOnly ? { date: baseDate } : { dateTime: patch.end ?? patch.start };
  }

  await calendar.events.patch({
    calendarId: 'primary',
    eventId,
    requestBody: body,
  });
};

/**
 * Delete an event from the user's primary Google Calendar.
 */
export const deleteCalendarEvent = async (
  accessToken: string,
  eventId: string
): Promise<void> => {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  await calendar.events.delete({
    calendarId: 'primary',
    eventId,
  });
};