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

## Implementation of Unit Tests
The main focus of the unit tests were to test the calendar selector component where we ensure that the output was correct in different user scenarios. Using the `jest` testing library that we have used for our project, we implemented unit tests that went alongside the integration test (as detailed above) to cover the correctness of the component in its entirety - by itself and in use with other parts of our app. 

Some parts of the code:
```
describe('Scenario 3: User selects the Spring calendar', () => {
  it('calls onSelect with the correct id and name when a calendar is clicked', async () => {
    const onSelect = jest.fn();
    render(<TestableCalendarPicker {...BASE_PROPS} onSelect={onSelect} />);
    await userEvent.click(screen.getByTestId('calendar-picker-trigger'));

    await userEvent.click(screen.getByTestId('calendar-option-spring-cal-id'));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('spring-cal-id', 'Spring');
  });

  it('closes the dropdown after a calendar is selected', async () => {
    render(<TestableCalendarPicker {...BASE_PROPS} />);
    await userEvent.click(screen.getByTestId('calendar-picker-trigger'));
    await userEvent.click(screen.getByTestId('calendar-option-spring-cal-id'));

    expect(screen.queryByTestId('calendar-dropdown')).not.toBeInTheDocument();
  });
```

In this code snippet, the unit tests cover individual and specific parts that work for the calendar selector. Separating them into small unit tests reduces the risk of bugs and we can clearly pinpoint where there are any errors with great ease.

## Satisfying integration test requirement (Lab06 deliverable)
As detailed above, we implemented an integration test that tested a new feature. We found this especially useful when integrating into the previous features. For specific implementation detail of the integration test, refer above.

## Plans for unit tests going forward
Very similarly to the current unit tests in our codebase, we will continue implementing them for components that will need to be integrated into working with other features. Because they are relatively simple to implement and return important/useful information about the correctness of the component, this saves us a lot of time for debugging especially in the integration step, where we deal with reviewing that all of the components are working smoothly and correctly together.

## Plans for higher-level testing going forward
Since integrating different features and components is a crucial part of our app, where we need to make sure that everything falls correctly into place, we plan to continue creating integration tests whenever we introduce new features and when current features are refined. However, we will also look to implement end-to-end tests - we are nearing the end of our project timeline, therefore, in order to release a successful product, it is essential to experience the full experience a user will have while interacting with our app.
