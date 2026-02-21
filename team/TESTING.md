# Testing Documentation

## Testing Libraries

We use the following testing libraries:

| Library | Version | Purpose |
|---|---|---|
| **Jest** | ^30.2.0 | Test runner and assertion framework |
| **jest-environment-jsdom** | ^30.2.0 | Simulates a browser DOM environment for component tests |
| **@testing-library/react** | ^16.3.2 | Renders React components and provides DOM query utilities |
| **@testing-library/jest-dom** | ^6.9.1 | Custom matchers like `toBeInTheDocument()` |
| **@testing-library/user-event** | ^14.6.1 | Simulates realistic user interactions (clicks, typing) |
| **ts-node** | ^10.9.2 | Allows Jest config to be written in TypeScript (`jest.config.ts`) |
| **@types/jest** | ^30.0.0 | TypeScript type definitions for Jest globals |

### Why Jest + React Testing Library?

- **Jest** is the most widely adopted JavaScript test runner with built-in mocking, assertions, and coverage reporting. It integrates seamlessly with Next.js via `next/jest`.
- **React Testing Library** encourages testing components the way users interact with them (by visible text, roles, and labels) rather than testing implementation details, which leads to more maintainable tests.

## Test Setup

### Configuration files

- **`jest.config.ts`** -- Uses `next/jest` to auto-handle Next.js transforms (JSX, CSS modules, path aliases). Sets `jsdom` as the test environment and loads the setup file.
- **`jest.setup.js`** -- Imports `@testing-library/jest-dom` so custom DOM matchers are available in every test.

### NPM scripts (in `package.json`)

| Command | What it does |
|---|---|
| `npm test` | Run the full Jest test suite |


## Integration Tests Implemented

### `CalendarSelector.integration.test.tsx`

**File:** `__tests__/integration/CalendarSelector.integration.test.tsx`
**Main component under test:** `CalendarPicker` -- a calendar selector UI for selecting which calendar the user wants to upload the extracted events to in Google Calendar.

Tests draw from a set of Mock calendar data and all mock calls are reset before each test is ran.




| # | Test Name | What It Validates |
|---|---|---|
| 1 | renders the calendar choice button in the sync panel when connected | The CalendarPicker trigger button labelled "Default calendar" is visible in the Sync panel when a Google access token is present.
| 2 | fetches the real calendar list from /api/calendar/calendars when opened | Clicking the trigger calls /api/calendar/calendars with the correct Authorization: Bearer header.
| 3 | renders all calendars returned by the API inside the dropdown | After opening, the listbox contains all calendars returned by the API (Personal, Spring, Work).
| 4 | shows a loading state while the calendar list is being fetched | While the fetch is in-flight, a "Loading calendars…" indicator is visible inside the dropdown.
| 5 | shows an error state if the calendar list fetch fails | When the API returns a non-OK response, "Could not load calendars" is shown inside the dropdown.
| 6 | only fetches the calendar list once even if the picker is opened multiple times | Opening, closing, and reopening the picker only triggers a single fetch call.
| 7 | closes the dropdown when the trigger is clicked again | Clicking the open trigger again removes the listbox from the DOM.
| 8 | is not shown when the user is not connected to Google | When no access token is provided, the CalendarPicker trigger is not rendered at all.
| 9 | syncs to the primary calendar by default when no selection is made | Clicking Sync without choosing a calendar sends calendarId: "primary" in the POST body.
| 10 | shows a success message after syncing to the default calendar | After a successful sync to the default calendar, "Sync Complete" appears in the UI.
| 11 | updates the trigger label to show Spring after selection | After selecting Spring from the dropdown, the trigger button label updates to "Spring".
| 12 | syncs to the Spring calendar when it has been selected | After selecting Spring and clicking Sync, the POST body contains calendarId: "spring-cal-id".
| 13 | does not use "primary" as the calendarId when Spring is selected | After selecting Spring, the POST body does not contain calendarId: "primary".
| 14 | shows a sync-complete message after syncing to the Spring calendar | After syncing to Spring, "Sync Complete" appears in the UI.

## How to Run Tests

```bash
# 1. Install dependencies
npm i

# 2. In project root directory

# 3. Run all tests
npm test
```

## Completion Criteria

- All Jest tests pass locally

