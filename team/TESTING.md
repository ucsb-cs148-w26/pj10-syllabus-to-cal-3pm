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
| **@testing-library/dom** | ^10.4.1 | Core DOM testing utilities used by React Testing Library |
| **ts-jest** | ^29.4.6 | TypeScript preprocessor so Jest can run `.ts`/`.tsx` files |
| **ts-node** | ^10.9.2 | Allows Jest config to be written in TypeScript (`jest.config.ts`) |
| **@types/jest** | ^30.0.0 | TypeScript type definitions for Jest globals |

### Why Jest + React Testing Library?

- **Jest** is the most widely adopted JavaScript test runner with built-in mocking, assertions, and coverage reporting. It integrates seamlessly with Next.js via `next/jest`.
- **React Testing Library** encourages testing components the way users interact with them (by visible text, roles, and labels) rather than testing implementation details, which leads to more maintainable tests.

## Test Setup

### Configuration files

- **`cs148-app/jest.config.ts`** -- Uses `next/jest` to auto-handle Next.js transforms (JSX, CSS modules, path aliases). Sets `jsdom` as the test environment and loads the setup file.
- **`cs148-app/jest.setup.js`** -- Imports `@testing-library/jest-dom` so custom DOM matchers are available in every test.

### NPM scripts (in `cs148-app/package.json`)

| Command | What it does |
|---|---|
| `npm test` | Run the full Jest test suite |
| `npm test -- --watch` | Re-run tests on file changes |
| `npm test -- --coverage` | Run tests and generate a coverage report |

## Unit Tests Implemented

### `Uploads.test.tsx`

**File:** `cs148-app/components/figma-app/components/features/__tests__/Uploads.test.tsx`
**Component under test:** `Uploads` -- the main uploader UI for uploading syllabi PDFs, reviewing extracted events, and syncing to Google Calendar.

All tests mock `localStorage` to isolate state between runs.

| # | Test Name | What It Validates |
|---|---|---|
| 1 | Render upload page default view | The component renders its heading ("Upload Your Syllabuses") and empty-state prompt ("Upload your first syllabus") on initial load. |
| 2 | Seed mock documents if local storage is empty | When localStorage has no saved documents, clicking the documents button seeds default sample files (CS-101, MATH-201, ENG-150) and persists them to localStorage. |
| 3 | Load documents from localStorage when present | Pre-populated localStorage documents are loaded and displayed correctly on render. |
| 4 | Uploading PDF adds it to file list & saves to localStorage | Simulating a file input change with a PDF file adds the file to the visible list and persists it in localStorage. |
| 5 | Deleting document removes it from user view and localStorage | Clicking the delete button on a specific document removes it from the DOM and from localStorage while leaving other documents intact. |
| 6 | Show correct message when all files are deleted | After deleting every document, the empty-state message ("No documents uploaded yet") is displayed. |
| 7 | Do nothing if upload event had no files | A file input change event with `null` files does not crash or alter the existing document list. |
| 8 | Do nothing if upload event has empty file list | A file input change event with an empty file list does not crash or alter the existing document list. |

## How to Run Tests

```bash
# 1. Install dependencies
npm i

# 2. Navigate to the app directory
cd cs148-app

# 3. Run all unit tests
npm test

# 4. Run with coverage report
npm test -- --coverage
```

## Completion Criteria

- All Jest tests pass locally
- Coverage runs successfully
- Coverage (branch, lines, statements, etc.) reaches 100% threshold for `Uploads.tsx`

