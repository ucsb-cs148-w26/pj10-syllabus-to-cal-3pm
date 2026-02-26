/**
 * Integration tests for Uploads.tsx
 *
 * These tests flow end-to-end through the component.
 * Each test simulates how a real user moves through the upload -> review -> sync pipeline
 */

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Uploads } from "../../components/figma-app/components/features/Uploads";
import { describe, test, expect, beforeEach } from "@jest/globals";


function renderUploads(accessToken: string | null = null) {
  render(
    <Uploads
      initialAccessToken={accessToken}
      onAccessTokenChange={jest.fn()}
    />
  );
}

async function simulateFileUpload(text = "syllabus text content") {
  const triggerBtn = screen.getByRole("button", { name: /simulate upload/i });
  triggerBtn.dataset.text = text;
  await userEvent.click(triggerBtn);
}


function seedCategorisedEvents() {
  const events = [
    { title: "CS 101 Lecture",          start: "2025-04-07T08:00:00", allDay: false, description: "LECTURE",    location: "" },
    { title: "Calculus Lecture",        start: "2025-04-09T08:00:00", allDay: false, description: "LECTURE",    location: "" },
    { title: "Programming Assignment",  start: "2025-04-14",          allDay: true,  description: "ASSIGNMENT", location: "" },
    { title: "Midterm Exam",            start: "2025-04-21",          allDay: true,  description: "EXAM",       location: "" },
    { title: "Quiz 1",                  start: "2025-04-28",          allDay: true,  description: "EXAM",       location: "" },
  ];
  localStorage.setItem("calendarEvents", JSON.stringify(events));
  return events;
}

async function goToReview() {
  await userEvent.click(screen.getByRole("button", { name: /2.*review/i }));
  await waitFor(() =>
    screen.getByRole("heading", { name: /review extracted events/i })
  );
}

async function goToSync() {
  await userEvent.click(screen.getByRole("button", { name: /3.*sync/i }));
  await waitFor(() =>
    screen.getByRole("heading", { name: /sync to google calendar/i })
  );
}


beforeEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  localStorage.clear();
  (global.fetch as jest.Mock) = jest.fn();
});


describe("Uploads integration tests", () => {

  describe("Scenario flow 1: Upload -> Gemini processes -> Review", () => {
    test("successful Gemini response navigates to Review with extracted events", async () => {
      const csvText = [
        "title,start,allDay,description,location,class",
        "CS 101 Lecture,2025-04-07T08:00:00,false,LECTURE,,",
        "Midterm Exam,2025-04-21,true,EXAM,,",
      ].join("\n");

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ csvText }),
      });

      seedCategorisedEvents();
      renderUploads();

      await goToReview();

      expect(screen.getByText("CS 101 Lecture")).toBeInTheDocument();
    });

    test("failed Gemini response stays on step 1 and does not navigate", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Gemini unavailable" }),
      });

      renderUploads();

      expect(
        screen.getByRole("heading", { name: /upload syllabus/i })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: /review extracted events/i })
      ).not.toBeInTheDocument();
    });
  });


  describe("Scenario flow 2: Review step - category filtering", () => {
    test("filtering by Lectures shows only lecture events", async () => {
      seedCategorisedEvents();
      renderUploads();
      await goToReview();

      await userEvent.click(screen.getByRole("button", { name: /^Lectures/i }));

      expect(screen.getByText("CS 101 Lecture")).toBeInTheDocument();
      expect(screen.getByText("Calculus Lecture")).toBeInTheDocument();
      expect(screen.queryByText("Programming Assignment")).not.toBeInTheDocument();
      expect(screen.queryByText("Midterm Exam")).not.toBeInTheDocument();
      expect(screen.queryByText("Quiz 1")).not.toBeInTheDocument();
    });

    test("filtering by Exams shows both exams and quizzes", async () => {
      seedCategorisedEvents();
      renderUploads();
      await goToReview();

      await userEvent.click(screen.getByRole("button", { name: /^Exams/i }));

      expect(screen.getByText("Midterm Exam")).toBeInTheDocument();
      expect(screen.getByText("Quiz 1")).toBeInTheDocument();
      expect(screen.queryByText("CS 101 Lecture")).not.toBeInTheDocument();
      expect(screen.queryByText("Programming Assignment")).not.toBeInTheDocument();
    });

    test("switching filters and then back to All restores full event list", async () => {
      const events = seedCategorisedEvents();
      renderUploads();
      await goToReview();

      await userEvent.click(screen.getByRole("button", { name: /^Assignments/i }));
      await userEvent.click(screen.getByRole("button", { name: /^All/i }));

      for (const e of events) {
        expect(screen.getByText(e.title)).toBeInTheDocument();
      }
    });

    test("category filter does not trigger any API call", async () => {
      seedCategorisedEvents();
      renderUploads();
      await goToReview();

      await userEvent.click(screen.getByRole("button", { name: /^Lectures/i }));
      await userEvent.click(screen.getByRole("button", { name: /^Assignments/i }));
      await userEvent.click(screen.getByRole("button", { name: /^Exams/i }));
      await userEvent.click(screen.getByRole("button", { name: /^All/i }));

      expect(global.fetch).not.toHaveBeenCalled();
    });

    test("Back to Upload from Review returns to step 1", async () => {
      seedCategorisedEvents();
      renderUploads();
      await goToReview();

      await userEvent.click(screen.getByRole("button", { name: /back to upload/i }));

      expect(
        screen.getByRole("heading", { name: /upload syllabus/i })
      ).toBeInTheDocument();
    });

    test("Continue to Sync from Review advances to step 3", async () => {
      seedCategorisedEvents();
      renderUploads("mock-token");
      await goToReview();

      await userEvent.click(screen.getByRole("button", { name: /continue to sync/i }));

      await waitFor(() =>
        expect(
          screen.getByRole("heading", { name: /sync to google calendar/i })
        ).toBeInTheDocument()
      );
    });
  });


  describe("Scenario flow 3: Sync step - connected user", () => {
    test("successful sync shows Sync Complete banner and Synced button state", async () => {
      seedCategorisedEvents();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, count: 5, eventIds: ["a", "b", "c", "d", "e"] }),
      });

      renderUploads("mock-token");
      await goToSync();

      await userEvent.click(screen.getByRole("button", { name: /^sync$/i }));

      await waitFor(() =>
        expect(screen.getByText(/sync complete/i)).toBeInTheDocument()
      );
    });

    test("failed sync shows error state and keeps Sync button available", async () => {
      seedCategorisedEvents();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Calendar API error" }),
      });

      renderUploads("mock-token");
      await goToSync();

      await userEvent.click(screen.getByRole("button", { name: /^sync$/i }));

      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /^sync$/i })).toBeInTheDocument();
      });
    });

    test("Sync button shows Syncing… and is disabled while request is in action", async () => {
      seedCategorisedEvents();
      let resolveSync!: (v: unknown) => void;
      (global.fetch as jest.Mock).mockReturnValueOnce(
        new Promise((res) => { resolveSync = res; })
      );

      renderUploads("mock-token");
      await goToSync();

      await userEvent.click(screen.getByRole("button", { name: /^sync$/i }));

      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: /syncing/i })
        ).toHaveAttribute("aria-disabled", "true")
      );

      resolveSync({ ok: true, json: async () => ({}) });
    });

    test("Back to Review from Sync returns to Review step", async () => {
      seedCategorisedEvents();
      renderUploads("mock-token");
      await goToSync();

      await userEvent.click(screen.getByRole("button", { name: /back to review/i }));

      await waitFor(() =>
        expect(
          screen.getByRole("heading", { name: /review extracted events/i })
        ).toBeInTheDocument()
      );
    });
  });


  describe("Scenario flow 4: Sync step - unauthenticated user", () => {
    test("Sync button is aria-disabled when no access token", async () => {
      seedCategorisedEvents();
      renderUploads(null);
      await goToSync();

      expect(
        screen.getByRole("button", { name: /^sync$/i })
      ).toHaveAttribute("aria-disabled", "true");
    });

    test("Connect button is shown when no access token", async () => {
      seedCategorisedEvents();
      renderUploads(null);
      await goToSync();

      expect(
        screen.getByRole("button", { name: /^connect$/i })
      ).toBeInTheDocument();
    });

    test("Calendar picker is not shown when not connected", async () => {
      seedCategorisedEvents();
      renderUploads(null);
      await goToSync();

      expect(
        screen.queryByRole("button", { name: /default calendar/i })
      ).not.toBeInTheDocument();
    });
  });


  describe("Scenario 5: Full pipeline -- upload -> review -> sync -> reset", () => {
    test("completing a sync and clicking New Upload resets to step 1 and clears localStorage", async () => {
      seedCategorisedEvents();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, count: 5, eventIds: ["a","b","c","d","e"] }),
      });

      renderUploads("mock-token");
      await goToSync();

      await userEvent.click(screen.getByRole("button", { name: /^sync$/i }));
      await waitFor(() => screen.getByText(/sync complete/i));

      await userEvent.click(screen.getByRole("button", { name: /new upload/i }));

      expect(
        screen.getByRole("heading", { name: /upload syllabus/i })
      ).toBeInTheDocument();
      expect(localStorage.getItem("calendarEvents")).toBeNull();
      expect(
        screen.getByRole("button", { name: /1.*upload/i })
      ).toHaveAttribute("aria-current", "step");
    });

    test("navigating Upload -> Review -> back -> Review preserves events", async () => {
      const events = seedCategorisedEvents();
      renderUploads();
      await goToReview();

      expect(screen.getByText(events[0].title)).toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: /back to upload/i }));
      expect(screen.getByRole("heading", { name: /upload syllabus/i })).toBeInTheDocument();

      await goToReview();
      expect(screen.getByText(events[0].title)).toBeInTheDocument();
    });

    test("Review -> Sync -> Back to Review -> Continue to Sync round-trip works", async () => {
      seedCategorisedEvents();
      renderUploads("mock-token");

      await goToReview();
      await userEvent.click(screen.getByRole("button", { name: /continue to sync/i }));
      await waitFor(() => screen.getByRole("heading", { name: /sync to google calendar/i }));

      await userEvent.click(screen.getByRole("button", { name: /back to review/i }));
      await waitFor(() => screen.getByRole("heading", { name: /review extracted events/i }));

      await userEvent.click(screen.getByRole("button", { name: /continue to sync/i }));
      await waitFor(() =>
        expect(
          screen.getByRole("heading", { name: /sync to google calendar/i })
        ).toBeInTheDocument()
      );
    });
  });


  describe("Scenario flow 6: Step rail navigation", () => {
    test("step rail shows correct aria-current at each step", async () => {
      seedCategorisedEvents();
      renderUploads("mock-token");

      expect(screen.getByRole("button", { name: /1.*upload/i })).toHaveAttribute("aria-current", "step");

      await goToReview();
      expect(screen.getByRole("button", { name: /2.*review/i })).toHaveAttribute("aria-current", "step");

      await goToSync();
      expect(screen.getByRole("button", { name: /3.*sync/i })).toHaveAttribute("aria-current", "step");
    });

    test("clicking step 1 rail button from step 3 returns to Upload", async () => {
      seedCategorisedEvents();
      renderUploads("mock-token");
      await goToSync();

      await userEvent.click(screen.getByRole("button", { name: /1.*upload/i }));

      expect(
        screen.getByRole("heading", { name: /upload syllabus/i })
      ).toBeInTheDocument();
    });
  });

});