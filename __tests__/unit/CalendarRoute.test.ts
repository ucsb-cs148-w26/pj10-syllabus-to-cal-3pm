import { POST } from '@/app/api/calendar/events/route';
import { NextRequest } from 'next/server';


jest.mock('@/lib/googleCalendar', () => ({
  createCalendarEvents: jest.fn(),
}));

import { createCalendarEvents } from '@/lib/googleCalendar';
const mockCreateCalendarEvents = createCalendarEvents as jest.MockedFunction<
  typeof createCalendarEvents
>;


function buildRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/calendar/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const SAMPLE_EVENTS = [
  { title: 'Midterm Exam', start: '2025-03-15T10:00:00Z', allDay: false },
  { title: 'Final Project Due', start: '2025-04-30T23:59:00Z', allDay: false },
];


beforeEach(() => {
  jest.clearAllMocks();
  mockCreateCalendarEvents.mockResolvedValue(['evt-id-1', 'evt-id-2']);
});


describe('Scenario 1: User does not select a calendar', () => {
  it("defaults to 'primary' when calendarId is not provided", async () => {
    const req = buildRequest({
      accessToken: 'valid-token',
      events: SAMPLE_EVENTS,
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockCreateCalendarEvents).toHaveBeenCalledWith(
      'valid-token',
      SAMPLE_EVENTS,
      'primary',
    );
  });

  it("defaults to 'primary' when calendarId is explicitly undefined", async () => {
    const req = buildRequest({
      accessToken: 'valid-token',
      events: SAMPLE_EVENTS,
      calendarId: undefined,
    });

    await POST(req as any);

    expect(mockCreateCalendarEvents).toHaveBeenCalledWith(
      'valid-token',
      SAMPLE_EVENTS,
      'primary',
    );
  });

  it('returns the correct count and eventIds in the response', async () => {
    const req = buildRequest({ accessToken: 'valid-token', events: SAMPLE_EVENTS });

    const res = await POST(req as any);
    const body = await res.json();

    expect(body.count).toBe(2);
    expect(body.eventIds).toEqual(['evt-id-1', 'evt-id-2']);
  });
});


describe('Scenario 3: User selects the Spring calendar and syncs', () => {
  it('passes the selected calendarId to createCalendarEvents', async () => {
    const req = buildRequest({
      accessToken: 'valid-token',
      events: SAMPLE_EVENTS,
      calendarId: 'spring-cal-id',
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockCreateCalendarEvents).toHaveBeenCalledWith(
      'valid-token',
      SAMPLE_EVENTS,
      'spring-cal-id',
    );
  });

  it("does NOT fall back to 'primary' when a calendarId is provided", async () => {
    const req = buildRequest({
      accessToken: 'valid-token',
      events: SAMPLE_EVENTS,
      calendarId: 'spring-cal-id',
    });

    await POST(req as any);

    const [, , calendarIdArg] = mockCreateCalendarEvents.mock.calls[0];
    expect(calendarIdArg).toBe('spring-cal-id');
    expect(calendarIdArg).not.toBe('primary');
  });

  it('returns the correct count when syncing to a specific calendar', async () => {
    mockCreateCalendarEvents.mockResolvedValueOnce(['id-a', 'id-b', 'id-c']);

    const req = buildRequest({
      accessToken: 'valid-token',
      events: [
        ...SAMPLE_EVENTS,
        { title: 'Lab', start: '2025-02-01T09:00:00Z', allDay: false },
      ],
      calendarId: 'spring-cal-id',
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.count).toBe(3);
  });
});


describe('Input validation', () => {
  it('returns 400 when accessToken is missing', async () => {
    const req = buildRequest({ events: SAMPLE_EVENTS });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(mockCreateCalendarEvents).not.toHaveBeenCalled();
  });

  it('returns 400 when events array is empty', async () => {
    const req = buildRequest({ accessToken: 'valid-token', events: [] });

    const res = await POST(req as any);

    expect(res.status).toBe(400);
    expect((await res.json()).success).toBe(false);
  });

  it('returns 400 when an event is missing a title', async () => {
    const req = buildRequest({
      accessToken: 'valid-token',
      events: [{ start: '2025-03-15T10:00:00Z', allDay: false }],
    });

    const res = await POST(req as any);

    expect(res.status).toBe(400);
    expect((await res.json()).success).toBe(false);
  });

  it('returns 401 when Google rejects the access token', async () => {
    const authError = Object.assign(new Error('Invalid credentials'), { code: 401 });
    mockCreateCalendarEvents.mockRejectedValueOnce(authError);

    const req = buildRequest({ accessToken: 'expired-token', events: SAMPLE_EVENTS });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/re-authenticate/i);
  });

  it('returns 500 on unexpected errors', async () => {
    mockCreateCalendarEvents.mockRejectedValueOnce(new Error('Network timeout'));

    const req = buildRequest({ accessToken: 'valid-token', events: SAMPLE_EVENTS });

    const res = await POST(req as any);

    expect(res.status).toBe(500);
    expect((await res.json()).success).toBe(false);
  });
});