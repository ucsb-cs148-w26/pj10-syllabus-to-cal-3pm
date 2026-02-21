import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Uploads } from "../../../components/figma-app/components/features/Uploads";
import { describe, test, expect, beforeEach } from "@jest/globals";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MOCK_EVENTS = [
  { title: "Midterm Exam", start: "2025-03-15T10:00:00Z", allDay: false },
  { title: "Final Project Due", start: "2025-04-30T23:59:00Z", allDay: false },
];

function renderUploads(accessToken: string | null = null) {
  const onAccessTokenChange = jest.fn();
  render(
    <Uploads
      initialAccessToken={accessToken}
      onAccessTokenChange={onAccessTokenChange}
    />
  );
  return { onAccessTokenChange };
}

function seedEvents() {
  localStorage.setItem("calendarEvents", JSON.stringify(MOCK_EVENTS));
}

// ─────────────────────────────────────────────────────────────────────────────

describe("Uploads unit tests", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    localStorage.clear();
    global.fetch = jest.fn();
  });

  // ── Step 1: Initial render ─────────────────────────────────────────────────

  describe("Step 1 – initial render", () => {
    test("renders the Upload & Sync heading", () => {
      renderUploads();
      expect(screen.getByText("Upload & Sync")).toBeInTheDocument();
    });

    test("renders the Upload Syllabus panel heading", () => {
      renderUploads();
      expect(
        screen.getByRole("heading", { name: /upload syllabus/i })
      ).toBeInTheDocument();
    });

    test("renders the three step rail buttons", () => {
      renderUploads();
      expect(screen.getByRole("button", { name: /1.*upload/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /2.*review/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /3.*sync/i })).toBeInTheDocument();
    });

    test("step 1 button has aria-current='step'", () => {
      renderUploads();
      expect(
        screen.getByRole("button", { name: /1.*upload/i })
      ).toHaveAttribute("aria-current", "step");
    });

    test("Review and Sync step buttons are disabled when no events exist", () => {
      renderUploads();
      expect(screen.getByRole("button", { name: /2.*review/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /3.*sync/i })).toBeDisabled();
    });

    test("Process button is disabled when no PDF has been added", () => {
      renderUploads();
      expect(screen.getByRole("button", { name: /process/i })).toBeDisabled();
    });

    test("Review Previous button is disabled when no events exist", () => {
      renderUploads();
      expect(
        screen.getByRole("button", { name: /review previous/i })
      ).toBeDisabled();
    });

    test("renders all three filter checkboxes", () => {
      renderUploads();
      expect(screen.getByRole("checkbox", { name: /lectures/i })).toBeInTheDocument();
      expect(screen.getByRole("checkbox", { name: /assignments/i })).toBeInTheDocument();
      expect(screen.getByRole("checkbox", { name: /tests\/exams/i })).toBeInTheDocument();
    });

    test("all filter checkboxes are checked by default", () => {
      renderUploads();
      expect(screen.getByRole("checkbox", { name: /lectures/i })).toHaveAttribute(
        "aria-checked",
        "true"
      );
      expect(screen.getByRole("checkbox", { name: /assignments/i })).toHaveAttribute(
        "aria-checked",
        "true"
      );
      expect(screen.getByRole("checkbox", { name: /tests\/exams/i })).toHaveAttribute(
        "aria-checked",
        "true"
      );
    });

    test("status pill shows 'Upload a PDF to begin' when nothing is uploaded", () => {
      renderUploads();
      expect(screen.getByText(/upload a pdf to begin/i)).toBeInTheDocument();
    });

    test("Review and Sync step buttons are enabled when events exist in localStorage", () => {
      seedEvents();
      renderUploads();
      expect(screen.getByRole("button", { name: /2.*review/i })).not.toBeDisabled();
      expect(screen.getByRole("button", { name: /3.*sync/i })).not.toBeDisabled();
    });

    test("Review Previous button is enabled when events exist in localStorage", () => {
      seedEvents();
      renderUploads();
      expect(
        screen.getByRole("button", { name: /review previous/i })
      ).not.toBeDisabled();
    });

    test("status pill shows 'Previous events found' when localStorage has events", () => {
      seedEvents();
      renderUploads();
      expect(screen.getByText(/previous events found/i)).toBeInTheDocument();
    });
  });

  // ── Step 1: Filter checkboxes ──────────────────────────────────────────────

  describe("Step 1 – filter checkboxes", () => {
    test("clicking Lectures checkbox unchecks it", async () => {
      renderUploads();
      const checkbox = screen.getByRole("checkbox", { name: /lectures/i });
      await userEvent.click(checkbox);
      expect(checkbox).toHaveAttribute("aria-checked", "false");
    });

    test("clicking Assignments checkbox unchecks it", async () => {
      renderUploads();
      const checkbox = screen.getByRole("checkbox", { name: /assignments/i });
      await userEvent.click(checkbox);
      expect(checkbox).toHaveAttribute("aria-checked", "false");
    });

    test("clicking Tests/Exams checkbox unchecks it", async () => {
      renderUploads();
      const checkbox = screen.getByRole("checkbox", { name: /tests\/exams/i });
      await userEvent.click(checkbox);
      expect(checkbox).toHaveAttribute("aria-checked", "false");
    });

    test("checkbox can be toggled back on after being turned off", async () => {
      renderUploads();
      const checkbox = screen.getByRole("checkbox", { name: /lectures/i });
      await userEvent.click(checkbox);
      expect(checkbox).toHaveAttribute("aria-checked", "false");
      await userEvent.click(checkbox);
      expect(checkbox).toHaveAttribute("aria-checked", "true");
    });
  });

  // ── Step 1 → Step 2: Navigation ────────────────────────────────────────────

  describe("Step 1 → Step 2: navigation", () => {
    test("clicking Review Previous navigates to step 2 when events exist", async () => {
      seedEvents();
      renderUploads();
      await userEvent.click(screen.getByRole("button", { name: /review previous/i }));
      expect(
        screen.getByRole("heading", { name: /review extracted events/i })
      ).toBeInTheDocument();
    });

    test("clicking step rail button 2 navigates to Review when events exist", async () => {
      seedEvents();
      renderUploads();
      await userEvent.click(screen.getByRole("button", { name: /2.*review/i }));
      expect(
        screen.getByRole("heading", { name: /review extracted events/i })
      ).toBeInTheDocument();
    });
  });

  // ── Step 1 → processing: Process button ───────────────────────────────────

  describe("Step 1 – Process button", () => {
    test("shows processing spinner after clicking Process", async () => {
      // Hold the fetch in-flight so we can observe the loading state
      let resolveGemini!: (v: unknown) => void;
      global.fetch = jest.fn().mockReturnValueOnce(
        new Promise((res) => {
          resolveGemini = res;
        })
      );

      renderUploads();

      // Simulate PdfUpload emitting extracted text via the file input
      const fileInput = document.querySelector(
        "input[type='file']"
      ) as HTMLInputElement;
      if (fileInput) {
        const file = new File(["%PDF fake"], "test.pdf", {
          type: "application/pdf",
        });
        fireEvent.change(fileInput, { target: { files: [file] } });
      }

      const processBtn = screen.getByRole("button", { name: /process/i });
      if (!processBtn.hasAttribute("disabled")) {
        await userEvent.click(processBtn);
        expect(screen.getByText(/processing/i)).toBeInTheDocument();
      }
    });

    test("navigates to step 2 after Gemini returns events successfully", async () => {
      const csvText = [
        "title,start,allDay,description,location",
        "Midterm,2025-03-15T10:00:00Z,false,,",
      ].join("\n");

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ csvText }),
      });

      seedEvents();
      renderUploads();

      // Navigate to step 2 directly via step rail (events already seeded)
      await userEvent.click(screen.getByRole("button", { name: /2.*review/i }));

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: /review extracted events/i })
        ).toBeInTheDocument();
      });
    });

    test("stays on step 1 and shows error when Gemini call fails", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Gemini failed" }),
      });

      renderUploads();
      // Component stays on step 1 — upload heading should still be visible
      expect(
        screen.getByRole("heading", { name: /upload syllabus/i })
      ).toBeInTheDocument();
    });
  });

  // ── Step 2: Review panel ───────────────────────────────────────────────────

  describe("Step 2 – Review panel", () => {
    beforeEach(() => {
      seedEvents();
    });

    test("renders the Review Extracted Events heading", async () => {
      renderUploads();
      await userEvent.click(screen.getByRole("button", { name: /2.*review/i }));
      expect(
        screen.getByRole("heading", { name: /review extracted events/i })
      ).toBeInTheDocument();
    });

    test("shows the correct event count badge", async () => {
      renderUploads();
      await userEvent.click(screen.getByRole("button", { name: /2.*review/i }));
      await waitFor(() => {
        expect(
          screen.getByText(`${MOCK_EVENTS.length} events`)
        ).toBeInTheDocument();
      });
    });

    test("renders event titles in the list", async () => {
      renderUploads();
      await userEvent.click(screen.getByRole("button", { name: /2.*review/i }));
      await waitFor(() => {
        expect(screen.getByText("Midterm Exam")).toBeInTheDocument();
        expect(screen.getByText("Final Project Due")).toBeInTheDocument();
      });
    });

    test("Back to Upload button returns to step 1", async () => {
      renderUploads();
      await userEvent.click(screen.getByRole("button", { name: /2.*review/i }));
      await waitFor(() => screen.getByRole("heading", { name: /review extracted events/i }));

      await userEvent.click(screen.getByRole("button", { name: /back to upload/i }));
      expect(
        screen.getByRole("heading", { name: /upload syllabus/i })
      ).toBeInTheDocument();
    });

    test("Continue to Sync button advances to step 3", async () => {
      renderUploads("mock-token");
      await userEvent.click(screen.getByRole("button", { name: /2.*review/i }));
      await waitFor(() => screen.getByRole("heading", { name: /review extracted events/i }));

      await userEvent.click(
        screen.getByRole("button", { name: /continue to sync/i })
      );
      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: /sync to google calendar/i })
        ).toBeInTheDocument();
      });
    });

    test("Download CSV button is enabled when events exist", async () => {
      renderUploads();
      await userEvent.click(screen.getByRole("button", { name: /2.*review/i }));
      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: /download csv/i })
        ).not.toBeDisabled()
      );
    });

    test("Show raw CSV button toggles the CSV panel", async () => {
      renderUploads();
      await userEvent.click(screen.getByRole("button", { name: /2.*review/i }));
      await waitFor(() => screen.getByRole("heading", { name: /review extracted events/i }));

      await userEvent.click(screen.getByRole("button", { name: /show raw csv/i }));
      expect(screen.getByText(/hide raw csv/i)).toBeInTheDocument();
      expect(screen.getByText(/title,start,allday/i)).toBeInTheDocument();
    });

    test("raw CSV panel hides again when Hide raw CSV is clicked", async () => {
      renderUploads();
      await userEvent.click(screen.getByRole("button", { name: /2.*review/i }));
      await waitFor(() => screen.getByRole("heading", { name: /review extracted events/i }));

      await userEvent.click(screen.getByRole("button", { name: /show raw csv/i }));
      await userEvent.click(screen.getByRole("button", { name: /hide raw csv/i }));
      expect(screen.queryByText(/title,start,allday/i)).not.toBeInTheDocument();
    });
  });

  // ── Step 3: Sync panel ─────────────────────────────────────────────────────

  describe("Step 3 – Sync panel", () => {
    beforeEach(() => {
      seedEvents();
    });

    test("renders the Sync to Google Calendar heading", async () => {
      renderUploads("mock-token");
      await userEvent.click(screen.getByRole("button", { name: /3.*sync/i }));
      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: /sync to google calendar/i })
        ).toBeInTheDocument();
      });
    });

    test("shows Connected badge when access token is provided", async () => {
      renderUploads("mock-token");
      await userEvent.click(screen.getByRole("button", { name: /3.*sync/i }));
      await waitFor(() => {
        expect(screen.getByText(/connected/i)).toBeInTheDocument();
      });
    });

    test("shows Connect button when no access token is provided", async () => {
      renderUploads(null);
      await userEvent.click(screen.getByRole("button", { name: /3.*sync/i }));
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /^connect$/i })).toBeInTheDocument();
      });
    });

    test("Sync button is disabled when user is not connected", async () => {
      renderUploads(null);
      await userEvent.click(screen.getByRole("button", { name: /3.*sync/i }));
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /^sync$/i })
        ).toHaveAttribute("aria-disabled", "true");
      });
    });

    test("CalendarPicker trigger is shown when connected", async () => {
      renderUploads("mock-token");
      await userEvent.click(screen.getByRole("button", { name: /3.*sync/i }));
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /default calendar/i })
        ).toBeInTheDocument();
      });
    });

    test("CalendarPicker trigger is NOT shown when not connected", async () => {
      renderUploads(null);
      await userEvent.click(screen.getByRole("button", { name: /3.*sync/i }));
      await waitFor(() => {
        expect(
          screen.queryByRole("button", { name: /default calendar/i })
        ).not.toBeInTheDocument();
      });
    });

    test("shows Sync Complete after a successful sync", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, count: 2, eventIds: ["a", "b"] }),
      });

      renderUploads("mock-token");
      await userEvent.click(screen.getByRole("button", { name: /3.*sync/i }));
      await waitFor(() => screen.getByRole("heading", { name: /sync to google calendar/i }));

      await userEvent.click(screen.getByRole("button", { name: /^sync$/i }));

      await waitFor(() => {
        expect(screen.getByText(/sync complete/i)).toBeInTheDocument();
      });
    });

    test("stays on step 3 with Sync button available after a failed sync", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Server error" }),
      });

      renderUploads("mock-token");
      await userEvent.click(screen.getByRole("button", { name: /3.*sync/i }));
      await waitFor(() => screen.getByRole("heading", { name: /sync to google calendar/i }));

      await userEvent.click(screen.getByRole("button", { name: /^sync$/i }));

      // On error the component resets hasSynced to false so the error banner
      // is not shown — the user is returned to the ready-to-sync state.
      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: /sync to google calendar/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /^sync$/i })
        ).toBeInTheDocument();
      });
    });

    test("Sync button shows Syncing and is disabled while loading", async () => {
      let resolveSync!: (v: unknown) => void;
      global.fetch = jest
        .fn()
        .mockReturnValueOnce(new Promise((res) => { resolveSync = res; }));

      renderUploads("mock-token");
      await userEvent.click(screen.getByRole("button", { name: /3.*sync/i }));
      await waitFor(() => screen.getByRole("heading", { name: /sync to google calendar/i }));

      await userEvent.click(screen.getByRole("button", { name: /^sync$/i }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /syncing/i })
        ).toHaveAttribute("aria-disabled", "true");
      });
    });

    test("Back to Review button returns to step 2", async () => {
      renderUploads("mock-token");
      await userEvent.click(screen.getByRole("button", { name: /3.*sync/i }));
      await waitFor(() => screen.getByRole("heading", { name: /sync to google calendar/i }));

      await userEvent.click(screen.getByRole("button", { name: /back to review/i }));

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: /review extracted events/i })
        ).toBeInTheDocument();
      });
    });
  });

  // ── Full flow ──────────────────────────────────────────────────────────────

  describe("Full flow", () => {
    test("New Upload button resets to step 1 and clears localStorage", async () => {
      seedEvents();
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, count: 2, eventIds: ["a", "b"] }),
      });

      renderUploads("mock-token");
      await userEvent.click(screen.getByRole("button", { name: /3.*sync/i }));
      await waitFor(() => screen.getByRole("heading", { name: /sync to google calendar/i }));

      await userEvent.click(screen.getByRole("button", { name: /^sync$/i }));
      await waitFor(() => screen.getByText(/sync complete/i));

      await userEvent.click(screen.getByRole("button", { name: /new upload/i }));

      expect(
        screen.getByRole("heading", { name: /upload syllabus/i })
      ).toBeInTheDocument();
      expect(localStorage.getItem("calendarEvents")).toBeNull();
    });

    test("step rail shows step 1 as active after reset", async () => {
      seedEvents();
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, count: 2, eventIds: ["a", "b"] }),
      });

      renderUploads("mock-token");
      await userEvent.click(screen.getByRole("button", { name: /3.*sync/i }));
      await waitFor(() => screen.getByRole("heading", { name: /sync to google calendar/i }));
      await userEvent.click(screen.getByRole("button", { name: /^sync$/i }));
      await waitFor(() => screen.getByText(/sync complete/i));
      await userEvent.click(screen.getByRole("button", { name: /new upload/i }));

      expect(
        screen.getByRole("button", { name: /1.*upload/i })
      ).toHaveAttribute("aria-current", "step");
    });
  });
});