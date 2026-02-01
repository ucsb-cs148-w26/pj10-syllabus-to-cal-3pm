"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import PdfUpload from "../../components/PdfUpload";
import Navbar from "../../components/navbar";
import { toGoogleCalendarCsv, downloadCsv } from "@/lib/csvExport";
import type { CalendarEvent } from "@/types/events";

const SAMPLE_EVENTS: CalendarEvent[] = [
  {
    title: "Midterm Exam",
    start: "2026-02-15T10:00:00.000Z",
    allDay: false,
    description: "Ch 1–5",
  },
  {
    title: "Homework 3 Due",
    start: "2026-02-20T23:59:00.000Z",
    allDay: true,
    description: "Submit on GauchoSpace",
  },
  {
    title: "Final Project Presentation",
    start: "2026-03-10T14:00:00.000Z",
    allDay: false,
    description: "Phelps 3520",
    location: "Phelps 3520",
  },
];

export default function UploadPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendarStatus, setCalendarStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [calendarMessage, setCalendarMessage] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Restore events from localStorage on mount
  useEffect(() => {
    const savedEvents = localStorage.getItem("calendarEvents");
    if (savedEvents) {
      try {
        const parsed = JSON.parse(savedEvents);
        setEvents(parsed);
      } catch (e) {
        console.error("Failed to parse saved events:", e);
      }
    }
  }, []);

  // Handle OAuth callback from Google
  useEffect(() => {
    const authSuccess = searchParams?.get("auth_success");
    const token = searchParams?.get("access_token");
    const error = searchParams?.get("error");

    if (authSuccess === "true" && token) {
      console.log("OAuth success, token received");
      setAccessToken(token);
      window.history.replaceState({}, "", "/has_navbar/upload");
      
      // Restore events from localStorage
      const savedEvents = localStorage.getItem("calendarEvents");
      let eventsToAdd: CalendarEvent[] = [];
      
      if (savedEvents) {
        try {
          eventsToAdd = JSON.parse(savedEvents);
          setEvents(eventsToAdd);
          console.log("Restored events from localStorage:", eventsToAdd.length);
        } catch (e) {
          console.error("Failed to parse saved events:", e);
        }
      }
      
      // Automatically add events if we have any
      if (eventsToAdd.length > 0) {
        console.log("Auto-adding events to calendar...");
        setCalendarMessage("Adding events to Google Calendar...");
        setTimeout(() => {
          handleAddToGoogleCalendarWithToken(token);
        }, 100);
      } else {
        setCalendarMessage("Successfully connected! Load events and they'll be added automatically.");
      }
    } else if (error) {
      setCalendarStatus("error");
      setCalendarMessage(`Authentication failed: ${error}`);
      window.history.replaceState({}, "", "/has_navbar/upload");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Separate function to add events with a token
  async function handleAddToGoogleCalendarWithToken(token: string) {
    const eventsToAdd = events.length > 0 ? events : (() => {
      const saved = localStorage.getItem("calendarEvents");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return [];
        }
      }
      return [];
    })();
    
    if (eventsToAdd.length === 0) {
      return;
    }

    setCalendarStatus("loading");
    setCalendarMessage("Adding events to Google Calendar...");

    try {
      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken: token,
          events: eventsToAdd,
        }),
      });

      const data = await res.json();
      console.log("Calendar API response:", data);

      if (!res.ok) {
        setCalendarStatus("error");
        setCalendarMessage(data.error || "Failed to add events to Google Calendar");
        return;
      }

      setCalendarStatus("ok");
      setCalendarMessage(data.message || `Successfully added ${data.count} event(s) to Google Calendar!`);
    } catch (err) {
      console.error("Error adding events:", err);
      setCalendarStatus("error");
      setCalendarMessage("Failed to add events to Google Calendar");
    }
  }

  function handleLoadSample() {
    setEvents(SAMPLE_EVENTS);
    localStorage.setItem("calendarEvents", JSON.stringify(SAMPLE_EVENTS));
    
    if (accessToken) {
      console.log("Events loaded, auto-adding to calendar...");
      handleAddToGoogleCalendarWithToken(accessToken);
    }
  }

  function handleDownloadCsv() {
    if (events.length === 0) return;
    const csv = toGoogleCalendarCsv(events);
    downloadCsv(csv, "syllabus-events");
  }

  async function handleGoogleCalendarAuth() {
    try {
      const res = await fetch("/api/calendar/auth");
      const data = await res.json();
      
      if (!res.ok || !data.authUrl) {
        setCalendarStatus("error");
        setCalendarMessage(data.error || "Failed to start authentication");
        return;
      }

      window.location.href = data.authUrl;
    } catch (err) {
      setCalendarStatus("error");
      setCalendarMessage("Failed to connect to Google Calendar");
    }
  }

  async function handleAddToGoogleCalendar() {
    if (!accessToken) {
      await handleGoogleCalendarAuth();
      return;
    }

    if (events.length === 0) {
      setCalendarMessage("Please load events first");
      setCalendarStatus("error");
      return;
    }

    await handleAddToGoogleCalendarWithToken(accessToken);
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full p-6">
        <h1 className="text-2xl font-semibold mb-4 text-center">
          Upload your PDF
        </h1>

        <p className="text-gray-600 text-center mb-6">
          Please upload a PDF file to continue.
        </p>

        <PdfUpload />

        <div className="mt-8 space-y-4">
          <h2 className="text-lg font-medium">Calendar Events</h2>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleLoadSample}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50"
            >
              Load sample events
            </button>
            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={events.length === 0}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Download CSV
            </button>
            <button
              type="button"
              onClick={handleAddToGoogleCalendar}
              disabled={calendarStatus === "loading"}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {calendarStatus === "loading"
                ? "Adding…"
                : accessToken && events.length > 0
                ? "Add to Google Calendar"
                : accessToken
                ? "Connect to Google Calendar"
                : "Connect & Add to Google Calendar"}
            </button>
          </div>
          {events.length > 0 && (
            <p className="text-sm text-zinc-600">
              {events.length} event(s) loaded.
            </p>
          )}
          {calendarMessage && (
            <p
              className={`text-sm ${
                calendarStatus === "error" ? "text-red-600" : "text-green-600"
              }`}
            >
              {calendarMessage}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
