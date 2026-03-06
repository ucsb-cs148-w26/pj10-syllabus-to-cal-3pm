import { NextRequest, NextResponse } from "next/server";
import {
  createCalendarEvents,
  listCalendarEvents,
  updateCalendarEvent,
  deleteCalendarEvent,
  CalendarEvent,
} from "@/lib/googleCalendar";
import { getCalendarAccessToken, requireSameOrigin } from "@/lib/calendarAuth";

type CalendarApiError = {
  code?: number | string;
  message?: string;
  response?: { data?: { error?: { message?: string; code?: number | string } } };
};

function parseError(error: unknown): {
  status: number;
  message: string;
  unauthorized: boolean;
} {
  const err = error as CalendarApiError;
  const code = err.code ?? err.response?.data?.error?.code;
  const googleMessage = err.response?.data?.error?.message;
  const message = googleMessage ?? err.message ?? "Calendar request failed";
  const unauthorized = code === 401 || code === "401";
  const status = unauthorized ? 401 : code === 403 || code === "403" ? 403 : 500;
  return { status, message, unauthorized };
}

/** GET /api/calendar/events?month=YYYY-MM OR ?timeMin=ISO&timeMax=ISO */
export async function GET(request: NextRequest) {
  const token = getCalendarAccessToken(request);
  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month");
  const timeMinParam = searchParams.get("timeMin");
  const timeMaxParam = searchParams.get("timeMax");
  const calendarsParam = searchParams.get("calendars");
  const calendarIds = calendarsParam
    ? calendarsParam.split(",").map((s) => s.trim()).filter(Boolean)
    : ["primary"];

  if (!token) {
    return NextResponse.json(
      { success: false, error: "Google Calendar authentication is required" },
      { status: 401 }
    );
  }

  let timeMin: string;
  let timeMax: string;
  if (timeMinParam && timeMaxParam) {
    timeMin = timeMinParam;
    timeMax = timeMaxParam;
  } else if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [year, month] = monthParam.split("-").map(Number);
    timeMin = new Date(Date.UTC(year, month - 1, 1)).toISOString();
    timeMax = new Date(Date.UTC(year, month, 1)).toISOString();
  } else {
    return NextResponse.json(
      { success: false, error: "Query 'month' (YYYY-MM) or 'timeMin'/'timeMax' (ISO) required" },
      { status: 400 }
    );
  }

  try {
    const events = await listCalendarEvents(token, timeMin, timeMax, calendarIds);
    return NextResponse.json({ success: true, events });
  } catch (error: unknown) {
    const parsed = parseError(error);
    return NextResponse.json(
      {
        success: false,
        error: parsed.unauthorized
          ? "Invalid or expired Google Calendar session. Please reconnect."
          : parsed.message,
      },
      { status: parsed.status }
    );
  }
}

/** POST /api/calendar/events — create events. Body: { events, calendarId? } */
export async function POST(request: NextRequest) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  let body: { events?: CalendarEvent[]; calendarId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const token = getCalendarAccessToken(request);
  if (!token) {
    return NextResponse.json(
      { success: false, error: "Google Calendar authentication is required" },
      { status: 401 }
    );
  }

  if (!Array.isArray(body.events) || body.events.length === 0) {
    return NextResponse.json(
      { success: false, error: "Events array is required and must not be empty" },
      { status: 400 }
    );
  }

  for (const event of body.events) {
    if (!event.title || !event.start) {
      return NextResponse.json(
        { success: false, error: "Invalid event structure: title and start are required" },
        { status: 400 }
      );
    }
  }

  try {
    const eventIds = await createCalendarEvents(token, body.events, body.calendarId ?? "primary");
    return NextResponse.json({
      success: true,
      message: `Successfully created ${eventIds.length} event(s) in Google Calendar`,
      eventIds,
      count: eventIds.length,
    });
  } catch (error: unknown) {
    const parsed = parseError(error);
    return NextResponse.json(
      {
        success: false,
        error: parsed.unauthorized
          ? "Invalid or expired Google Calendar session. Please reconnect."
          : parsed.message,
      },
      { status: parsed.status }
    );
  }
}

/** PATCH /api/calendar/events — update one event. Body: { eventId, ... } */
export async function PATCH(request: NextRequest) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  let body: {
    eventId?: string;
    title?: string;
    start?: string;
    end?: string;
    allDay?: boolean;
    description?: string;
    recurrence?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const token = getCalendarAccessToken(request);
  if (!token || !body.eventId) {
    return NextResponse.json(
      { success: false, error: "Google Calendar authentication and eventId are required" },
      { status: 400 }
    );
  }

  try {
    await updateCalendarEvent(token, body.eventId, {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.start !== undefined && { start: body.start }),
      ...(body.end !== undefined && { end: body.end }),
      ...(body.allDay !== undefined && { allDay: body.allDay }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.recurrence !== undefined && { recurrence: body.recurrence }),
    });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const parsed = parseError(error);
    return NextResponse.json(
      {
        success: false,
        error: parsed.unauthorized
          ? "Invalid or expired Google Calendar session. Please reconnect."
          : parsed.message,
      },
      { status: parsed.status }
    );
  }
}

/** DELETE /api/calendar/events — delete one event. Body: { eventId } */
export async function DELETE(request: NextRequest) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  let body: { eventId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const token = getCalendarAccessToken(request);
  if (!token || !body.eventId) {
    return NextResponse.json(
      { success: false, error: "Google Calendar authentication and eventId are required" },
      { status: 400 }
    );
  }

  try {
    await deleteCalendarEvent(token, body.eventId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const parsed = parseError(error);
    return NextResponse.json(
      {
        success: false,
        error: parsed.unauthorized
          ? "Invalid or expired Google Calendar session. Please reconnect."
          : parsed.message,
      },
      { status: parsed.status }
    );
  }
}
