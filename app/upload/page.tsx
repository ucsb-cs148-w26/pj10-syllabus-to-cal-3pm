"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PdfUpload from "@/components/PdfUpload";
import type { CalendarEvent } from "@/lib/googleCalendar";
import { saveAs } from "file-saver";

type UploadedFile = { filename: string; url: string; size?: number; uploadedAt?: string };

function UploadPageContent() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendarStatus, setCalendarStatus] = useState<
    "idle" | "loading" | "ok" | "error"
  >("idle");
  const [calendarMessage, setCalendarMessage] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadsLoading, setUploadsLoading] = useState(false);
  const [uploadsError, setUploadsError] = useState<string | null>(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    const saved = localStorage.getItem("calendarEvents");
    if (saved) setEvents(JSON.parse(saved));
  }, []);

  useEffect(() => {
    // Keep a server-backed list of uploads so deletions stay consistent.
    void (async () => {
      try {
        setUploadsLoading(true);
        setUploadsError(null);
        const res = await fetch("/api/upload", { method: "GET" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) {
          setUploadsError(data?.error || "Failed to load uploads");
          return;
        }
        setUploadedFiles((data.files ?? []) as UploadedFile[]);
      } catch {
        setUploadsError("Failed to load uploads");
      } finally {
        setUploadsLoading(false);
      }
    })();
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
      if (saved) void handleAddToGoogleCalendarWithToken(token);
      else
        setCalendarMessage(
          "Connected! Upload a PDF and events will be added automatically."
        );
    } else if (error) {
      setCalendarStatus("error");
      setCalendarMessage(`Authentication failed: ${error}`);
      window.history.replaceState({}, "", "/upload");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function handleDeleteUploadedFile(filename: string) {
    // Optimistic UI on just the targeted file, with rollback on failure.
    const snapshot = uploadedFiles;
    setUploadedFiles((prev) => prev.filter((f) => f.filename !== filename));

    try {
      const res = await fetch(
        `/api/upload?filename=${encodeURIComponent(filename)}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setUploadedFiles(snapshot);
        setUploadsError(data?.error || "Failed to delete file");
      }
    } catch {
      setUploadedFiles(snapshot);
      setUploadsError("Failed to delete file");
    }
  }

  async function handleSyllabusText(allText: string, uploaded?: { filename: string; url: string }[]) {
    setCalendarMessage("Processing syllabus with Gemini...");

    if (uploaded?.length) {
      // Add newly uploaded files to the top without nuking the rest.
      setUploadedFiles((prev) => {
        const dedup = new Map<string, UploadedFile>();
        for (const f of uploaded) dedup.set(f.filename, f);
        for (const f of prev) if (!dedup.has(f.filename)) dedup.set(f.filename, f);
        return Array.from(dedup.values());
      });
    }

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: allText }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setCalendarMessage(
          `Failed to process syllabus: ${errorData.error || res.statusText}`
        );
        setCalendarStatus("error");
        return;
      }

      const { csvText } = await res.json();

      const eventsFromCsv: CalendarEvent[] = csvText
        .split("\n")
        .filter((line: string) => line.trim() !== "")
        .slice(1)
        .map((line: string) => {
          const [title, start, allDayStr, description, location] = line.split(",");
          return {
            title,
            start,
            allDay: allDayStr?.toLowerCase() === "true",
            description,
            location,
          } as CalendarEvent;
        });

      setEvents(eventsFromCsv);
      localStorage.setItem("calendarEvents", JSON.stringify(eventsFromCsv));
      setCalendarStatus("ok");
      setCalendarMessage(
        `Successfully processed syllabus! ${eventsFromCsv.length} event(s) loaded.`
      );
    } catch (err) {
      console.error(err);
      setCalendarStatus("error");
      setCalendarMessage("Error processing syllabus. See console.");
    }
  }

  async function handleAddToGoogleCalendarWithToken(token: string) {
    if (events.length === 0) return;

    setCalendarStatus("loading");
    setCalendarMessage("Adding events to Google Calendar...");
    try {
      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: token, events }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setCalendarStatus("error");
        setCalendarMessage(
          data.error || `Failed to add events (${res.status})`
        );
        return;
      }

      setCalendarStatus("ok");
      setCalendarMessage(
        data.message ||
          `Successfully added ${data.count ?? events.length} event(s) to Google Calendar!`
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
        setCalendarMessage(
          data.error || "Failed to start authentication"
        );
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
    const header = "title,start,allDay,description,location";
    const rows = events.map((e) => {
      const esc = (v?: string) =>
        JSON.stringify(v ?? "").slice(1, -1); // minimal CSV-safe escaping
      return [
        esc(e.title),
        e.start,
        String(e.allDay),
        esc(e.description),
        esc(e.location ?? ""),
      ].join(",");
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const filename = `syllabus-events-${new Date().toISOString().slice(0, 10)}.csv`;
    saveAs(blob, filename);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold">Upload your syllabus PDF</h1>
          <p className="text-sm text-slate-600">
            Upload a PDF file, we will extract the important dates and
            optionally add them to your Google Calendar.
          </p>
        </div>

        <PdfUpload onTextExtracted={handleSyllabusText} />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Uploaded files</h2>
            <span className="text-xs text-slate-500">
              {uploadsLoading ? "Loading..." : `${uploadedFiles.length} file(s)`}
            </span>
          </div>

          {uploadsError && (
            <p className="text-sm text-red-600">{uploadsError}</p>
          )}

          <div className="rounded-xl border border-slate-200 bg-white">
            {uploadedFiles.length === 0 && !uploadsLoading ? (
              <div className="p-4 text-sm text-slate-600">No uploads yet.</div>
            ) : (
              <ul className="divide-y divide-slate-200">
                {uploadedFiles.map((f) => (
                  <li key={f.filename} className="p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {f.filename}
                      </p>
                      {f.uploadedAt && (
                        <p className="text-xs text-slate-500">
                          {new Date(f.uploadedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs underline text-slate-700 hover:text-slate-900"
                      >
                        Open
                      </a>
                      <button
                        type="button"
                        onClick={() => void handleDeleteUploadedFile(f.filename)}
                        className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-medium">Calendar actions</h2>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={events.length === 0}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
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
                ? "Adding..."
                : accessToken && events.length > 0
                ? "Add to Google Calendar"
                : accessToken
                ? "Connect to Google Calendar"
                : "Connect & Add to Google Calendar"}
            </button>
          </div>

          {events.length > 0 && (
            <p className="text-sm text-slate-600">
              {events.length} event(s) loaded.
            </p>
          )}
          {calendarMessage && (
            <p
              className={`text-sm ${
                calendarStatus === "error"
                  ? "text-red-600"
                  : "text-green-600"
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

export default function UploadPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <p>Loading upload page...</p>
        </main>
      }
    >
      <UploadPageContent />
    </Suspense>
  );
}
