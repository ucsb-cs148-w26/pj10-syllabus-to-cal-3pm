import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Calendar } from "../../components/figma-app/components/features/Calendar";
import { describe, test, expect, beforeEach } from "@jest/globals";

// Mock fetch so we don't hit the real API
global.fetch = jest.fn();

describe("Calendar Google Sync Unit Tests", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  test("Shows connect prompt when accessToken is null", () => {
    render(<Calendar accessToken={null} />);

    expect(screen.getByText("Your Schedule")).toBeInTheDocument();
    expect(screen.getByText("Connect your Google account to see and add events")).toBeInTheDocument();
    expect(screen.getByText("Your calendar events will show here")).toBeInTheDocument();
  });

  test("Shows Go to Uploads button when accessToken is null and onGoToUploads provided", async () => {
    const onGoToUploads = jest.fn();
    render(<Calendar accessToken={null} onGoToUploads={onGoToUploads} />);

    const btn = screen.getByRole("button", { name: /Go to Uploads to connect/i });
    expect(btn).toBeInTheDocument();

    await userEvent.click(btn);
    expect(onGoToUploads).toHaveBeenCalledTimes(1);
  });

  test("Shows Google events subtitle when accessToken is present", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, events: [] }),
    });

    render(<Calendar accessToken="fake-token" />);

    expect(screen.getByText("Your Google Calendar events for the selected month")).toBeInTheDocument();
    const addButtons = screen.getAllByRole("button", { name: /Add event/i });
    expect(addButtons.length).toBeGreaterThan(0);
  });

  test("Shows Today button and month navigation", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, events: [] }),
    });

    render(<Calendar accessToken="fake-token" />);

    expect(screen.getByRole("button", { name: /Today/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Previous month/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Next month/i })).toBeInTheDocument();
  });

  test("Shows Month and Week view toggle", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, events: [] }),
    });

    render(<Calendar accessToken="fake-token" />);

    expect(screen.getByRole("button", { name: /^Month$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Week$/i })).toBeInTheDocument();
  });

  test("Fetches events from API when accessToken is present", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, events: [] }),
    });

    render(<Calendar accessToken="fake-token" />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/calendar/events"),
        expect.objectContaining({
          headers: { Authorization: "Bearer fake-token" },
        })
      );
    });
  });
});
