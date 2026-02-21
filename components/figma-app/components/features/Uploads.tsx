'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FileText,
  FolderOpen,
  Sparkles,
  CalendarCheck,
  Trash2,
  User,
  ChevronDown,
  Check,
} from 'lucide-react';
import PdfUpload from '@/components/PdfUpload';
import { Checkbox } from '@/components/ui/checkbox';
import type { CalendarEvent } from '@/lib/googleCalendar';


interface UploadsProps {
  initialAccessToken: string | null;
  onAccessTokenChange: (token: string | null) => void;
}

type UploadStep = 1 | 2 | 3 | 'processing';
type UploadedFileMeta = { filename: string; url: string };

interface GoogleCalendarMeta {
  id: string;
  summary: string;
  primary: boolean;
  backgroundColor: string;
}


function StepRail({
  step,
  hasEvents,
  onStepClick,
  isSynced,
}: {
  step: UploadStep;
  hasEvents: boolean;
  onStepClick: (n: 1 | 2 | 3) => void;
  isSynced: boolean;
}) {
  const active = step === 'processing' ? 1 : step;

  const items: Array<{ n: 1 | 2 | 3; label: string }> = [
    { n: 1, label: 'Upload' },
    { n: 2, label: 'Review' },
    { n: 3, label: 'Sync' },
  ];

  const canGo = (n: 1 | 2 | 3) => {
    if (n === 1) return true;
    return hasEvents;
  };

  const anchorPct = active === 1 ? 16.667 : active === 2 ? 50 : 83.333;
  const progressPct = isSynced ? 100 : step === 'processing' ? (16.667 + 50) / 2 : anchorPct;

  return (
    <div className="mt-5">
      <div className="relative h-2 rounded-full bg-gray-200/70 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-indigo-600 transition-all duration-700 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="mt-3 inline-flex w-full overflow-hidden rounded-xl border border-gray-200 bg-white/70">
        {items.map((it) => {
          const isActive = active === it.n;
          const clickable = canGo(it.n);

          return (
            <button
              key={it.n}
              type="button"
              disabled={!clickable}
              onClick={() => onStepClick(it.n)}
              className={
                'flex-1 px-3 py-2 text-xs font-semibold transition-colors ' +
                (isActive ? 'bg-white text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-white/60') +
                (!clickable ? ' opacity-40 cursor-not-allowed' : '')
              }
              aria-current={isActive ? 'step' : undefined}
            >
              <span className="inline-flex items-center justify-center gap-2">
                <span
                  className={
                    'inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] ' +
                    (isActive ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600')
                  }
                >
                  {it.n}
                </span>
                {it.label}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-xs text-gray-500">
        {isSynced
          ? 'Done — events are in your calendar.'
          : step === 'processing'
            ? 'Processing your syllabus…'
            : active === 1
              ? 'Upload a syllabus PDF to begin.'
              : active === 2
                ? 'Review the extracted events.'
                : 'Connect and sync to Google Calendar.'}
      </p>
    </div>
  );
}


function CalendarPicker({
  accessToken,
  selectedCalendarId,
  onSelect,
}: {
  accessToken: string;
  selectedCalendarId: string;
  onSelect: (id: string, summary: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [calendars, setCalendars] = useState<GoogleCalendarMeta[]>([]);
  const [fetchStatus, setFetchStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  async function fetchCalendars() {
    if (fetchStatus === 'ok' || fetchStatus === 'loading') return;
    setFetchStatus('loading');
    try {
      const res = await fetch('/api/calendar/calendars', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch calendars');
      setCalendars(data.calendars as GoogleCalendarMeta[]);
      setFetchStatus('ok');
    } catch (err) {
      console.error('[CalendarPicker]', err);
      setFetchStatus('error');
    }
  }

  function handleToggle() {
    if (!open) fetchCalendars();
    setOpen((o) => !o);
  }

  const selectedCalendar = calendars.find((c) => c.id === selectedCalendarId);
  const displayLabel = selectedCalendar
    ? selectedCalendar.summary
    : selectedCalendarId === 'primary'
      ? 'Default calendar'
      : 'Select calendar';

  const displayColor = selectedCalendar?.backgroundColor ?? '#4285f4';

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={handleToggle}
        className={
          'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ' +
          (open
            ? 'border-indigo-300 bg-indigo-50 text-indigo-800 shadow-sm'
            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300')
        }
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {/* Colour swatch */}
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: displayColor }}
        />
        <span className="max-w-[160px] truncate">{displayLabel}</span>
        <ChevronDown
          className={
            'h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-200 ' +
            (open ? 'rotate-180' : '')
          }
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 min-w-[220px] max-w-[300px] origin-top-left animate-[fadeInUp_150ms_ease-out] rounded-xl border border-gray-200 bg-white shadow-lg ring-1 ring-black/5">
          {fetchStatus === 'loading' && (
            <div className="flex items-center gap-2 px-4 py-3 text-xs text-gray-500">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              Loading calendars…
            </div>
          )}

          {fetchStatus === 'error' && (
            <div className="px-4 py-3 text-xs text-rose-600">
              Could not load calendars. Try again.
            </div>
          )}

          {fetchStatus === 'ok' && calendars.length === 0 && (
            <div className="px-4 py-3 text-xs text-gray-500">No writable calendars found.</div>
          )}

          {fetchStatus === 'ok' && calendars.length > 0 && (
            <ul
              role="listbox"
              aria-label="Choose a Google Calendar"
              className="max-h-60 overflow-y-auto py-1"
            >
              {calendars.map((cal) => {
                const isSelected = cal.id === selectedCalendarId;
                return (
                  <li
                    key={cal.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onSelect(cal.id, cal.summary);
                      setOpen(false);
                    }}
                    className={
                      'flex cursor-pointer items-center gap-3 px-3 py-2.5 text-xs transition-colors ' +
                      (isSelected
                        ? 'bg-indigo-50 text-indigo-900'
                        : 'text-gray-700 hover:bg-gray-50')
                    }
                  >
                    {/* Colour dot */}
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: cal.backgroundColor }}
                    />
                    <span className="flex-1 truncate font-medium">
                      {cal.summary}
                      {cal.primary && (
                        <span className="ml-1.5 text-[10px] font-normal text-gray-400">(primary)</span>
                      )}
                    </span>
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-indigo-600" />}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}


export function Uploads({ initialAccessToken, onAccessTokenChange }: UploadsProps) {
  const [step, setStep] = useState<UploadStep>(1);
  const [showDocuments, setShowDocuments] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendarStatus, setCalendarStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [calendarMessage, setCalendarMessage] = useState('');
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [uploadPulse, setUploadPulse] = useState(false);
  const [lastProcessOk, setLastProcessOk] = useState(false);

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileMeta[]>([]);
  const uploadedFilesRef = useRef<UploadedFileMeta[]>([]);
  const deleteSnapshotsRef = useRef<Map<string, UploadedFileMeta[]>>(new Map());

  const [hasSynced, setHasSynced] = useState(false);
  const [syncBurst, setSyncBurst] = useState(false);

  const [includeLectures, setIncludeLectures] = useState(true);
  const [includeAssignments, setIncludeAssignments] = useState(true);
  const [includeExams, setIncludeExams] = useState(true);

  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('primary');
  const [selectedCalendarSummary, setSelectedCalendarSummary] = useState<string>('Default calendar');

  const accessToken = initialAccessToken;
  const hasEvents = events.length > 0;
  const isGoogleConnected = !!accessToken;
  const showConnectedUi = isGoogleConnected;

  useEffect(() => {
    if (!accessToken) {
      setHasSynced(false);
      setSyncBurst(false);
    }
  }, [accessToken]);

  const canJumpToReviewFromUpload = hasEvents && step === 1;
  const canProcessFromUpload = !!pendingText && calendarStatus !== 'loading' && step === 1;

  useEffect(() => {
    const saved = localStorage.getItem('calendarEvents');
    if (saved) setEvents(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const authSuccess = url.searchParams.get('auth_success');
    const token = url.searchParams.get('access_token');
    if (authSuccess === 'true' && token) {
      onAccessTokenChange(token);
      url.searchParams.delete('auth_success');
      url.searchParams.delete('access_token');
      window.history.replaceState({}, '', url.toString());
      setCalendarStatus('idle');
      setCalendarMessage('');
    }
  }, [onAccessTokenChange]);

  useEffect(() => {
    uploadedFilesRef.current = uploadedFiles;
  }, [uploadedFiles]);

  const connectSyncSizeClass = 'h-10 w-32 px-0';

  const syncButtonClassName =
    'inline-flex items-center justify-center rounded-lg ' +
    connectSyncSizeClass +
    ' text-xs font-semibold shadow-sm leading-none ' +
    'transition-[background-color,color,border-color,box-shadow,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ';

  const secondaryActionClassName =
    'inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors';

  const primaryPurple = 'bg-indigo-600 text-white hover:bg-indigo-700';
  const primaryPurpleDisabled = 'bg-indigo-400/60 text-white cursor-not-allowed opacity-60';
  const syncedWhite = 'bg-white text-gray-900 border border-gray-200 shadow-none';

  const newUploadClassName =
    'inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold shadow-sm ' +
    'transition-[background-color,color,border-color,box-shadow,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ';

  const newUploadNeutral = 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50';
  const newUploadPurple = 'bg-indigo-600 text-white hover:bg-indigo-700';


  function handleSyllabusText(rawText: string, uploaded?: string[] | UploadedFileMeta[]) {
    setPendingText(rawText);
    setHasSynced(false);
    setSyncBurst(false);
    setLastProcessOk(false);
    setUploadPulse(true);
    window.setTimeout(() => setUploadPulse(false), 650);
    setCalendarStatus('idle');
    setCalendarMessage('');

    if (uploaded && uploaded.length) {
      const items = (uploaded as Array<string | UploadedFileMeta>).map((u) =>
        typeof u === 'string' ? ({ filename: u, url: '' } as UploadedFileMeta) : u,
      );
      setUploadedFiles((prev) => {
        const seen = new Set<string>();
        return [...items, ...prev].filter((f) => {
          if (seen.has(f.filename)) return false;
          seen.add(f.filename);
          return true;
        });
      });
    }
  }

  async function handleDeleteUploadedFile(filename: string) {
    deleteSnapshotsRef.current.set(filename, uploadedFilesRef.current);
    setUploadedFiles((prev) => prev.filter((f) => f.filename !== filename));
    try {
      const res = await fetch(`/api/upload?filename=${encodeURIComponent(filename)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        const snapshot = deleteSnapshotsRef.current.get(filename);
        if (snapshot) setUploadedFiles(snapshot);
        setCalendarStatus('error');
        setCalendarMessage(data?.error || 'Failed to delete file');
      }
    } catch {
      const snapshot = deleteSnapshotsRef.current.get(filename);
      if (snapshot) setUploadedFiles(snapshot);
      setCalendarStatus('error');
      setCalendarMessage('Failed to delete file');
    } finally {
      deleteSnapshotsRef.current.delete(filename);
    }
  }

  async function processPendingText() {
    if (!pendingText) return;
    setHasSynced(false);
    setStep('processing');
    setCalendarStatus('loading');
    setCalendarMessage('');
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pendingText, includeLectures, includeAssignments, includeExams }),
      });

      if (!res.ok) {
        await res.json().catch(() => ({}));
        setCalendarStatus('error');
        setCalendarMessage('Could not process file, try again.');
        setStep(1);
        return;
      }

      const { csvText } = await res.json();
      const eventsFromCsv: CalendarEvent[] = csvText
        .split('\n')
        .filter((line: string) => line.trim() !== '')
        .slice(1)
        .map((line: string) => {
          const [title, start, allDayStr, description, location] = line.split(',');
          return { title, start, allDay: allDayStr?.toLowerCase() === 'true', description, location } as CalendarEvent;
        });

      setEvents(eventsFromCsv);
      localStorage.setItem('calendarEvents', JSON.stringify(eventsFromCsv));
      setCalendarStatus('ok');
      setLastProcessOk(true);
      setCalendarMessage('');
      setTimeout(() => setStep(2), 450);
    } catch (err) {
      console.error(err);
      setCalendarStatus('error');
      setCalendarMessage('Could not process this PDF. Try a different file.');
      setStep(1);
    }
  }

  async function handleGoogleCalendarAuth(options?: { prompt?: 'select_account' }) {
    try {
      const u = new URL('/api/calendar/auth', window.location.origin);
      if (options?.prompt) u.searchParams.set('prompt', options.prompt);
      const res = await fetch(u.toString());
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
    setHasSynced(true);
    setCalendarStatus('loading');
    setCalendarMessage('Adding events to Google Calendar…');

    try {
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: token,
          events,
          calendarId: selectedCalendarId,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setHasSynced(false);
        setSyncBurst(false);
        setCalendarStatus('error');
        setCalendarMessage(data.error || `Failed to add events (${res.status})`);
        return;
      }

      const count = data.count ?? events.length;
      const calLabel =
        selectedCalendarId === 'primary' ? 'your default calendar' : `"${selectedCalendarSummary}"`;
      setCalendarStatus('ok');
      setCalendarMessage(
        data.message ||
          `All set — ${count} event${count === 1 ? '' : 's'} added to ${calLabel}.`,
      );
      setSyncBurst(true);
      window.setTimeout(() => setSyncBurst(false), 900);
    } catch (err) {
      console.error(err);
      setHasSynced(false);
      setSyncBurst(false);
      setCalendarStatus('error');
      setCalendarMessage('Error adding events. See console.');
    }
  }

  async function handleAddToGoogleCalendar() {
    if (!accessToken) {
      setCalendarStatus('idle');
      setCalendarMessage('Redirecting to Google…');
      return handleGoogleCalendarAuth();
    }
    if (events.length === 0) {
      setCalendarStatus('error');
      setCalendarMessage('No events to sync yet.');
      return;
    }
    await handleAddToGoogleCalendarWithToken(accessToken);
  }

  async function handleSwitchGoogleAccount() {
    if (!accessToken) return;
    onAccessTokenChange(null);
    setCalendarStatus('idle');
    setCalendarMessage('Switching account…');
    await handleGoogleCalendarAuth({ prompt: 'select_account' });
  }

  function handleDownloadCsv() {
    if (events.length === 0) return;
    const header = 'title,start,allDay,description,location';
    const rows = events.map((e) => {
      const esc = (v?: string) => JSON.stringify(v ?? '').slice(1, -1);
      return [esc(e.title), e.start, String(e.allDay), esc(e.description), esc(e.location ?? '')].join(',');
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `syllabus-events-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function resetFlow() {
    setStep(1);
    setEvents([]);
    setPendingText(null);
    setShowDocuments(false);
    setCalendarStatus('idle');
    setCalendarMessage('');
    setLastProcessOk(false);
    setUploadedFiles([]);
    setHasSynced(false);
    setSyncBurst(false);
    setSelectedCalendarId('primary');
    setSelectedCalendarSummary('Default calendar');
    localStorage.removeItem('calendarEvents');
  }

  function goToPreviousStep() {
    if (step === 2) setStep(1);
    if (step === 3) {
      setStep(2);
      setHasSynced(false);
      setSyncBurst(false);
    }
  }

  function goToReviewFromUpload() {
    if (!canJumpToReviewFromUpload) return;
    setStep(2);
  }


  const statusText = useMemo(() => {
    if (calendarStatus === 'error' && calendarMessage) return calendarMessage;
    if (lastProcessOk) return 'Extracted events are ready.';
    if (pendingText) return 'PDF added — ready to process.';
    if (hasEvents) return 'Previous events found — you can review again.';
    return 'Upload a PDF to begin.';
  }, [pendingText, hasEvents, lastProcessOk, calendarStatus, calendarMessage]);

  const statusTone = useMemo(() => {
    if (calendarStatus === 'error') return 'error';
    if (calendarStatus === 'ok' || lastProcessOk) return 'ok';
    return 'neutral';
  }, [calendarStatus, lastProcessOk]);

  const isSyncComplete = hasSynced && calendarStatus === 'ok';


  return (
    <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_circle_at_20%_5%,theme(colors.indigo.100),transparent_55%),radial-gradient(1000px_circle_at_80%_35%,theme(colors.violet.100),transparent_60%),linear-gradient(to_bottom,theme(colors.white),theme(colors.slate.50))] transition-all duration-700" />

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-gray-900 mb-1">Upload & Sync</h2>
            <p className="text-gray-600 max-w-xl">
              Upload a syllabus, review extracted dates, then sync to Google Calendar.
            </p>
          </div>
        </div>
        <StepRail
          step={step}
          hasEvents={hasEvents}
          isSynced={hasSynced && calendarStatus === 'ok'}
          onStepClick={(n) => {
            if (n === 1) setStep(1);
            if (n === 2) setStep(2);
            if (n === 3) setStep(3);
          }}
        />
      </div>

      {/* ── Step 1: Upload ── */}
      {step === 1 && (
        <div className="mb-8 transition-all duration-500 ease-out animate-[fadeInUp_260ms_ease-out]">
          <div className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-gray-200/80 p-8">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upload Syllabus</h3>
              <p className="text-sm text-gray-500">
                Add your syllabus files, then select event types to extract and click process to generate your calendar.
              </p>
            </div>

            <PdfUpload
              onTextExtracted={handleSyllabusText}
              uploadedFiles={uploadedFiles}
              onDeleteUploadedFile={handleDeleteUploadedFile}
            />

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="flex min-w-0 flex-col gap-3">
                {/* Status pill */}
                <div
                  className={
                    'inline-flex w-fit max-w-full items-center gap-2 rounded-md border px-3 py-2 text-xs transition-colors ' +
                    (statusTone === 'error'
                      ? 'border-rose-200 bg-rose-50 text-rose-700'
                      : statusTone === 'ok'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 bg-white/70 text-gray-700')
                  }
                >
                  <span
                    className={
                      'h-2 w-2 shrink-0 rounded-full ' +
                      (statusTone === 'error'
                        ? 'bg-rose-500'
                        : statusTone === 'ok'
                          ? 'bg-emerald-500'
                          : 'bg-indigo-500 ' + (uploadPulse ? 'animate-pulse' : ''))
                    }
                  />
                  <span className="truncate">{statusText}</span>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-gray-500">Include:</span>
                  {[
                    { label: 'Lectures', checked: includeLectures, set: setIncludeLectures },
                    { label: 'Assignments', checked: includeAssignments, set: setIncludeAssignments },
                    { label: 'Tests/Exams', checked: includeExams, set: setIncludeExams },
                  ].map(({ label, checked, set }) => (
                    <label
                      key={label}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white/70 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-white transition-colors cursor-pointer select-none"
                    >
                      <Checkbox checked={checked} onCheckedChange={(c) => set(c === true)} />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-fit lg:justify-end">
                <button
                  type="button"
                  onClick={goToReviewFromUpload}
                  disabled={!canJumpToReviewFromUpload}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300"
                >
                  Review Previous
                </button>
                <button
                  type="button"
                  onClick={() => void processPendingText()}
                  disabled={!canProcessFromUpload}
                  className="group inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 transition-all duration-300"
                >
                  <span className="transition-transform duration-300 group-hover:translate-x-0.5">Process →</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Processing spinner ── */}
      {step === 'processing' && (
        <div className="mb-8 flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-md border border-indigo-100 px-8 py-10 max-w-xl w-full text-center animate-[fadeInUp_280ms_ease-out]">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 mb-4">
              <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-indigo-500 border-t-transparent" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing…</h3>
            <p className="text-sm text-gray-500">Extracting dates from your syllabus.</p>
          </div>
        </div>
      )}

      {/* ── Step 2: Review ── */}
      {step === 2 && (
        <div className="mb-8 space-y-6 transition-all duration-500 ease-out animate-[fadeInUp_260ms_ease-out]">
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 text-lg">Review Extracted Events</h3>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                {events.length} event{events.length === 1 ? '' : 's'}
              </span>
            </div>

            {!hasEvents ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 py-6">
                <FileText className="w-8 h-8 mb-2 text-gray-400" />
                <p className="text-sm mb-1">No events yet.</p>
                <p className="text-xs text-gray-400">Upload and process a syllabus to see events here.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto text-sm">
                {events.slice(0, 10).map((e, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between border-b border-gray-100 last:border-0 py-2"
                  >
                    <div className="pr-4">
                      <p className="font-medium text-gray-900 line-clamp-2">{e.title}</p>
                      {e.description && <p className="text-xs text-gray-500 line-clamp-1">{e.description}</p>}
                    </div>
                    <div className="text-right text-xs text-gray-500 whitespace-nowrap">
                      <p>{new Date(e.start).toLocaleString()}</p>
                      <p>{e.allDay ? 'All day' : 'Timed'}</p>
                    </div>
                  </div>
                ))}
                {events.length > 10 && <p className="text-xs text-gray-400 mt-1">Showing first 10 events.</p>}
              </div>
            )}

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={goToPreviousStep}
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back to Upload
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  disabled={!hasEvents}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Download CSV
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!hasEvents}
                  className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continue to Sync →
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowDocuments(!showDocuments)}
            className="w-full bg-white/80 border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-white transition-colors flex items-center justify-center gap-2"
          >
            <FolderOpen className="w-5 h-5" />
            {showDocuments ? 'Hide raw CSV' : 'Show raw CSV'}
          </button>

          {showDocuments && (
            <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-sm text-gray-700 max-h-80 overflow-auto">
              {!hasEvents ? (
                <p className="text-gray-500">No events to display. Upload a syllabus first.</p>
              ) : (
                <pre className="whitespace-pre-wrap break-words text-xs">
                  title,start,allDay,description,location
                  {events
                    .map(
                      (e) =>
                        `${e.title},${e.start},${String(e.allDay)},${e.description ?? ''},${e.location ?? ''}`,
                    )
                    .join('\n')}
                </pre>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Step 3: Sync ── */}
      {step === 3 && (
        <div className="mb-8 space-y-6 transition-all duration-500 ease-out animate-[fadeInUp_260ms_ease-out]">
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-gray-200 p-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Sync to Google Calendar</h3>
              <p className="text-sm text-gray-500 mt-1">
                Connect your Google account and add the extracted events.
              </p>
            </div>

            <div className="mt-6 grid gap-3">
              {/* ── Connection row ── */}
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                <div className="flex min-h-[44px] items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">Connection</p>
                    {showConnectedUi ? (
                      <button
                        type="button"
                        onClick={() => void handleSwitchGoogleAccount()}
                        className="mt-1 inline-flex items-center text-xs font-semibold text-indigo-700 hover:text-indigo-900 underline underline-offset-4"
                      >
                        Switch account
                      </button>
                    ) : (
                      <p className="text-xs text-gray-500">Not connected yet.</p>
                    )}
                  </div>
                  {showConnectedUi ? (
                    <span
                      className={
                        'inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white ' +
                        connectSyncSizeClass +
                        ' text-xs font-semibold leading-none text-gray-800 shadow-sm'
                      }
                    >
                      <span className="inline-flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Connected
                      </span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleGoogleCalendarAuth()}
                      className={
                        'inline-flex items-center justify-center rounded-lg bg-indigo-600 text-xs font-semibold leading-none text-white ' +
                        connectSyncSizeClass +
                        ' hover:bg-indigo-700 transition-colors'
                      }
                    >
                      <span className="inline-flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Connect
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* ── Calendar choice row ── */}
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                <div className="flex min-h-[44px] items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">Calendar</p>
                    <p className="text-xs text-gray-500">
                      {isGoogleConnected
                        ? 'Choose which calendar to sync events into.'
                        : 'Connect Google to choose a calendar.'}
                    </p>
                  </div>

                  {isGoogleConnected ? (
                    <CalendarPicker
                      accessToken={accessToken!}
                      selectedCalendarId={selectedCalendarId}
                      onSelect={(id, summary) => {
                        setSelectedCalendarId(id);
                        setSelectedCalendarSummary(summary);
                        if (hasSynced) {
                          setHasSynced(false);
                          setSyncBurst(false);
                          setCalendarStatus('idle');
                          setCalendarMessage('');
                        }
                      }}
                    />
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-400">
                      <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
                      Default calendar
                      <ChevronDown className="h-3.5 w-3.5 text-gray-300" />
                    </span>
                  )}
                </div>
              </div>

              {/* ── Sync row ── */}
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">Syncing</p>
                    <p className="text-xs text-gray-500">
                      {hasEvents ? `${events.length} event(s) ready to send.` : 'No events yet.'}
                      {!isGoogleConnected ? ' Connect Google to enable sync.' : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleAddToGoogleCalendar()}
                    disabled={!hasEvents || !isGoogleConnected || calendarStatus === 'loading'}
                    className={
                      syncButtonClassName +
                      (!hasEvents || !isGoogleConnected || calendarStatus === 'loading'
                        ? primaryPurpleDisabled
                        : isSyncComplete
                          ? syncedWhite
                          : primaryPurple) +
                      (!isSyncComplete && hasEvents && isGoogleConnected && calendarStatus !== 'loading'
                        ? ' hover:-translate-y-[1px]'
                        : '')
                    }
                    aria-disabled={!hasEvents || !isGoogleConnected || calendarStatus === 'loading'}
                    title={!isGoogleConnected ? 'Connect your Google account to enable syncing.' : undefined}
                  >
                    <span className="inline-flex items-center gap-2">
                      <CalendarCheck
                        className={'h-4 w-4 ' + (calendarStatus === 'loading' ? 'animate-pulse' : '')}
                      />
                      {calendarStatus === 'loading' ? 'Syncing…' : isSyncComplete ? 'Synced' : 'Sync'}
                    </span>
                  </button>
                </div>
              </div>

              {/* ── Status banner ── */}
              {hasSynced && (calendarMessage || calendarStatus !== 'idle') && (
                <div
                  className={
                    'rounded-xl border px-4 py-3 text-sm transition-colors duration-500 ease-out ' +
                    (calendarStatus === 'error'
                      ? 'border-rose-200 bg-rose-50 text-rose-800'
                      : calendarStatus === 'ok'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                        : 'border-gray-200 bg-white text-gray-700')
                  }
                >
                  <div className="flex items-start gap-2">
                    {calendarStatus === 'ok' ? (
                      <Sparkles
                        className={
                          'mt-0.5 h-4 w-4 ' +
                          (syncBurst ? 'animate-bounce text-emerald-700' : 'text-emerald-700')
                        }
                      />
                    ) : calendarStatus === 'error' ? (
                      <Trash2 className="mt-0.5 h-4 w-4 text-rose-700" />
                    ) : (
                      <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium">
                        {calendarStatus === 'ok'
                          ? 'Sync Complete.'
                          : calendarStatus === 'error'
                            ? 'Something went wrong'
                            : 'Working…'}
                      </p>
                      {calendarMessage ? <p className="text-xs opacity-80 mt-1">{calendarMessage}</p> : null}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Footer actions ── */}
            <div className="mt-6 flex items-center justify-between">
              <button type="button" onClick={goToPreviousStep} className={secondaryActionClassName}>
                Back to Review
              </button>
              <button
                type="button"
                onClick={resetFlow}
                className={
                  newUploadClassName +
                  ' ' +
                  (isSyncComplete ? newUploadPurple : newUploadNeutral) +
                  (isSyncComplete ? ' hover:-translate-y-[1px]' : '')
                }
              >
                New Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}