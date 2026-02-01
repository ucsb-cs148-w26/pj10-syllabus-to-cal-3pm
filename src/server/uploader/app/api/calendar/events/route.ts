import { NextRequest, NextResponse } from 'next/server';
import { createCalendarEvents } from '@/lib/googleCalendar';
import type { CalendarEvent } from '@/types/events';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, events } = body;

    if (!accessToken) {
      return NextResponse.json({ success: false, error: 'Access token is required' }, { status: 400 });
    }

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ success: false, error: 'Events array is required and must not be empty' }, { status: 400 });
    }

    for (const event of events) {
      if (!event.title || !event.start) {
        return NextResponse.json({ success: false, error: 'Invalid event structure: title and start are required' }, { status: 400 });
      }
    }

    const eventIds = await createCalendarEvents(accessToken, events as CalendarEvent[]);

    return NextResponse.json({
      success: true,
      message: `Successfully created ${eventIds.length} event(s) in Google Calendar`,
      eventIds,
      count: eventIds.length,
    });
  } catch (error: any) {
    console.error('Error creating calendar events:', error);
    if (error.code === 401) {
      return NextResponse.json({ success: false, error: 'Invalid or expired access token. Please re-authenticate.' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: error.message || 'Failed to create calendar events' }, { status: 500 });
  }
}
