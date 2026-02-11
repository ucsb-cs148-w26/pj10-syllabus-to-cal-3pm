"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PdfUpload from "../../components/PdfUpload";
import { toGoogleCalendarCsv, downloadCsv, getDownloadBaseName } from "@/lib/csvExport";
import type { CalendarEvent } from "@/types/events";

export default function UploadPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <div className="max-w-md w-full p-6 text-center">
            <h1 className="text-2xl font-semibold mb-4">Upload your PDF</h1>
            <p className="text-gray-600">Loading…</p>
          </div>
        </main>
      }
    >
      <UploadPageContent />
    </Suspense>
  );
}

function UploadPageContent() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendarStatus, setCalendarStatus] = useState<
    "idle" | "loading" | "ok" | "error"
  >("idle");
  const [calendarMessage, setCalendarMessage] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [includeLectures, setIncludeLectures] = useState(true);
  const [includeAssignments, setIncludeAssignments] = useState(true);
  const [includeExams, setIncludeExams] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    const saved = localStorage.getItem("calendarEvents");
    if (saved) setEvents(JSON.parse(saved));
  }, []);

  useEffect(() => {
    const authSuccess = searchParams?.get("auth_success");
    const token = searchParams?.get("access_token");
    const error = searchParams?.get("error");

    if (authSuccess === "true" && token) {
      setAccessToken(token);
      window.history.replaceState({}, "", "/upload");
      const saved = localStorage.getItem("calendarEvents");
      if (saved) setEvents(JSON.parse(saved));
      if (saved) handleAddToGoogleCalendarWithToken(token);
      else
        setCalendarMessage(
          "Connected! Upload a PDF and events will be added automatically."
        );
    } else if (error) {
      setCalendarStatus("error");
      setCalendarMessage(`Authentication failed: ${error}`);
      window.history.replaceState({}, "", "/upload");
    }
  }, [searchParams]);

  async function handleSyllabusCsv(allText: string) {
    setCalendarMessage("Processing syllabus with Gemini…");

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: allText,
          includeLectures,
          includeAssignments,
          includeExams,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setCalendarMessage(`❌ ${errorData.error || "Failed to process syllabus"}`);
        return;
      }

      const { csvText } = await res.json();

      const eventsFromCsv: CalendarEvent[] = csvText
        .split("\n")
        .filter((line) => line.trim() !== "")
        .slice(1)
        .map((line) => {
          const [title, start, allDayStr, description, location] = line.split(",");
          return {
            title,
            start,
            allDay: allDayStr.toLowerCase() === "true",
            description,
            location,
          } as CalendarEvent;
        });

      setEvents(eventsFromCsv);
      localStorage.setItem("calendarEvents", JSON.stringify(eventsFromCsv));
      setCalendarMessage(
        `✅ Successfully processed syllabus! ${eventsFromCsv.length} event(s) loaded.`
      );
    } catch (err) {
      console.error(err);
      setCalendarMessage("❌ Error processing syllabus. See console.");
    }
  }

  async function handleAddToGoogleCalendarWithToken(token: string) {
    if (events.length === 0) return;

    setCalendarStatus("loading");
    setCalendarMessage("Adding events to Google Calendar…");

    try {
      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: token, events }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        setCalendarStatus("error");
        setCalendarMessage(`Server error: Invalid response (${res.status})`);
        return;
      }

      if (!res.ok) {
        setCalendarStatus("error");
        setCalendarMessage(data.error || `Failed to add events (${res.status})`);
        return;
      }

      setCalendarStatus("ok");
      setCalendarMessage(
        data.message || `Successfully added ${data.count} event(s) to Google Calendar!`
      );
    } catch (err) {
      console.error(err);
      setCalendarStatus("error");
      setCalendarMessage("Error adding events. See console.");
    }
  }

  async function handleGoogleCalendarAuth() {
    if (accessToken) return;
    try {
      const res = await fetch("/api/calendar/auth");
      const data = await res.json();
      if (!res.ok || !data.authUrl) {
        setCalendarStatus("error");
        setCalendarMessage(data.error || "Failed to start authentication");
        return;
      }
      window.location.href = data.authUrl;
    } catch {
      setCalendarStatus("error");
      setCalendarMessage("Failed to connect to Google Calendar");
    }
  }

  async function handleAddToGoogleCalendar() {
    if (!accessToken) return handleGoogleCalendarAuth();
    if (events.length === 0) {
      setCalendarMessage("Please upload a PDF first.");
      setCalendarStatus("error");
      return;
    }
    await handleAddToGoogleCalendarWithToken(accessToken);
  }

  function handleDownloadCsv() {
    if (events.length === 0) return;
    const csv = toGoogleCalendarCsv(events);
    const baseName = getDownloadBaseName(events);
    downloadCsv(csv, baseName);
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="Centered-div">
        <div className="max-w-md w-full p-6 justify-center">
          <h1 className="text-2xl font-semibold mb-4 text-center">
            Upload your PDF
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Please upload a PDF file to continue.
          </p>

          <div className="mb-6">
            <p className="text-sm font-medium text-zinc-700 mb-3">
              Include in calendar extraction:
            </p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeLectures}
                  onChange={(e) => setIncludeLectures(e.target.checked)}
                  className="rounded border-zinc-300"
                />
                <span className="text-sm text-zinc-700">Lectures</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAssignments}
                  onChange={(e) => setIncludeAssignments(e.target.checked)}
                  className="rounded border-zinc-300"
                />
                <span className="text-sm text-zinc-700">Assignments</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeExams}
                  onChange={(e) => setIncludeExams(e.target.checked)}
                  className="rounded border-zinc-300"
                />
                <span className="text-sm text-zinc-700">Tests/Exams</span>
              </label>
            </div>
          </div>

          <PdfUpload onTextExtracted={handleSyllabusCsv} />
        </div>

        <div className="mt-8 space-y-4">
          <h2 className="text-lg font-medium">Calendar Events</h2>
          <div className="flex flex-wrap gap-3">
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
            <p className="text-sm text-zinc-600">{events.length} event(s) loaded.</p>
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
