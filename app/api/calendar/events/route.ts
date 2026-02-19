import { NextRequest, NextResponse } from "next/server";
import {
  createCalendarEvents,
  listCalendarEvents,
  updateCalendarEvent,
  deleteCalendarEvent,
  CalendarEvent,
} from "@/lib/googleCalendar";

/** GET /api/calendar/events?month=YYYY-MM OR ?timeMin=ISO&timeMax=ISO — list events. Auth: Authorization: Bearer <access_token> */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authorization required (Bearer token)" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get("month");
    const timeMinParam = searchParams.get("timeMin");
    const timeMaxParam = searchParams.get("timeMax");

    let timeMin: string;
    let timeMax: string;

    if (timeMinParam && timeMaxParam) {
      timeMin = timeMinParam;
      timeMax = timeMaxParam;
    } else if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      const [year, month] = monthParam.split("-").map(Number);
      // Use UTC so the whole calendar month is included regardless of server timezone
      timeMin = new Date(Date.UTC(year, month - 1, 1)).toISOString();
      timeMax = new Date(Date.UTC(year, month, 1)).toISOString();
    } else {
      return NextResponse.json(
        { success: false, error: "Query 'month' (YYYY-MM) or 'timeMin' and 'timeMax' (ISO) required" },
        { status: 400 }
      );
    }

    const events = await listCalendarEvents(token, timeMin, timeMax);
    return NextResponse.json({ success: true, events });
  } catch (error: unknown) {
    const err = error as { code?: number; message?: string };
    console.error("Error listing calendar events:", error);
    if (err.code === 401) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token. Please re-authenticate." },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: err.message ?? "Failed to list calendar events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, events } = body as {
      accessToken?: string;
      events?: CalendarEvent[];
    };

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: "Access token is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Events array is required and must not be empty",
        },
        { status: 400 }
      );
    }

    for (const event of events) {
      if (!event.title || !event.start) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid event structure: title and start are required",
          },
          { status: 400 }
        );
      }
    }

    const eventIds = await createCalendarEvents(accessToken, events);

    return NextResponse.json({
      success: true,
      message: `Successfully created ${eventIds.length} event(s) in Google Calendar`,
      eventIds,
      count: eventIds.length,
    });
  } catch (error: any) {
    console.error("Error creating calendar events:", error);
    if (error.code === 401) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid or expired access token. Please re-authenticate.",
        },
        { status: 401 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create calendar events",
      },
      { status: 500 }
    );
  }
}

/** PATCH /api/calendar/events — update one event. Body: { accessToken, eventId, title?, start?, end?, allDay?, description?, recurrence? } */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, eventId, title, start, end, allDay, description, recurrence } = body as {
      accessToken?: string;
      eventId?: string;
      title?: string;
      start?: string;
      end?: string;
      allDay?: boolean;
      description?: string;
      recurrence?: string[];
    };

    if (!accessToken || !eventId) {
      return NextResponse.json(
        { success: false, error: "accessToken and eventId are required" },
        { status: 400 }
      );
    }

    await updateCalendarEvent(accessToken, eventId, {
      ...(title !== undefined && { title }),
      ...(start !== undefined && { start }),
      ...(end !== undefined && { end }),
      ...(allDay !== undefined && { allDay }),
      ...(description !== undefined && { description }),
      ...(recurrence !== undefined && { recurrence }),
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as { code?: number; message?: string };
    console.error("Error updating calendar event:", error);
    if (err.code === 401) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token. Please re-authenticate." },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: err.message ?? "Failed to update event" },
      { status: 500 }
    );
  }
}

/** DELETE /api/calendar/events — delete one event. Body: { accessToken, eventId } */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, eventId } = body as { accessToken?: string; eventId?: string };

    if (!accessToken || !eventId) {
      return NextResponse.json(
        { success: false, error: "accessToken and eventId are required" },
        { status: 400 }
      );
    }

    await deleteCalendarEvent(accessToken, eventId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as { code?: number; message?: string };
    console.error("Error deleting calendar event:", error);
    if (err.code === 401) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token. Please re-authenticate." },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: err.message ?? "Failed to delete event" },
      { status: 500 }
    );
  }
}
