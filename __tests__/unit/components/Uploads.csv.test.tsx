import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Uploads } from "../../../components/figma-app/components/features/Uploads";

// Helper functions

let capturedBlob: Blob | null = null;

function mockDownloadInfra() {
  capturedBlob = null;
  (global.URL as unknown as Record<string, jest.Mock>).createObjectURL =
    jest.fn((blob: Blob) => {
      capturedBlob = blob;
      return "blob:mock";
    });
  (global.URL as unknown as Record<string, jest.Mock>).revokeObjectURL =
    jest.fn();
  jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
}

function readCapturedCsv(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!capturedBlob) return reject(new Error("No CSV blob was captured"));
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(capturedBlob);
  });
}

function parseCsvRows(csv: string) {
  const lines = csv.trim().split("\n");
  const header = lines[0];
  const rows = lines.slice(1).map((line) =>
    line.split(",").map((cell) => cell.replace(/^"|"$/g, ""))
  );
  return { header, rows };
}

function minutesBetween(row: string[]) {
  const start = new Date(`${row[1]} ${row[2]}`);
  const end = new Date(`${row[3]} ${row[4]}`);
  return (end.getTime() - start.getTime()) / 60_000;
}

function seedEvents(events: Record<string, unknown>[]) {
  localStorage.setItem("calendarEvents", JSON.stringify(events));
}

function renderUploads() {
  render(
    <Uploads initialAccessToken={null} onAccessTokenChange={jest.fn()} />
  );
}

async function goToReviewAndDownload() {
  const reviewBtn = screen.getByRole("button", { name: /2.*review/i });
  await waitFor(() => expect(reviewBtn).not.toBeDisabled());
  await userEvent.click(reviewBtn);
  await waitFor(() =>
    expect(
      screen.getByRole("heading", { name: /review extracted events/i })
    ).toBeInTheDocument()
  );
  const dlBtn = screen.getByRole("button", { name: /download csv/i });
  await waitFor(() => expect(dlBtn).not.toBeDisabled());
  await userEvent.click(dlBtn);
}

// Tests

describe("handleDownloadCsv", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    localStorage.clear();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ connected: false }),
    }) as unknown as typeof fetch;
    mockDownloadInfra();
  });

  // Standard tests

  test("produces the correct Google-import CSV header", async () => {
    seedEvents([
      { title: "CS 101", start: "2026-01-05T09:00:00", end: "2026-01-05T09:50:00", allDay: false },
    ]);
    renderUploads();
    await goToReviewAndDownload();

    const { header } = parseCsvRows(await readCapturedCsv());
    expect(header).toBe(
      "Subject,Start Date,Start Time,End Date,End Time,All Day Event,Description,Location,Private"
    );
  });

  test("exports a timed event with explicit start and end", async () => {
    seedEvents([
      { title: "CS 101", start: "2026-01-05T09:00:00", end: "2026-01-05T09:50:00", allDay: false },
    ]);
    renderUploads();
    await goToReviewAndDownload();

    const { rows } = parseCsvRows(await readCapturedCsv());
    expect(rows).toHaveLength(1);
    expect(rows[0][0]).toBe("CS 101");
    expect(rows[0][5]).toBe("False");
    expect(minutesBetween(rows[0])).toBe(50);
  });

  test("exports an all-day event with empty times", async () => {
    seedEvents([{ title: "Midterm", start: "2026-02-15", allDay: true }]);
    renderUploads();
    await goToReviewAndDownload();

    const { rows } = parseCsvRows(await readCapturedCsv());
    expect(rows).toHaveLength(1);
    expect(rows[0][2]).toBe("");
    expect(rows[0][4]).toBe("");
    expect(rows[0][5]).toBe("True");
    expect(rows[0][1]).toBe(rows[0][3]);
  });

  // M/W/F infer end time tests

  test("guesses 50-minute end for a MWF course missing end times", async () => {
    seedEvents([
      { title: "CS 111 Lecture", start: "2026-01-05T09:00:00", allDay: false }, // Monday
      { title: "CS 111 Lecture", start: "2026-01-07T09:00:00", allDay: false }, // Wednesday
      { title: "CS 111 Lecture", start: "2026-01-09T09:00:00", allDay: false }, // Friday
    ]);
    renderUploads();
    await goToReviewAndDownload();

    const { rows } = parseCsvRows(await readCapturedCsv());
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(minutesBetween(row)).toBe(50);
    }
  });

  // Tuesday/Thursday infer end time tests

  test("guesses 75-minute end for a TTh course missing end times", async () => {
    seedEvents([
      { title: "MATH 108A", start: "2026-01-06T11:00:00", allDay: false }, // Tuesday
      { title: "MATH 108A", start: "2026-01-08T11:00:00", allDay: false }, // Thursday
    ]);
    renderUploads();
    await goToReviewAndDownload();

    const { rows } = parseCsvRows(await readCapturedCsv());
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(minutesBetween(row)).toBe(75);
    }
  });

  // Mixed infer end time tests

  test("uses explicit end instead of guessing when present", async () => {
    seedEvents([
      { title: "CS 111 Lecture", start: "2026-01-05T09:00:00", end: "2026-01-05T10:30:00", allDay: false },
      { title: "CS 111 Lecture", start: "2026-01-07T09:00:00", allDay: false },
      { title: "CS 111 Lecture", start: "2026-01-09T09:00:00", allDay: false },
    ]);
    renderUploads();
    await goToReviewAndDownload();

    const { rows } = parseCsvRows(await readCapturedCsv());
    expect(rows).toHaveLength(3);
    expect(minutesBetween(rows[0])).toBe(90);
    expect(minutesBetween(rows[1])).toBe(50);
    expect(minutesBetween(rows[2])).toBe(50);
  });

  // Edge case tests

  test("skips timed event when course meets only 1 day and end is missing", async () => {
    seedEvents([
      { title: "Seminar", start: "2026-01-05T14:00:00", allDay: false },
    ]);
    renderUploads();
    await goToReviewAndDownload();

    const { rows } = parseCsvRows(await readCapturedCsv());
    expect(rows).toHaveLength(0);
  });

  test("skips timed event when course meets 4+ days and end is missing", async () => {
    seedEvents([
      { title: "Daily Lab", start: "2026-01-05T08:00:00", allDay: false }, // Monday
      { title: "Daily Lab", start: "2026-01-06T08:00:00", allDay: false }, // Tuesday
      { title: "Daily Lab", start: "2026-01-07T08:00:00", allDay: false }, // Wednesday
      { title: "Daily Lab", start: "2026-01-08T08:00:00", allDay: false }, // Thursday
    ]);
    renderUploads();
    await goToReviewAndDownload();

    const { rows } = parseCsvRows(await readCapturedCsv());
    expect(rows).toHaveLength(0);
  });

  test("skips event with invalid start date", async () => {
    seedEvents([
      { title: "Bad Event", start: "not-a-date", allDay: false },
    ]);
    renderUploads();
    await goToReviewAndDownload();

    const { rows } = parseCsvRows(await readCapturedCsv());
    expect(rows).toHaveLength(0);
  });

  test("mixed all-day and timed events export correctly together", async () => {
    seedEvents([
      { title: "CS 111 Lecture", start: "2026-01-05T09:00:00", allDay: false }, // Monday
      { title: "CS 111 Lecture", start: "2026-01-07T09:00:00", allDay: false }, // Wednesday
      { title: "CS 111 Lecture", start: "2026-01-09T09:00:00", allDay: false }, // Friday
      { title: "Midterm", start: "2026-01-20", allDay: true },
    ]);
    renderUploads();
    await goToReviewAndDownload();

    const { rows } = parseCsvRows(await readCapturedCsv());
    expect(rows).toHaveLength(4);
    expect(minutesBetween(rows[0])).toBe(50);
    const allDayRow = rows.find((r) => r[5] === "True")!;
    expect(allDayRow).toBeDefined();
    expect(allDayRow[0]).toBe("Midterm");
    expect(allDayRow[2]).toBe("");
  });
});
