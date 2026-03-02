import { NextRequest } from "next/server";

jest.mock("@/lib/googleCalendar", () => ({
  createCalendarEvents: jest.fn(),
  listCalendarEvents: jest.fn(),
  updateCalendarEvent: jest.fn(),
  deleteCalendarEvent: jest.fn(),
}));

import {
  createCalendarEvents,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/googleCalendar";
import { POST, PATCH, DELETE } from "@/app/api/calendar/events/route";

const mockCreateCalendarEvents = createCalendarEvents as jest.MockedFunction<
  typeof createCalendarEvents
>;
const mockUpdateCalendarEvent = updateCalendarEvent as jest.MockedFunction<
  typeof updateCalendarEvent
>;
const mockDeleteCalendarEvent = deleteCalendarEvent as jest.MockedFunction<
  typeof deleteCalendarEvent
>;

function buildRequest(
  method: "POST" | "PATCH" | "DELETE",
  body: Record<string, unknown>,
  origin: string
): NextRequest {
  return new NextRequest("http://localhost/api/calendar/events", {
    method,
    headers: {
      "content-type": "application/json",
      origin,
      cookie: "google_calendar_access_token=valid-cookie-token",
    },
    body: JSON.stringify(body),
  });
}

const SAMPLE_EVENTS = [
  { title: "Midterm Exam", start: "2025-03-15T10:00:00Z", allDay: false },
];

describe("Calendar event mutation route security", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateCalendarEvents.mockResolvedValue(["evt-1"]);
    mockUpdateCalendarEvent.mockResolvedValue(undefined);
    mockDeleteCalendarEvent.mockResolvedValue(undefined);
  });

  it("returns 403 on cross-origin POST", async () => {
    const req = buildRequest("POST", { events: SAMPLE_EVENTS, calendarId: "primary" }, "http://evil.com");
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/invalid request origin/i);
    expect(mockCreateCalendarEvents).not.toHaveBeenCalled();
  });

  it("returns 403 on cross-origin PATCH", async () => {
    const req = buildRequest(
      "PATCH",
      { eventId: "evt-1", title: "Updated title" },
      "http://evil.com"
    );
    const res = await PATCH(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/invalid request origin/i);
    expect(mockUpdateCalendarEvent).not.toHaveBeenCalled();
  });

  it("returns 403 on cross-origin DELETE", async () => {
    const req = buildRequest("DELETE", { eventId: "evt-1" }, "http://evil.com");
    const res = await DELETE(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/invalid request origin/i);
    expect(mockDeleteCalendarEvent).not.toHaveBeenCalled();
  });

  it("allows same-origin POST and uses cookie token", async () => {
    const req = buildRequest("POST", { events: SAMPLE_EVENTS }, "http://localhost");
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockCreateCalendarEvents).toHaveBeenCalledWith(
      "valid-cookie-token",
      SAMPLE_EVENTS,
      "primary"
    );
  });
});
