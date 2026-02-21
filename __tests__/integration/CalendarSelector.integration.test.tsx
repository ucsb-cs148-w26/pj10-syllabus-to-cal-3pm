/**
 * Integration tests for the CalendarPicker feature.
 *
 * These tests render the REAL Uploads component at step 3 (Sync stage) and
 * mock only the network boundary (global fetch). No internal modules are
 * mocked — the component tree, state management, and UI interactions all run
 * as they would in a real browser.
 *
 * Acceptance criteria covered:
 *   Scenario 1 – No calendar selected  → fetch is called with calendarId 'primary'
 *   Scenario 2 – Calendar choice button → dropdown expands with real calendars
 *   Scenario 3 – User picks Spring     → fetch is called with calendarId 'spring-cal-id'
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Uploads } from '@/components/figma-app/components/features/Uploads';

// ─── Constants ────────────────────────────────────────────────────────────────

const MOCK_ACCESS_TOKEN = 'mock-access-token';

const MOCK_CALENDARS = [
  { id: 'primary', summary: 'Personal', primary: true, backgroundColor: '#4285f4' },
  { id: 'spring-cal-id', summary: 'Spring', primary: false, backgroundColor: '#33b679' },
  { id: 'work-cal-id', summary: 'Work', primary: false, backgroundColor: '#d50000' },
];

const MOCK_EVENTS = [
  { title: 'Midterm Exam', start: '2025-03-15T10:00:00Z', allDay: false },
  { title: 'Final Project Due', start: '2025-04-30T23:59:00Z', allDay: false },
];

// ─── Setup ────────────────────────────────────────────────────────────────────

/**
 * Navigate the real Uploads component to step 3 by injecting events into
 * localStorage and clicking through the step rail. This mirrors actual user
 * flow without touching internals.
 */
async function renderAtSyncStep(accessToken: string | null = MOCK_ACCESS_TOKEN) {
  // Pre-seed extracted events so "Review" and "Sync" steps are reachable.
  localStorage.setItem('calendarEvents', JSON.stringify(MOCK_EVENTS));

  const onAccessTokenChange = jest.fn();
  const user = userEvent.setup();

  render(
    <Uploads
      initialAccessToken={accessToken}
      onAccessTokenChange={onAccessTokenChange}
    />
  );

  // Click the "Sync" step in the step rail to jump to step 3.
  // The button text includes the step number so we match "3 Sync" specifically.
  const syncStep = screen.getByRole('button', { name: /3.*sync/i });
  await user.click(syncStep);

  // Confirm we are on the sync stage.
  // Use getByRole heading to avoid matching the subtitle paragraph and step
  // rail hint text which also contain "sync to google calendar".
  await waitFor(() => {
    expect(
      screen.getByRole('heading', { name: /sync to google calendar/i })
    ).toBeInTheDocument();
  });

  return { user, onAccessTokenChange };
}

// ─── Fetch mock helpers ───────────────────────────────────────────────────────

/** Mock fetch to return the calendar list for GET /api/calendar/calendars */
function mockFetchCalendars(overrides?: Partial<typeof MOCK_CALENDARS[0]>[]) {
  const calendars = overrides
    ? MOCK_CALENDARS.map((c, i) => ({ ...c, ...(overrides[i] ?? {}) }))
    : MOCK_CALENDARS;

  return jest.fn().mockResolvedValueOnce({
    ok: true,
    json: async () => ({ calendars }),
  });
}

/** Mock fetch to return a successful sync response for POST /api/calendar/events */
function mockFetchSyncSuccess(count = MOCK_EVENTS.length) {
  return jest.fn().mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      success: true,
      count,
      message: `Successfully created ${count} event(s) in Google Calendar`,
      eventIds: Array.from({ length: count }, (_, i) => `evt-id-${i}`),
    }),
  });
}

/**
 * Build a fetch mock that handles multiple sequential requests.
 * Requests are matched in the order they are added.
 */
function buildMultiFetch(...handlers: Array<(url: string, init?: RequestInit) => Promise<Response>>) {
  let callIndex = 0;
  return jest.fn().mockImplementation((url: string, init?: RequestInit) => {
    const handler = handlers[callIndex] ?? handlers[handlers.length - 1];
    callIndex++;
    return handler(url, init);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Integration tests
// ─────────────────────────────────────────────────────────────────────────────

describe('CalendarPicker — integration tests (Sync stage)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ── Scenario 2 ──────────────────────────────────────────────────────────────

  describe('Scenario 2: User presses the calendar choice button', () => {
    it('renders the calendar choice button in the sync panel when connected', async () => {
      global.fetch = jest.fn(); // no calls expected yet
      const { user } = await renderAtSyncStep();

      // The picker trigger should be visible when Google is connected.
      expect(screen.getByRole('button', { name: /default calendar/i })).toBeInTheDocument();
    });

    it('fetches the real calendar list from /api/calendar/calendars when opened', async () => {
      global.fetch = mockFetchCalendars();
      const { user } = await renderAtSyncStep();

      await user.click(screen.getByRole('button', { name: /default calendar/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/calendar/calendars',
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: `Bearer ${MOCK_ACCESS_TOKEN}`,
            }),
          })
        );
      });
    });

    it('renders all calendars returned by the API inside the dropdown', async () => {
      global.fetch = mockFetchCalendars();
      const { user } = await renderAtSyncStep();

      await user.click(screen.getByRole('button', { name: /default calendar/i }));

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const listbox = screen.getByRole('listbox');
      expect(within(listbox).getByText('Personal')).toBeInTheDocument();
      expect(within(listbox).getByText(/Spring/)).toBeInTheDocument();
      expect(within(listbox).getByText('Work')).toBeInTheDocument();
    });

    it('shows a loading state while the calendar list is being fetched', async () => {
      // Return a promise that never resolves to hold the loading state.
      global.fetch = jest.fn().mockReturnValueOnce(new Promise(() => {}));
      const { user } = await renderAtSyncStep();

      await user.click(screen.getByRole('button', { name: /default calendar/i }));

      expect(screen.getByText(/loading calendars/i)).toBeInTheDocument();
    });

    it('shows an error state if the calendar list fetch fails', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Unauthorized' }),
      });
      const { user } = await renderAtSyncStep();

      await user.click(screen.getByRole('button', { name: /default calendar/i }));

      await waitFor(() => {
        expect(screen.getByText(/could not load calendars/i)).toBeInTheDocument();
      });
    });

    it('only fetches the calendar list once even if the picker is opened multiple times', async () => {
      global.fetch = mockFetchCalendars();
      const { user } = await renderAtSyncStep();

      const trigger = screen.getByRole('button', { name: /default calendar/i });

      // Open → close → open
      await user.click(trigger);
      await waitFor(() => screen.getByRole('listbox'));
      await user.click(trigger); // close
      await user.click(trigger); // re-open

      // fetch should have only been called once
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('closes the dropdown when the trigger is clicked again', async () => {
      global.fetch = mockFetchCalendars();
      const { user } = await renderAtSyncStep();

      const trigger = screen.getByRole('button', { name: /default calendar/i });
      await user.click(trigger);
      await waitFor(() => screen.getByRole('listbox'));

      await user.click(trigger);
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('is not shown when the user is not connected to Google', async () => {
      global.fetch = jest.fn();
      await renderAtSyncStep(null); // no access token

      // When not connected, the picker trigger should not be interactive.
      expect(screen.queryByRole('button', { name: /default calendar/i })).not.toBeInTheDocument();
    });
  });

  // ── Scenario 1 ──────────────────────────────────────────────────────────────

  describe('Scenario 1: User does not select a calendar and presses Sync', () => {
    it('syncs to the primary calendar by default when no selection is made', async () => {
      global.fetch = mockFetchSyncSuccess();
      const { user } = await renderAtSyncStep();

      await user.click(screen.getByRole('button', { name: /^sync$/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/calendar/events',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"calendarId":"primary"'),
          })
        );
      });
    });

    it('shows a success message after syncing to the default calendar', async () => {
      global.fetch = mockFetchSyncSuccess();
      const { user } = await renderAtSyncStep();

      await user.click(screen.getByRole('button', { name: /^sync$/i }));

      await waitFor(() => {
        expect(screen.getByText(/sync complete/i)).toBeInTheDocument();
      });
    });
  });

  // ── Scenario 3 ──────────────────────────────────────────────────────────────

  describe('Scenario 3: User selects the Spring calendar and presses Sync', () => {
    it('updates the trigger label to show Spring after selection', async () => {
      global.fetch = mockFetchCalendars();
      const { user } = await renderAtSyncStep();

      await user.click(screen.getByRole('button', { name: /default calendar/i }));
      await waitFor(() => screen.getByRole('listbox'));

      await user.click(screen.getByRole('option', { name: /spring/i }));

      expect(screen.getByRole('button', { name: /spring/i })).toBeInTheDocument();
    });

    it('syncs to the Spring calendar when it has been selected', async () => {
      // First fetch → calendar list; second fetch → sync success
      global.fetch = buildMultiFetch(
        async () => ({
          ok: true,
          json: async () => ({ calendars: MOCK_CALENDARS }),
        } as Response),
        async () => ({
          ok: true,
          json: async () => ({ success: true, count: 2, eventIds: ['a', 'b'] }),
        } as Response),
      );

      const { user } = await renderAtSyncStep();

      // Open picker and choose Spring
      await user.click(screen.getByRole('button', { name: /default calendar/i }));
      await waitFor(() => screen.getByRole('listbox'));
      await user.click(screen.getByRole('option', { name: /spring/i }));

      // Press Sync
      await user.click(screen.getByRole('button', { name: /^sync$/i }));

      await waitFor(() => {
        const [, syncInit] = (global.fetch as jest.Mock).mock.calls[1];
        const body = JSON.parse(syncInit.body);
        expect(body.calendarId).toBe('spring-cal-id');
      });
    });

    it('does not use "primary" as the calendarId when Spring is selected', async () => {
      global.fetch = buildMultiFetch(
        async () => ({
          ok: true,
          json: async () => ({ calendars: MOCK_CALENDARS }),
        } as Response),
        async () => ({
          ok: true,
          json: async () => ({ success: true, count: 2, eventIds: ['a', 'b'] }),
        } as Response),
      );

      const { user } = await renderAtSyncStep();

      await user.click(screen.getByRole('button', { name: /default calendar/i }));
      await waitFor(() => screen.getByRole('listbox'));
      await user.click(screen.getByRole('option', { name: /spring/i }));
      await user.click(screen.getByRole('button', { name: /^sync$/i }));

      await waitFor(() => {
        const [, syncInit] = (global.fetch as jest.Mock).mock.calls[1];
        const body = JSON.parse(syncInit.body);
        expect(body.calendarId).not.toBe('primary');
      });
    });

    it('shows a sync-complete message after syncing to the Spring calendar', async () => {
      global.fetch = buildMultiFetch(
        async () => ({
          ok: true,
          json: async () => ({ calendars: MOCK_CALENDARS }),
        } as Response),
        async () => ({
          ok: true,
          json: async () => ({ success: true, count: 2, eventIds: ['a', 'b'] }),
        } as Response),
      );

      const { user } = await renderAtSyncStep();

      await user.click(screen.getByRole('button', { name: /default calendar/i }));
      await waitFor(() => screen.getByRole('listbox'));
      await user.click(screen.getByRole('option', { name: /spring/i }));
      await user.click(screen.getByRole('button', { name: /^sync$/i }));

      await waitFor(() => {
        expect(screen.getByText(/sync complete/i)).toBeInTheDocument();
      });
    });
  });
});