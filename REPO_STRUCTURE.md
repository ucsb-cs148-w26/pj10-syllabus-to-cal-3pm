# Repository Structure — Syllabus-to-Calendar

## Top-Level Files

| File | Description |
|------|-------------|
| `package.json` | Node.js dependencies and scripts (`dev`, `build`, `start`, `lint`) |
| `package-lock.json` | Locked dependency versions |
| `tsconfig.json` | TypeScript compiler configuration |
| `tailwind.config.ts` | Tailwind CSS theme and plugin config |
| `postcss.config.mjs` | PostCSS config (used by Tailwind) |
| `eslint.config.mjs` | ESLint linting rules |
| `README.md` | Project overview and setup instructions |
| `LICENSE.md` | Project license |
| `.gitignore` | Files/dirs excluded from git |

---

## `app/` — Next.js App Router (Pages + API Routes)

The main application. Next.js uses file-based routing — each `page.tsx` becomes a URL, each `route.ts` becomes an API endpoint.

| Path | Description |
|------|-------------|
| `app/page.tsx` | Landing page (`/`) |
| `app/layout.tsx` | Root layout (wraps all pages with shared HTML/providers) |
| `app/globals.css` | Global CSS styles (Tailwind base + custom) |
| `app/favicon.ico` | Browser tab icon |
| `app/opengraph-image.png` | Social media preview image |
| `app/twitter-image.png` | Twitter card preview image |

### `app/api/` — Backend API Routes

| Path | Description |
|------|-------------|
| `app/api/gemini/route.ts` | **Gemini AI endpoint** — receives syllabus text, sends to Gemini API, returns CSV of extracted events. **This is the file with the prompt to update.** |
| `app/api/upload/route.ts` | File upload endpoint — handles PDF upload to Vercel Blob storage (POST), listing files (GET), and deleting files (DELETE) |
| `app/api/calendar/auth/route.ts` | Google OAuth — generates the authorization URL for Google Calendar access |
| `app/api/calendar/events/route.ts` | Google Calendar event creation — receives events + access token, creates events via Google Calendar API |
| `app/api/callback/route.ts` | OAuth callback handler — processes the redirect after Google login |

### `app/auth/` — Authentication Pages

| Path | Description |
|------|-------------|
| `app/auth/login/page.tsx` | Login page |
| `app/auth/sign-up/page.tsx` | Sign-up page |
| `app/auth/sign-up-success/page.tsx` | Post-sign-up confirmation page |
| `app/auth/forgot-password/page.tsx` | Password reset request page |
| `app/auth/update-password/page.tsx` | Password update form (from reset link) |
| `app/auth/error/page.tsx` | Auth error display page |
| `app/auth/confirm/route.ts` | Email confirmation handler |

### `app/protected/` — Authenticated Pages

| Path | Description |
|------|-------------|
| `app/protected/page.tsx` | Main protected page (requires login) |
| `app/protected/layout.tsx` | Layout for protected routes |
| `app/protected/protected-gate.tsx` | Auth gate component — redirects unauthenticated users |

### `app/upload/` — Upload Page

| Path | Description |
|------|-------------|
| `app/upload/page.tsx` | Standalone upload page |

---

## `components/` — React Components

### Root-level Components

| Path | Description |
|------|-------------|
| `components/PdfUpload.tsx` | PDF upload component — drag-and-drop file picker, uses `unpdf` to extract text from PDFs |
| `components/auth-button.tsx` | Login/logout toggle button |
| `components/login-form.tsx` | Login form (email + password) |
| `components/sign-up-form.tsx` | Sign-up form |
| `components/forgot-password-form.tsx` | Forgot password form |
| `components/update-password-form.tsx` | Password update form |
| `components/logout-button.tsx` | Logout button |
| `components/theme-switcher.tsx` | Light/dark theme toggle |

### `components/ui/` — Shared UI Primitives (root-level)

| Path | Description |
|------|-------------|
| `components/ui/button.tsx` | Button component |
| `components/ui/card.tsx` | Card component |
| `components/ui/input.tsx` | Text input component |
| `components/ui/label.tsx` | Form label component |
| `components/ui/badge.tsx` | Badge/tag component |
| `components/ui/checkbox.tsx` | Checkbox component |
| `components/ui/dropdown-menu.tsx` | Dropdown menu component |

### `components/figma-app/` — Main App Shell

| Path | Description |
|------|-------------|
| `components/figma-app/FigmaApp.tsx` | Top-level app shell — sidebar navigation + page routing between features |

### `components/figma-app/components/features/` — Feature Pages

| Path | Description |
|------|-------------|
| `features/Uploads.tsx` | **Main upload & processing page** — handles PDF upload, calls Gemini API, parses CSV response into calendar events, stores in localStorage. Contains the CSV parsing logic (currently 5-column). |
| `features/Uploads.js` | Legacy JS version of the uploads page |
| `features/Calendar.tsx` | Calendar view — displays extracted events, handles Google Calendar sync |
| `features/Landing.tsx` | In-app landing/home page |
| `features/StudyPlan.tsx` | Study plan feature page |
| `features/Profile.tsx` | User profile page |

### `components/figma-app/components/ui/` — shadcn/ui Component Library

A large set of pre-built UI components (accordion, alert, avatar, badge, breadcrumb, button, calendar widget, card, carousel, chart, checkbox, collapsible, command palette, context menu, dialog, drawer, dropdown, form, hover card, input, label, menubar, navigation menu, pagination, popover, progress bar, radio group, resizable panels, scroll area, select, separator, sheet, sidebar, skeleton loader, slider, sonner toasts, switch, table, tabs, textarea, toggle, tooltip, and mobile hook/utils).

### `components/figma-app/components/figma/`

| Path | Description |
|------|-------------|
| `figma/ImageWithFallback.tsx` | Image component with fallback for broken images |

---

## `lib/` — Utility Libraries

| Path | Description |
|------|-------------|
| `lib/googleCalendar.ts` | Google Calendar API wrapper — creates calendar events using `googleapis` |
| `lib/googleCalendar.d.ts` | TypeScript type declarations for `CalendarEvent` interface |
| `lib/fileValidation.ts` | File validation utilities (file type, size checks) |
| `lib/utils.ts` | General utility functions (e.g., `cn()` for Tailwind class merging) |
| `lib/supabase/client.ts` | Supabase client-side browser client |
| `lib/supabase/server.ts` | Supabase server-side client |
| `lib/supabase/proxy.ts` | Supabase proxy helper |

---

## `code/` — Legacy / Auxiliary Scripts

| Path | Description |
|------|-------------|
| `code/train-scripts/pdfsToTxtFile.py` | Python script — extracts text from PDFs in a `./data` folder using PyMuPDF |
| `code/train-scripts/manualCreateTrainData.py` | Python script — creates SpaCy NER training data with labels (ASSIGNMENT, ASSESSMENT, LECTURE, SECTION) |
| `code/uploader/` | Alternative uploader sub-app (contains its own API routes for auth, calendar, events) — appears to be an earlier prototype |

---

## `team/` — Team Documentation

| Path | Description |
|------|-------------|
| `team/AGREEMENTS.md` | Team working agreements |
| `team/AI_CODING.md` | AI coding experiment log (documents AI tool usage) |
| `team/LEADERSHIP.md` | Team leadership roles |
| `team/LEARNING.md` | Learning goals and reflections |
| `team/NORMS.md` | Team norms and communication standards |
| `team/TESTING.md` | Testing plan (currently empty) |
| `team/MVP_DEMO.md` | MVP demo notes |
| `team/MVP_FOLLOWUP.md` | Post-MVP follow-up action items |
| `team/problem_scenario.md` | Problem scenario / user story document |
| `team/user_journey.md` | User journey map |
| `team/retrospectives/RETRO_01.md` | Sprint 1 retrospective |
| `team/retrospectives/retro_format.md` | Retrospective format template |
| `team/Lucy.md`, `Wilson.md`, `matthew.md`, `nataly.md`, `rocky.md`, `saeed.md`, `timothy.md` | Individual team member pages |

---

## `meetings/` — Sprint Meeting Notes

| Path | Description |
|------|-------------|
| `meetings/sprint01/lab01.md` through `lect06.md` | Sprint 1 lab and lecture meeting notes |
| `meetings/sprint02/lab05.md`, `lect07.md`, `lect09.md`, `lect10.md` | Sprint 2 meeting notes |

---

## Key Data Flow (How Syllabus Processing Works)

```
PDF file
  → components/PdfUpload.tsx        (extract text via unpdf)
  → app/api/gemini/route.ts         (send text to Gemini, get CSV back)
  → components/.../Uploads.tsx      (parse CSV into CalendarEvent objects)
  → components/.../Calendar.tsx     (display events)
  → app/api/calendar/events/route.ts (sync to Google Calendar)
```
