'use client';

import { useEffect, useState } from 'react';
import { FileText, FolderOpen, Sparkles } from 'lucide-react';
import PdfUpload from '@/components/PdfUpload';
import type { CalendarEvent } from '@/lib/googleCalendar';

interface UploadsProps {
  initialAccessToken: string | null;
  onAccessTokenChange: (token: string | null) => void;
}

export function Uploads({ initialAccessToken }: UploadsProps) {
  const [showDocuments, setShowDocuments] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendarStatus, setCalendarStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [calendarMessage, setCalendarMessage] = useState('');
  const [showOverlay, setShowOverlay] = useState(false);
  const [showCheck, setShowCheck] = useState(false);

  const accessToken = initialAccessToken;
  const hasEvents = events.length > 0;
  const isBusy = calendarStatus === 'loading';

  useEffect(() => {
    const saved = localStorage.getItem('calendarEvents');
    if (saved) setEvents(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (calendarStatus === 'loading') {
      setShowOverlay(true);
      setShowCheck(false);
    } else if (calendarStatus === 'ok') {
      setShowCheck(true);
      const timeout = setTimeout(() => {
        setShowOverlay(false);
        setShowCheck(false);
      }, 900);
      return () => clearTimeout(timeout);
    } else {
      setShowOverlay(false);
      setShowCheck(false);
    }
  }, [calendarStatus]);

  async function handleSyllabusText(allText: string) {
    setCalendarStatus('loading');
    setCalendarMessage('Processing syllabus with Gemini...');
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: allText }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setCalendarStatus('error');
        setCalendarMessage(
          `Failed to process syllabus: ${errorData.error || res.statusText}`,
        );
        return;
      }

      const { csvText } = await res.json();
      const eventsFromCsv: CalendarEvent[] = csvText
        .split('\n')
        .filter((line: string) => line.trim() !== '')
        .slice(1)
        .map((line: string) => {
          const [title, start, allDayStr, description, location] = line.split(',');
          return {
            title,
            start,
            allDay: allDayStr?.toLowerCase() === 'true',
            description,
            location,
          } as CalendarEvent;
        });

      setEvents(eventsFromCsv);
      localStorage.setItem('calendarEvents', JSON.stringify(eventsFromCsv));
      setCalendarStatus('ok');
      setCalendarMessage(
        `Successfully processed syllabus! ${eventsFromCsv.length} event(s) detected.`,
      );
    } catch (err) {
      console.error(err);
      setCalendarStatus('error');
      setCalendarMessage('Error processing syllabus. See console.');
    }
  }

  async function handleGoogleCalendarAuth() {
    if (accessToken) return;
    try {
      const res = await fetch('/api/calendar/auth');
      const data = await res.json();
      if (!res.ok || !data.authUrl) {
        setCalendarStatus('error');
        setCalendarMessage(data.error || 'Failed to start authentication');
        return;
      }
      window.location.href = data.authUrl;
    } catch {
      setCalendarStatus('error');
      setCalendarMessage('Failed to connect to Google Calendar');
    }
  }

  async function handleAddToGoogleCalendarWithToken(token: string) {
    if (events.length === 0) return;
    setCalendarStatus('loading');
    setCalendarMessage('Adding events to Google Calendar...');
    try {
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: token, events }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCalendarStatus('error');
        setCalendarMessage(
          data.error || `Failed to add events (${res.status})`,
        );
        return;
      }

      setCalendarStatus('ok');
      setCalendarMessage(
        data.message ||
          `Successfully added ${data.count ?? events.length} event(s) to Google Calendar!`,
      );
    } catch (err) {
      console.error(err);
      setCalendarStatus('error');
      setCalendarMessage('Error adding events. See console.');
    }
  }

  async function handleAddToGoogleCalendar() {
    if (!accessToken) return handleGoogleCalendarAuth();
    if (events.length === 0) {
      setCalendarStatus('error');
      setCalendarMessage('Please upload a syllabus first.');
      return;
    }
    await handleAddToGoogleCalendarWithToken(accessToken);
  }

  async function handleSwitchGoogleAccount() {
    // Clear any existing token and restart the auth flow
    setCalendarStatus('idle');
    setCalendarMessage('');
    await handleGoogleCalendarAuth();
  }

  function handleDownloadCsv() {
    if (events.length === 0) return;
    const header = 'title,start,allDay,description,location';
    const rows = events.map((e) => {
      const esc = (v?: string) => JSON.stringify(v ?? '').slice(1, -1);
      return [
        esc(e.title),
        e.start,
        String(e.allDay),
        esc(e.description),
        esc(e.location ?? ''),
      ].join(',');
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const filename = `syllabus-events-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {showOverlay && (
        <div className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            {!showCheck ? (
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            ) : (
              <span className="h-9 w-9 rounded-full border-2 border-emerald-500 bg-emerald-50 flex items-center justify-center animate-[scale-in_200ms_ease-out]">
                <span className="h-4 w-4 border-b-2 border-r-2 border-emerald-600 rotate-45 translate-y-[-1px]" />
              </span>
            )}
            <p className="text-sm text-gray-700">
              {showCheck ? 'All set!' : 'Working on your syllabus…'}
            </p>
          </div>
        </div>
      )}

      {/* soft background accent */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />

      {/* header with step indicator */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-gray-900 mb-1 flex items-center gap-2">
            Upload Your Syllabuses
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
              <Sparkles className="h-3 w-3" />
              AI Powered
            </span>
          </h2>
          <p className="text-gray-600 max-w-xl">
            Turn raw PDF syllabuses into a clean schedule. Upload, review the
            extracted events, then send them straight to Google Calendar.
          </p>
        </div>

        <div className="flex gap-2 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
              1
            </span>
            <span>Upload PDF</span>
          </div>
          <div className="flex items-center gap-2 opacity-80">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700">
              2
            </span>
            <span>Review Events</span>
          </div>
          <div className="flex items-center gap-2 opacity-80">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700">
              3
            </span>
            <span>Sync Calendar</span>
          </div>
        </div>
      </div>

      {/* upload card */}
      <div className="mb-8">
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-gray-200/80 p-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Upload Syllabus PDF
              </h3>
              <p className="text-sm text-gray-500">
                Drag and drop, or click to upload one or more syllabus PDFs. We
                will extract the important dates for you.
              </p>
            </div>
          </div>
          <PdfUpload onTextExtracted={handleSyllabusText} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* events summary */}
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 text-lg">
              Events Summary
            </h3>
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
              {events.length} event{events.length === 1 ? '' : 's'}
            </span>
          </div>

          {!hasEvents ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 py-6">
              <FileText className="w-8 h-8 mb-2 text-gray-400" />
              <p className="text-sm mb-1">No events yet.</p>
              <p className="text-xs text-gray-400">
                Upload a syllabus above to see extracted deadlines here.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto text-sm">
              {events.slice(0, 10).map((e, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between border-b border-gray-100 last:border-0 py-2"
                >
                  <div className="pr-4">
                    <p className="font-medium text-gray-900 line-clamp-2">
                      {e.title}
                    </p>
                    {e.description && (
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {e.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-xs text-gray-500 whitespace-nowrap">
                    <p>{new Date(e.start).toLocaleString()}</p>
                    <p>{e.allDay ? 'All day' : 'Timed'}</p>
                  </div>
                </div>
              ))}
              {events.length > 10 && (
                <p className="text-xs text-gray-400 mt-1">
                  Showing first 10 events.
                </p>
              )}
            </div>
          )}
        </div>

        {/* calendar actions */}
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 rounded-2xl shadow-md text-white p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-30 mix-blend-soft-light" style={{ backgroundImage: 'radial-gradient(circle at 0 0, #fff 0, transparent 55%), radial-gradient(circle at 100% 100%, #f97316 0, transparent 55%)' }} />
          <div className="relative space-y-4">
            <h3 className="font-semibold text-lg text-center">Calendar Actions</h3>
            <p className="text-sm text-indigo-100 text-center">
              When you are happy with the events, sync them to Google Calendar or
              download them as a CSV snapshot.
            </p>

            <div className="space-y-3 mt-2">
              <button
                type="button"
                onClick={handleAddToGoogleCalendar}
                disabled={calendarStatus === 'loading' || !hasEvents}
                className="w-full inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-70 transition-colors text-center"
              >
                {calendarStatus === 'loading'
                  ? 'Adding to Google Calendar...'
                  : 'Connect Google Calendar'}
              </button>

              <button
                type="button"
                onClick={handleSwitchGoogleAccount}
                className="w-full inline-flex items-center justify-center rounded-xl border border-white/40 bg-white/5 px-4 py-2.5 text-sm font-medium text-indigo-50 hover:bg-white/10 transition-colors text-center"
              >
                Switch Google Account
              </button>

              <button
                type="button"
                onClick={handleDownloadCsv}
                disabled={!hasEvents}
                className="w-full inline-flex items-center justify-center rounded-xl border border-white/40 bg-white/5 px-4 py-2.5 text-sm font-medium text-indigo-50 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 transition-colors text-center"
              >
                Download CSV
              </button>
            </div>
          </div>

          <div className="relative mt-4 min-h-[40px] text-xs text-indigo-100 text-center">
            {calendarMessage && (
              <p
                className={
                  calendarStatus === 'error'
                    ? 'text-rose-100'
                    : 'text-emerald-100'
                }
              >
                {calendarMessage}
              </p>
            )}
            {!calendarMessage && (
              <p className="opacity-80">
                Tip: you can always download the CSV first to double-check
                everything before syncing.
              </p>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowDocuments(!showDocuments)}
        className="w-full bg-white border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
      >
        <FolderOpen className="w-5 h-5" />
        {showDocuments ? 'Hide raw extracted events' : 'Show raw extracted events CSV view'}
      </button>

      {showDocuments && (
        <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-sm text-gray-700 max-h-80 overflow-auto">
          {!hasEvents ? (
            <p className="text-gray-500">
              No events to display. Upload a syllabus first.
            </p>
          ) : (
            <pre className="whitespace-pre-wrap break-words text-xs">
              title,start,allDay,description,location
              {events
                .map(
                  (e) =>
                    `\n${e.title},${e.start},${e.allDay},${e.description ?? ''},${e.location ?? ''}`,
                )
                .join('')}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
