'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FileText,
  FolderOpen,
  CalendarCheck,
  Trash2,
  User,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Pencil,
  BookOpen,
  X,
} from 'lucide-react';
import PdfUpload from '@/components/PdfUpload';
import { Checkbox } from '@/components/ui/checkbox';
import { CreateCalendarDialog } from './CreateCalendarDialog';
import type { CalendarEvent } from '@/lib/googleCalendar';
import { parseFilterDays, getDayOfWeek } from '@/lib/promptUtils';
import { parseCsvToCalendarEvents } from '@/lib/csvEvents';
import { createClient } from '@/lib/supabase/client';
import { getCourses, createCourse, createAssignments, type DbCourse } from '@/lib/supabase/database';


const WEEKLY_REPEAT_DAY_LABELS = ['Sun', 'M', 'Tue', 'W', 'Th', 'F', 'Sat'] as const;
const RRULE_DAY_MAP = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] as const;

function getTimeFromISO(iso: string): string {
  if (!iso.includes('T')) return '09:00';
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function buildRecurrence(
  repeat: 'none' | 'daily' | 'weekdays' | 'weekly',
  weeklyDays: boolean[],
  endType: 'never' | 'date' | 'count',
  endDate: string,
  endCount: number
): string[] {
  if (repeat === 'none') return [];
  const parts: string[] = [];
  if (repeat === 'daily') parts.push('FREQ=DAILY');
  else if (repeat === 'weekdays') parts.push('FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR');
  else if (repeat === 'weekly') {
    const days = weeklyDays.map((on, i) => (on ? RRULE_DAY_MAP[i] : null)).filter(Boolean);
    if (days.length === 0) return [];
    parts.push('FREQ=WEEKLY;BYDAY=' + (days as string[]).join(','));
  } else return [];
  if (endType === 'date' && endDate) {
    const d = new Date(endDate + 'T23:59:59');
    parts.push('UNTIL=' + d.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z');
  } else if (endType === 'count' && endCount > 0) {
    parts.push('COUNT=' + endCount);
  }
  return ['RRULE:' + parts.join(';')];
}

function parseRecurrenceToRepeat(rrules: string[] | undefined): 'none' | 'daily' | 'weekdays' | 'weekly' {
  if (!rrules || rrules.length === 0) return 'none';
  const r = rrules[0].replace(/^RRULE:/i, '');
  if (r.includes('FREQ=DAILY')) return 'daily';
  if (r.includes('BYDAY=MO,TU,WE,TH,FR') && !r.includes('SA') && !r.includes('SU')) return 'weekdays';
  if (r.includes('FREQ=WEEKLY')) return 'weekly';
  return 'none';
}

interface UploadsProps {
  initialAccessToken: string | null;
  onAccessTokenChange: (token: string | null) => void;
  isAuthenticated?: boolean;
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
    { n: 3, label: 'Export' },
  ];

  const canGo = (n: 1 | 2 | 3) => {
    if (n === 1) return true;
    return hasEvents;
  };

  const anchorPct = active === 1 ? 16.667 : active === 2 ? 50 : 83.333;
  const progressPct = isSynced ? 100 : step === 'processing' ? (16.667 + 50) / 2 : anchorPct;

  return (
    <div className="mt-3">
      <div className="relative h-1.5 rounded-full bg-gray-200/70 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-indigo-600 transition-all duration-700 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="mt-2 inline-flex w-full overflow-hidden rounded-xl border border-gray-200 bg-white/70">
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
    </div>
  );
}


function CalendarPicker({
  selectedCalendarId,
  selectedCalendarSummary,
  onSelect,
  refetchTrigger,
}: {
  selectedCalendarId: string;
  selectedCalendarSummary: string,
  onSelect: (id: string, summary: string) => void;
  refetchTrigger?: number;
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
    if (fetchStatus === 'loading') return;
    setFetchStatus('loading');
    try {
      const res = await fetch('/api/calendar/calendars', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch calendars');
      setCalendars(data.calendars as GoogleCalendarMeta[]);
      setFetchStatus('ok');
    } catch (err) {
      console.error('[CalendarPicker]', err);
      setFetchStatus('error');
    }
  }

  function doFetch() {
    setCalendars([]);
    setFetchStatus('loading');
    fetch('/api/calendar/calendars', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.calendars) setCalendars(data.calendars as GoogleCalendarMeta[]);
        setFetchStatus('ok');
      })
      .catch(() => setFetchStatus('error'));
  }

  // Fetch on mount
  useEffect(() => {
    doFetch();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Force-refetch when account changes
  useEffect(() => {
    if (refetchTrigger === 0) return;
    doFetch();
  }, [refetchTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleToggle() {
    if (!open) {
      setFetchStatus('idle');
      fetchCalendars();
    }
    setOpen((o) => !o);
  }

  const selectedCalendar = selectedCalendarId === 'primary'
    ? calendars.find((c) => c.primary)
    : calendars.find((c) => c.id === selectedCalendarId);
  const displayLabel = selectedCalendar
    ? selectedCalendar.summary
    : selectedCalendarSummary;

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
let uploaded_events : CalendarEvent[];

export function get_events(){
  if(uploaded_events === undefined){
    const empty_list : CalendarEvent[] = [];
    return empty_list;
  }
  return uploaded_events;
}

// Matches PROGRESS_COLORS in StudyPlan.tsx (blue-500, emerald-500, violet-500, orange-500, rose-500, teal-500, amber-500, cyan-500)
const COURSE_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f97316', '#f43f5e', '#14b8a6', '#f59e0b', '#06b6d4'];

function getCourseColor(courseId: string, idx: number): string {
  try {
    const saved: Record<string, number> = JSON.parse(localStorage.getItem('course-colors') ?? '{}');
    const colorIdx = saved[courseId] ?? idx;
    return COURSE_COLORS[colorIdx % COURSE_COLORS.length];
  } catch {
    return COURSE_COLORS[idx % COURSE_COLORS.length];
  }
}

function CoursePicker({ courses, selectedId, onSelect }: {
  courses: DbCourse[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const totalItems = courses.length + 1;

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) { setFocusedIdx(-1); return; }
    const idx = selectedId === 'new' ? courses.length : courses.findIndex((c) => c.id === selectedId);
    setFocusedIdx(idx >= 0 ? idx : 0);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open || focusedIdx < 0 || !listRef.current) return;
    const item = listRef.current.children[focusedIdx] as HTMLElement;
    item?.scrollIntoView({ block: 'nearest' });
  }, [focusedIdx, open]);

  function selectAt(idx: number) {
    onSelect(idx < courses.length ? courses[idx].id : 'new');
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true); }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIdx((i) => (i + 1) % totalItems); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedIdx((i) => (i - 1 + totalItems) % totalItems); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (focusedIdx >= 0) selectAt(focusedIdx); }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
  }

  const selectedName = selectedId === 'new'
    ? '+ Create new course'
    : courses.find((c) => c.id === selectedId)?.class_name ?? 'Select course…';
  const selectedCourseIdx = courses.findIndex((c) => c.id === selectedId);
  const selectedColor = selectedCourseIdx >= 0 ? getCourseColor(courses[selectedCourseIdx].id, selectedCourseIdx) : null;

  return (
    <div ref={ref} className="relative" onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={
          'inline-flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ' +
          (open
            ? 'border-indigo-300 bg-indigo-50 text-indigo-800 shadow-sm'
            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300')
        }
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selectedColor !== null && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: selectedColor }} />}
        <span className="flex-1 truncate text-left">{selectedName}</span>
        <ChevronDown className={'h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-200 ' + (open ? 'rotate-180' : '')} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[60] mt-1.5 w-full min-w-[180px] rounded-xl border border-gray-200 bg-white shadow-lg ring-1 ring-black/5 animate-[fadeInUp_150ms_ease-out]">
          <ul ref={listRef} role="listbox" className="max-h-48 overflow-y-auto py-1">
            {courses.map((c, idx) => {
              const isSel = c.id === selectedId;
              const isFocused = idx === focusedIdx;
              return (
                <li
                  key={c.id}
                  role="option"
                  aria-selected={isSel}
                  onClick={() => { onSelect(c.id); setOpen(false); }}
                  onMouseEnter={() => setFocusedIdx(idx)}
                  className={'flex cursor-pointer items-center gap-2 px-3 py-2.5 text-xs transition-colors ' + (isSel || isFocused ? 'bg-indigo-50 text-indigo-900' : 'text-gray-700 hover:bg-gray-50')}
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: getCourseColor(c.id, idx) }} />
                  <span className="flex-1 truncate font-medium">{c.class_name}</span>
                  {isSel && <Check className="h-3.5 w-3.5 shrink-0 text-indigo-600" />}
                </li>
              );
            })}
            <li
              role="option"
              aria-selected={selectedId === 'new'}
              onClick={() => { onSelect('new'); setOpen(false); }}
              onMouseEnter={() => setFocusedIdx(courses.length)}
              className={'cursor-pointer flex items-center px-3 py-2.5 text-xs text-slate-700 border-t border-gray-500 ' + (selectedId === 'new' || focusedIdx === courses.length ? 'bg-indigo-50 font-medium' : 'hover:bg-indigo-50')}
            >
              + Create new course
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
export function Uploads({ initialAccessToken, onAccessTokenChange, isAuthenticated }: UploadsProps) {
  const supabase = useMemo(() => createClient(), []);
  const [step, setStep] = useState<UploadStep>(1);
  const [showDocuments, setShowDocuments] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  uploaded_events = events;
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

  type CategoryFilter = 'ALL' | 'LECTURE' | 'ASSIGNMENT' | 'EXAM';
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');

  const [includeLectures, setIncludeLectures] = useState(true);
  const [includeAssignments, setIncludeAssignments] = useState(true);
  const [includeExams, setIncludeExams] = useState(true);

  const [userPrompt, setUserPrompt] = useState('');
  const MAX_PROMPT_LENGTH = 500;

  const CALENDAR_PREF_KEY = 'syllabus_calendar_selected';
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>(() => {
    if (typeof window === 'undefined') return 'primary';
    try {
      const saved = localStorage.getItem(CALENDAR_PREF_KEY);
      if (saved) {
        const { id } = JSON.parse(saved);
        if (id) return id;
      }
    } catch { /* ignore */ }
    return 'primary';
  });
  const [selectedCalendarSummary, setSelectedCalendarSummary] = useState<string>(() => {
    if (typeof window === 'undefined') return 'Default calendar';
    try {
      const saved = localStorage.getItem(CALENDAR_PREF_KEY);
      if (saved) {
        const { id, summary } = JSON.parse(saved);
        if (id) return summary ?? (id === 'primary' ? 'Default calendar' : id);
      }
    } catch { /* ignore */ }
    return 'Default calendar';
  });
  const [calendarRefetchTrigger, setCalendarRefetchTrigger] = useState(0);

  // --- Upload to Planner state ---
  const [plannerUploadStatus, setPlannerUploadStatus] = useState<'idle' | 'mapping' | 'uploading' | 'done' | 'error'>('idle');
  const [plannerUploadMsg, setPlannerUploadMsg] = useState('');
  const [showPlannerDropdown, setShowPlannerDropdown] = useState(false);
  const [classMappings, setClassMappings] = useState<Array<{ className: string; selectedCourseId: string | 'new'; newCourseName: string }>>([]);
  const [existingCourses, setExistingCourses] = useState<DbCourse[]>([]);
  const plannerDropdownRef = useRef<HTMLDivElement>(null);
  const PLANNER_MAPPINGS_PER_PAGE = 3;
  const [plannerMappingPage, setPlannerMappingPage] = useState(0);

  const accessToken = initialAccessToken;
  const hasEvents = events.length > 0;
  const isGoogleConnected = !!accessToken;
  const showConnectedUi = isGoogleConnected;

  const syncCalendarConnection = useCallback(async () => {
    try {
      const res = await fetch('/api/calendar/session', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      onAccessTokenChange(data?.connected ? 'google-calendar-session' : null);
    } catch {
      onAccessTokenChange(null);
    }
  }, [onAccessTokenChange]);

  useEffect(() => {
    if (!accessToken) {
      setHasSynced(false);
      setSyncBurst(false);
    }
  }, [accessToken]);

  const [isLoggedIn, setIsLoggedIn] = useState(!!isAuthenticated);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setIsLoggedIn(!!data?.session?.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);
  useEffect(() => {
    if (isAuthenticated) setIsLoggedIn(true);
  }, [isAuthenticated]);

  const canJumpToReviewFromUpload = hasEvents && step === 1;
  const canProcessFromUpload = !!pendingText && calendarStatus !== 'loading' && step === 1;

  useEffect(() => {
    const saved = localStorage.getItem('calendarEvents');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) setEvents(parsed);
        else setEvents([]);
      } catch {
        setEvents([]);
      }
    } else {
      setEvents([]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const authSuccess = url.searchParams.get('auth_success');
    const errorCode = url.searchParams.get('error');
    if (authSuccess === 'true') {
      void syncCalendarConnection();
      setCalendarRefetchTrigger(t => t + 1);
      setSelectedCalendarId('primary');
      setSelectedCalendarSummary('Default calendar');
      try {
        localStorage.removeItem(CALENDAR_PREF_KEY);
        localStorage.removeItem('syllabus_calendar_display_ids');
      } catch { /* ignore */ }
      setStep(3);
      url.searchParams.delete('auth_success');
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.toString());
      setCalendarStatus('idle');
      setCalendarMessage('');
    } else if (authSuccess === 'false') {
      void syncCalendarConnection();
      url.searchParams.delete('auth_success');
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.toString());
      setCalendarStatus('error');
      setCalendarMessage(
        errorCode
          ? `Google connection failed (${errorCode}). Please try again.`
          : 'Google connection failed. Please try again.',
      );
    }
  }, [syncCalendarConnection]);

  useEffect(() => {
    void syncCalendarConnection();
  }, [syncCalendarConnection]);

  useEffect(() => {
    uploadedFilesRef.current = uploadedFiles;
  }, [uploadedFiles]);

  const connectSyncSizeClass = 'h-10 w-32 px-0';

  const syncButtonClassName =
    'inline-flex items-center justify-center rounded-lg ' +
    connectSyncSizeClass +
    ' text-xs font-semibold shadow-sm leading-none ' +
    'transition-[background-color,color,border-color,box-shadow,transform] duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ';

  const secondaryActionClassName =
    'inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors';

  const primaryPurple = 'bg-indigo-600 text-white hover:bg-indigo-700';
  const primaryPurpleDisabled = 'bg-indigo-400/60 text-white cursor-not-allowed opacity-60';
  const syncedWhite = 'bg-white text-gray-900 border border-gray-200 shadow-none';

  const newUploadClassName =
    'inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold shadow-sm ' +
    'transition-[background-color,color,border-color,box-shadow,transform] duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ';

  const newUploadNeutral = 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50';
  const newUploadPurple = 'bg-indigo-600 text-white hover:bg-indigo-700';


  function handleSyllabusText(rawText: string, uploaded?: string[] | UploadedFileMeta[]) {
    setPendingText(rawText);
    setHasSynced(false);
    setSyncBurst(false);
    setLastProcessOk(false);
    setShowPlannerDropdown(false);
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
        body: JSON.stringify({
          text: pendingText,
          includeLectures,
          includeAssignments,
          includeExams,
          userPrompt: userPrompt.trim().slice(0, MAX_PROMPT_LENGTH),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setCalendarStatus('error');
        setCalendarMessage(errorData?.error || 'Could not process file, try again.');
        setStep(1);
        return;
      }

      const { csvText } = await res.json();
      const eventsFromCsv: CalendarEvent[] = parseCsvToCalendarEvents(csvText);

      // Deterministic day-of-week filtering — more reliable than asking the LLM.
      const filterDays = parseFilterDays(userPrompt);
      const finalEvents = filterDays.size > 0
        ? eventsFromCsv.filter((e) => !filterDays.has(getDayOfWeek(e.start)))
        : eventsFromCsv;

      setEvents(finalEvents);
      localStorage.setItem('calendarEvents', JSON.stringify(finalEvents));
      setCalendarStatus('ok');
      setLastProcessOk(true);
      setCalendarMessage('');
      setShowPlannerDropdown(false);
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
      setStep(3);
      window.location.href = data.authUrl;
    } catch {
      setCalendarStatus('error');
      setCalendarMessage('Failed to connect to Google Calendar');
    }
  }

  async function handleAddToGoogleCalendarWithSession() {
    if (events.length === 0) return;
    setHasSynced(true);
    setCalendarStatus('loading');
    setCalendarMessage('Adding events to Google Calendar…');

    try {
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events,
          calendarId: selectedCalendarId,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // setHasSynced(false);
        setSyncBurst(false);
        if (res.status === 401) onAccessTokenChange(null);
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
      setCalendarMessage('No events to export yet.');
      return;
    }
    await handleAddToGoogleCalendarWithSession();
  }

  async function handleSwitchGoogleAccount() {
    if (!accessToken) return;
    try {
      await fetch('/api/calendar/disconnect', { method: 'POST' });
    } catch {
      // Continue to OAuth flow even if disconnect request fails.
    }
    setCalendarStatus('idle');
    setCalendarMessage('Switching account…');
    await handleGoogleCalendarAuth({ prompt: 'select_account' });
  }

  function handleDownloadCsv() {
    if (events.length === 0) return;

    // Google Calendar import format
    const header = 'Subject,Start Date,Start Time,End Date,End Time,All Day Event,Description,Location,Private';

    function toGCalDate(iso: string): string {
      // YYYY-MM-DD → MM/DD/YYYY
      const [y, m, d] = iso.slice(0, 10).split('-');
      return `${m}/${d}/${y}`;
    }

    function toGCalTime(iso: string): string {
      // YYYY-MM-DDTHH:MM:SS → HH:MM AM/PM
      if (!iso.includes('T')) return '';
      const [, timePart] = iso.split('T');
      const [hStr, mStr] = timePart.split(':');
      let h = parseInt(hStr, 10);
      const suffix = h >= 12 ? 'PM' : 'AM';
      if (h > 12) h -= 12;
      if (h === 0) h = 12;
      return `${String(h).padStart(2, '0')}:${mStr} ${suffix}`;
    }

    function csvField(v: string): string {
      if (v.includes(',') || v.includes('"') || v.includes('\n')) {
        return `"${v.replace(/"/g, '""')}"`;
      }
      return v;
    }

    const rows = events.map((e) => {
      const startDate = toGCalDate(e.start);
      const startTime = e.allDay ? '' : toGCalTime(e.start);
      const endIso = e.end ?? e.start;
      const endDate = toGCalDate(endIso);
      const endTime = e.allDay ? '' : toGCalTime(endIso);
      return [
        csvField(e.title),
        startDate,
        startTime,
        endDate,
        endTime,
        e.allDay ? 'True' : 'False',
        csvField(e.description ?? ''),
        csvField(e.location ?? ''),
        'False',
      ].join(',');
    });

    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
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
    setPlannerUploadStatus('idle');
    setPlannerUploadMsg('');
  }

  // --- Upload to Planner handlers ---
  const assignmentExamEvents = useMemo(() => {
    return events.filter((e) => {
      return e.type === 'assignment' || e.type === 'exam';
    });
  }, [events]);

  async function handleOpenPlannerUpload() {
    if (!isLoggedIn) {
      setPlannerUploadStatus('error');
      setPlannerUploadMsg('Please log in to upload to planner.');
      return;
    }
    if (assignmentExamEvents.length === 0) {
      setPlannerUploadStatus('error');
      setPlannerUploadMsg('No assignments or exams to upload.');
      return;
    }

    setPlannerUploadStatus('mapping');
    try {
      const courses = await getCourses(supabase);
      setExistingCourses(courses);

      // Extract unique class names from events
      const classNames = new Set<string>();
      for (const e of assignmentExamEvents) {
        classNames.add(e.class?.trim() || 'Uncategorized');
      }

      const mappings = Array.from(classNames).map((className) => {
        const match = courses.find((c) => c.class_name.toLowerCase() === className.toLowerCase());
        return {
          className,
          selectedCourseId: match?.id ?? 'new',
          newCourseName: className,
        };
      });

      setClassMappings(mappings);
      setPlannerMappingPage(0);
      setShowPlannerDropdown(true);
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? JSON.stringify(err);
      console.error('Failed to open planner upload:', msg, err);
      setPlannerUploadStatus('error');
      setPlannerUploadMsg('Failed to load courses. Please try again.');
    }
  }

  async function handleConfirmPlannerUpload() {
    // Count unique new courses that would be created
    const newCourseNames = new Set<string>();
    for (const m of classMappings) {
      if (m.selectedCourseId === 'new') {
        newCourseNames.add((m.newCourseName || m.className).trim());
      }
    }
    if (existingCourses.length + newCourseNames.size > 10) {
      setPlannerUploadStatus('error');
      setPlannerUploadMsg(
        `This would create ${newCourseNames.size} new course${newCourseNames.size !== 1 ? 's' : ''}, exceeding the 10 course limit. Map work to existing courses or remove some to create new ones.`
      );
      return;
    }

    setPlannerUploadStatus('uploading');
    setShowPlannerDropdown(false);

    try {
      // Step 1: Create missing courses (deduplicate by newCourseName)
      const courseIdMap: Record<string, string> = {};
      const newCourseCache: Record<string, string> = {};
      for (const m of classMappings) {
        if (m.selectedCourseId !== 'new') {
          courseIdMap[m.className] = m.selectedCourseId;
        } else {
          const name = (m.newCourseName || m.className).trim();
          if (newCourseCache[name]) {
            courseIdMap[m.className] = newCourseCache[name];
          } else {
            const created = await createCourse(supabase, { class_name: name });
            newCourseCache[name] = created.id;
            courseIdMap[m.className] = created.id;
          }
        }
      }

      // Step 2: Build assignment rows
      const rows = assignmentExamEvents.map((e) => {
        const className = e.class?.trim() || 'Uncategorized';
        const courseId = courseIdMap[className];
        const eventType = e.type === 'exam' ? 'exam' : 'assignment';

        // Extract HH:MM time from timed events
        let eventTime: string | null = null;
        if (!e.allDay && e.start.includes('T')) {
          const d = new Date(e.start);
          const h = d.getHours();
          const m = d.getMinutes();
          if (h !== 0 || m !== 0) {
            eventTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          }
        }

        return {
          course_id: courseId,
          event_name: e.title,
          due_date: e.start.slice(0, 10),
          time: eventTime,
          type: eventType as 'assignment' | 'exam',
        };
      });

      // Step 3: Bulk upsert (skips duplicates via unique constraint)
      const created = await createAssignments(supabase, rows);

      setPlannerUploadStatus('done');
      setPlannerUploadMsg(`Uploaded ${created.length} item${created.length !== 1 ? 's' : ''} to planner.`);
    } catch (err) {
      console.error('Failed to upload to planner:', err);
      setPlannerUploadStatus('error');
      setPlannerUploadMsg('Failed to upload assignments. Please try again.');
    }
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
    if (pendingText) return 'PDF added. Click process to generate calendar.';
    if (hasEvents) return 'You have events from a previous upload. You can review them again.';
    return 'Upload a PDF to begin.';
  }, [pendingText, hasEvents, lastProcessOk, calendarStatus, calendarMessage]);

  const statusTone = useMemo(() => {
    if (calendarStatus === 'error') return 'error';
    if (lastProcessOk) return 'ok';
    return 'neutral';
  }, [calendarStatus, lastProcessOk]);

  const filteredEvents = useMemo(() =>
      categoryFilter === 'ALL'
        ? events
        : events.filter((e) => {
            if (categoryFilter === 'LECTURE') return e.type === 'class';
            if (categoryFilter === 'ASSIGNMENT') return e.type === 'assignment';
            if (categoryFilter === 'EXAM') return e.type === 'exam';
            return false;
          }),
      [events, categoryFilter],
  );

  const isSyncComplete = hasSynced && calendarStatus === 'ok';

  // Maps CalendarEvent type field to display label and back
  const TYPE_TO_LABEL = { assignment: 'ASSIGNMENT', exam: 'EXAM', class: 'LECTURE', undefined: 'OTHER' } as const;
  const LABEL_TO_TYPE: Record<string, 'assignment' | 'exam' | 'class' | undefined> = {
    ASSIGNMENT: 'assignment', EXAM: 'exam', LECTURE: 'class', OTHER: undefined,
  };
  const REVIEW_TYPE_CYCLE = ['ASSIGNMENT', 'EXAM', 'LECTURE', 'OTHER'] as const;

  function handleCycleReviewType(evt: CalendarEvent) {
    const currentLabel = TYPE_TO_LABEL[(evt.type ?? 'undefined') as keyof typeof TYPE_TO_LABEL] ?? 'OTHER';
    const idx = REVIEW_TYPE_CYCLE.indexOf(currentLabel as typeof REVIEW_TYPE_CYCLE[number]);
    const next = REVIEW_TYPE_CYCLE[(idx + 1) % REVIEW_TYPE_CYCLE.length];
    const updated: CalendarEvent = { ...evt, type: LABEL_TO_TYPE[next] };
    const nextEvents = events.map((e) => (e === evt ? updated : e));
    setEvents(nextEvents);
    try { localStorage.setItem('calendarEvents', JSON.stringify(nextEvents)); } catch { /* ignore */ }
  }

  const [showRegenerateModal, setShowRegenerateModal] = useState(false);

  const [reviewEditEvent, setReviewEditEvent] = useState<CalendarEvent | null>(null);
  const [revTitle, setRevTitle] = useState('');
  const [revDate, setRevDate] = useState('');
  const [revAllDay, setRevAllDay] = useState(true);
  const [revStartTime, setRevStartTime] = useState('09:00');
  const [revEndTime, setRevEndTime] = useState('10:00');
  const [revDescription, setRevDescription] = useState('');
  const [revRepeat, setRevRepeat] = useState<'none' | 'daily' | 'weekdays' | 'weekly'>('none');
  const [revWeeklyDays, setRevWeeklyDays] = useState([false, false, true, true, true, true, false]);
  const [revEndType, setRevEndType] = useState<'never' | 'date' | 'count'>('never');
  const [revEndDate, setRevEndDate] = useState('');
  const [revEndCount, setRevEndCount] = useState(5);
  const [reviewDeleteConfirm, setReviewDeleteConfirm] = useState(false);

  function openReviewEdit(e: CalendarEvent) {
    setReviewEditEvent(e);
    setRevTitle(e.title);
    const d = e.start.includes('T') ? e.start.slice(0, 10) : e.start.slice(0, 10);
    setRevDate(d);
    setRevAllDay(!!e.allDay);
    setRevStartTime(getTimeFromISO(e.start));
    setRevEndTime(getTimeFromISO(e.end ?? e.start));
    setRevDescription(e.description ?? '');
    setRevRepeat(parseRecurrenceToRepeat(e.recurrence));
    setRevWeeklyDays([false, false, true, true, true, true, false]);
    setRevEndType('never');
    setRevEndDate('');
    setRevEndCount(5);
    setReviewDeleteConfirm(false);
  }

  function closeReviewEdit() {
    setReviewEditEvent(null);
    setReviewDeleteConfirm(false);
  }

  function handleReviewEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewEditEvent || !revTitle.trim()) return;
    const start = revAllDay ? revDate + 'T00:00:00' : revDate + 'T' + revStartTime + ':00';
    const end = revAllDay ? revDate + 'T00:00:00' : revDate + 'T' + revEndTime + ':00';
    const recurrence = buildRecurrence(revRepeat, revWeeklyDays, revEndType, revEndDate, revEndCount);
    const updated: CalendarEvent = {
      ...reviewEditEvent,
      title: revTitle.trim(),
      start,
      end: revAllDay ? undefined : end,
      allDay: revAllDay,
      description: revDescription.trim() || undefined,
      recurrence: recurrence.length ? recurrence : undefined,
    };
    const nextEvents = events.map((ev) => (ev === reviewEditEvent ? updated : ev));
    setEvents(nextEvents);
    try {
      localStorage.setItem('calendarEvents', JSON.stringify(nextEvents));
    } catch { /* ignore */ }
    closeReviewEdit();
  }

  function handleReviewEditDelete() {
    if (!reviewEditEvent) return;
    const next = events.filter((ev) => ev !== reviewEditEvent);
    setEvents(next);
    try {
      localStorage.setItem('calendarEvents', JSON.stringify(next));
    } catch { /* ignore */ }
    closeReviewEdit();
  }

  return (
    <div className="relative max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 py-2">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_circle_at_20%_5%,theme(colors.indigo.100),transparent_55%),radial-gradient(1000px_circle_at_80%_35%,theme(colors.violet.100),transparent_60%),linear-gradient(to_bottom,theme(colors.white),theme(colors.slate.50))] transition-all duration-700" />

      {/* Header */}
      <div className="mb-2 shrink-0">
        <h2 className="text-xl font-semibold text-gray-900 mb-0.5">Upload</h2>
        <p className="text-xs text-gray-600">
          Upload your syllabus, review your generated calendar, then export it to Google Calendar.
        </p>
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
        <div className="transition-all duration-500 ease-out animate-[fadeInUp_260ms_ease-out]">
          <div className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-gray-200/80 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upload Files and Information</h3>
              <p className="text-sm text-gray-500">
                Drag and drop or click the area below to upload your syllabus files, then click process to generate your calendar.
              </p>
            </div>

            <div>
              <PdfUpload
                onTextExtracted={handleSyllabusText}
                uploadedFiles={uploadedFiles}
                onDeleteUploadedFile={handleDeleteUploadedFile}
              />
            </div>

            {/* User prompt / additional instructions */}
            <div className="mt-4 space-y-1.5">
              <label
                htmlFor="uploads-user-prompt"
                className="block text-xs font-medium text-gray-600"
              >
                Additional Information{' '}
                <span className="font-normal text-gray-400">(Optional)</span>
              </label>
              <textarea
                id="uploads-user-prompt"
                value={userPrompt}
                onChange={(e) =>
                  setUserPrompt(e.target.value.slice(0, MAX_PROMPT_LENGTH))
                }
                placeholder={'Add directions for generation or information about your classes (e.g. section/lab times). Specific dates (e.g. \'remove lecture on 3/20/2026\") are recommended for more accurate results.'}

                rows={3}
                maxLength={MAX_PROMPT_LENGTH}
                className="w-full resize-none rounded-xl border border-gray-200 bg-white/90 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition"
              />
              <p className="text-right text-xs text-gray-400">
                {userPrompt.length}/{MAX_PROMPT_LENGTH}
              </p>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="flex min-w-0 flex-col gap-3">
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

                {/* Status pill — left-aligned, truncated */}
                <div
                  className={
                    'inline-flex w-fit max-w-full items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition-colors ' +
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
              </div>

              <div className="flex w-full gap-2 sm:flex-row lg:w-fit lg:justify-end">
                <button
                  type="button"
                  onClick={goToReviewFromUpload}
                  disabled={!canJumpToReviewFromUpload}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300"
                >
                  Review Last Generation
                </button>
                <button
                  type="button"
                  onClick={() => void processPendingText()}
                  disabled={!canProcessFromUpload}
                  className="group inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 transition-all duration-300"
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
        <div className="flex items-center justify-center py-20">
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
        <div className="flex flex-col gap-6 transition-all duration-500 ease-out animate-[fadeInUp_260ms_ease-out]">
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 text-lg">Review Calendar</h3>
              <p className="text-sm text-gray-500">Review and make changes to your generated calendar.</p>
            </div>

            {/* Category filter buttons */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {(
                [
                  { key: 'ALL', label: 'All' },
                  { key: 'LECTURE', label: 'Lectures' },
                  { key: 'ASSIGNMENT', label: 'Assignments' },
                  { key: 'EXAM', label: 'Exams' },
                ] as { key: CategoryFilter; label: string }[]
              ).map(({ key, label }) => {
                const count = key === 'ALL' ? events.length : events.filter((e) =>
                  key === 'LECTURE' ? e.type === 'class' :
                  key === 'ASSIGNMENT' ? e.type === 'assignment' :
                  key === 'EXAM' ? e.type === 'exam' : false
                ).length;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategoryFilter(key)}
                    className={
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ' +
                      (categoryFilter === key
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
                    }
                  >
                    {label}
                    <span className={
                      'rounded-full px-1.5 py-0.5 text-[10px] font-semibold ' +
                      (categoryFilter === key ? 'bg-white/20 text-white' : 'bg-white text-gray-500')
                    }>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {!hasEvents ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 py-6">
                <FileText className="w-8 h-8 mb-2 text-gray-400" />
                <p className="text-sm mb-1">No events yet.</p>
                <p className="text-xs text-gray-400">Upload and process a syllabus to see events here.</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 py-6">
                <FileText className="w-8 h-8 mb-2 text-gray-400" />
                <p className="text-sm mb-1">No {categoryFilter.toLowerCase()} events found.</p>
                <p className="text-xs text-gray-400">Try a different filter or re-process your syllabus.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto text-sm">
                {filteredEvents.slice(0, 50).map((e, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between border-b border-gray-100 last:border-0 py-2 gap-2"
                  >
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => openReviewEdit(e)}
                        className="flex-shrink-0 p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors"
                        title="Edit event"
                        aria-label="Edit event"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <div className="pr-4 min-w-0">
                        <p className="font-medium text-gray-900 line-clamp-2">{e.title}</p>
                        {(() => {
                          const label = TYPE_TO_LABEL[(e.type ?? 'undefined') as keyof typeof TYPE_TO_LABEL] ?? 'OTHER';
                          return (
                            <button
                              type="button"
                              onClick={() => handleCycleReviewType(e)}
                              title="Click to change type"
                              className={
                                'mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide cursor-pointer hover:opacity-75 transition-opacity ' +
                                (label === 'LECTURE' ? 'bg-blue-50 text-blue-600' :
                                label === 'ASSIGNMENT' ? 'bg-amber-50 text-amber-600' :
                                label === 'EXAM' ? 'bg-rose-50 text-rose-600' :
                                'bg-gray-100 text-gray-500')
                              }
                            >
                              {label}
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-500 flex-shrink-0">
                      {e.allDay ? (
                        <>
                          <p className="whitespace-nowrap">{(() => { const [y,m,d] = e.start.slice(0,10).split('-').map(Number); return `${m}/${d}/${y}`; })()}</p>
                          <p className="whitespace-nowrap">All day</p>
                        </>
                      ) : (
                        <>
                          <p>{new Date(e.start).toLocaleString()}{e.end ? ` – ${new Date(e.end).toLocaleTimeString()}` : ''}</p>
                          <p className="whitespace-nowrap">Timed</p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {filteredEvents.length > 50 && (
                  <p className="text-xs text-gray-400 mt-1">Showing first 50 of {filteredEvents.length} events.</p>
                )}
              </div>
            )}

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Back to Upload
                </button>
                <button
                  type="button"
                  onClick={() => setShowRegenerateModal(true)}
                  disabled={!pendingText || calendarStatus === 'loading'}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Regenerate
                </button>
                <button
                  onClick={() => setShowDocuments(!showDocuments)}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors gap-1.5"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  {showDocuments ? 'Hide CSV' : 'Show CSV'}
                </button>
              </div>
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
                  className="group inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 transition-all duration-300"
                >
                  <span className="transition-transform duration-300 group-hover:translate-x-0.5">Continue to Export →</span>
                </button>
              </div>
            </div>

            {/* Raw CSV panel — below the review box */}
          </div>

          {showDocuments && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-sm text-gray-700 max-h-90 overflow-auto -mt-4">
              {!hasEvents ? (
                <p className="text-gray-500">No events to display. Upload a syllabus first.</p>
              ) : (
                <pre className="whitespace-pre-wrap break-words text-xs">
                  title,start,allDay,description,location,class{"\n"}
                  {events
                    .map(
                      (e) =>
                        `${e.title},${e.start},${String(e.allDay)},${e.description ?? ''},${e.location ?? ''},${e.class ?? ''}`,
                    )
                    .join('\n')}
                </pre>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Step 3: Export ── */}
      {step === 3 && (
        <div className={`flex flex-col gap-6 transition-all duration-500 ease-out animate-[fadeInUp_260ms_ease-out]${showPlannerDropdown ? ' pb-40' : ''}`}>
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-gray-200 p-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Export to Google Calendar</h3>
              <p className="text-sm text-gray-500">
                Connect your Google account and add your calendar to Google Calendar.
              </p>
            </div>

            <div className="mt-6 grid gap-3">
              {/* ── Connection row ── */}
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                <div className="flex min-h-[44px] items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">Connect Account</p>
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
                    <p className="text-sm font-semibold text-gray-900">Select Calendar</p>
                    <p className="text-xs text-gray-500">
                      {isGoogleConnected
                        ? 'Create or select calendar to export events to.'
                        : 'Connect your Google account to create or select a calendar to export to.'}
                    </p>
                  </div>

                  {isGoogleConnected ? (
                    <div className="inline-flex items-center gap-2">
                      <CalendarPicker
                        selectedCalendarId={selectedCalendarId}
                        selectedCalendarSummary={selectedCalendarSummary}
                        refetchTrigger={calendarRefetchTrigger}
                        onSelect={(id, summary) => {
                          setSelectedCalendarId(id);
                          setSelectedCalendarSummary(summary);
                          try {
                            localStorage.setItem(CALENDAR_PREF_KEY, JSON.stringify({ id, summary }));
                          } catch { /* ignore */ }
                          if (hasSynced) {
                            setHasSynced(false);
                            setSyncBurst(false);
                            setCalendarStatus('idle');
                            setCalendarMessage('');
                          }
                        }}
                      />
                      <CreateCalendarDialog
                        accessToken={accessToken!}
                        onCalendarCreated={(id, summary) => {
                          setCalendarRefetchTrigger((t) => t + 1);
                          setSelectedCalendarId(id);
                          setSelectedCalendarSummary(summary);
                          try {
                            localStorage.setItem(CALENDAR_PREF_KEY, JSON.stringify({ id, summary }));
                          } catch { /* ignore */ }
                        }}
                      />
                    </div>
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
                    <p className="text-sm font-semibold text-gray-900">Export to Calendar</p>
                    <p className="text-xs text-gray-500">
                      {isSyncComplete
                        ? calendarMessage || `Exported to ${selectedCalendarId === 'primary' ? 'your default calendar' : `"${selectedCalendarSummary}"`}`
                        : hasEvents
                          ? `${events.length} event${events.length !== 1 ? 's' : ''} ready to export to your Google Calendar.`
                          : 'No events yet.'}
                      {!isSyncComplete && !isGoogleConnected ? ' Connect your Google account to continue.' : ''}
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
                    title={!isGoogleConnected ? 'Connect your Google account to enable exporting.' : undefined}
                  >
                    <span className="inline-flex items-center gap-2">
                      <CalendarCheck
                        className={'h-4 w-4 ' + (calendarStatus === 'loading' ? 'animate-pulse' : '')}
                      />
                      {calendarStatus === 'loading' ? 'Exporting…' : isSyncComplete ? 'Exported' : 'Export'}
                    </span>
                  </button>
                </div>
              </div>

              {/* ── Error banner (error only) ── */}
              {calendarStatus === 'error' && calendarMessage && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  <div className="flex items-start gap-2">
                    <Trash2 className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" />
                    <p>{calendarMessage}</p>
                  </div>
                </div>
              )}

              {/* ── Upload to Planner row (expands inline) ── */}
              <div
                className={'rounded-xl border bg-white px-4 py-3 transition-[border-color] duration-300 border-gray-200 border-gray-200'}
                ref={plannerDropdownRef}
              >
                {/* Header — always visible */}
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">Export to Planner</p>
                    <p className={`text-xs ${plannerUploadStatus === 'error' ? 'text-gray-500' : 'text-gray-500'}`}>
                      {plannerUploadStatus === 'done'
                        ? plannerUploadMsg
                        : plannerUploadStatus === 'error'
                          ? plannerUploadMsg
                          : !isLoggedIn
                            ? 'Sign in to upload to your planner.'
                            : assignmentExamEvents.length > 0
                              ? `${assignmentExamEvents.length} assignment${assignmentExamEvents.length !== 1 ? 's' : ''} and exam${assignmentExamEvents.length !== 1 ? 's' : ''} ready to export to your planner.`
                              : 'No assignments or exams found.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleOpenPlannerUpload()}
                    disabled={!isLoggedIn || !hasEvents || assignmentExamEvents.length === 0 || plannerUploadStatus === 'uploading'}
                    className={
                      syncButtonClassName +
                      (!isLoggedIn || !hasEvents || assignmentExamEvents.length === 0 || plannerUploadStatus === 'uploading'
                        ? primaryPurpleDisabled
                        : plannerUploadStatus === 'done'
                          ? syncedWhite
                          : primaryPurple) +
                      (isLoggedIn && plannerUploadStatus !== 'done' && assignmentExamEvents.length > 0 && plannerUploadStatus !== 'uploading'
                        ? ' hover:-translate-y-[1px]'
                        : '')
                    }
                  >
                    <span className="inline-flex items-center gap-2">
                      {plannerUploadStatus === 'done' ? (
                        <>
                        
                        <BookOpen className="h-4 w-4 animate-pulse" />
                        Exported
                        </>
                      ) : plannerUploadStatus === 'uploading' ? (
                        <>
                          <BookOpen className="h-4 w-4 animate-pulse" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <BookOpen className="h-4 w-4" />
                          Export
                        </>
                      )}
                    </span>
                  </button>
                </div>

                {showPlannerDropdown && (
                  <div className="pt-4 mt-3 border-t border-gray-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-700">Map Classes to Courses</p>
                      </div>
                      {(() => {
                        const totalMappingPages = Math.max(1, Math.ceil(classMappings.length / PLANNER_MAPPINGS_PER_PAGE));
                        const visibleMappings = classMappings.slice(
                          plannerMappingPage * PLANNER_MAPPINGS_PER_PAGE,
                          (plannerMappingPage + 1) * PLANNER_MAPPINGS_PER_PAGE
                        );
                        return (
                          <>
                            <div className="space-y-2">
                              {visibleMappings.map((mapping) => {
                                const idx = classMappings.indexOf(mapping);
                                return (
                                  <div key={mapping.className} className="space-y-1.5">
                                    <p className="text-[11px] font-medium text-slate-500 truncate">{mapping.className}</p>
                                    <CoursePicker
                                      courses={existingCourses}
                                      selectedId={mapping.selectedCourseId}
                                      onSelect={(id) => setClassMappings((prev) => {
                                        const next = [...prev];
                                        next[idx] = { ...next[idx], selectedCourseId: id };
                                        return next;
                                      })}
                                    />
                                    {mapping.selectedCourseId === 'new' && (
                                      <input
                                        type="text"
                                        value={mapping.newCourseName}
                                        onChange={(e) => setClassMappings((prev) => {
                                          const next = [...prev];
                                          next[idx] = { ...next[idx], newCourseName: e.target.value };
                                          return next;
                                        })}
                                        placeholder="New course name"
                                        className="w-full rounded-lg border border-slate-300 bg-white text-slate-600 px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            {totalMappingPages > 1 && (
                              <div className="flex items-center justify-between pt-1">
                                <p className="text-[11px] text-slate-400">
                                  {plannerMappingPage * PLANNER_MAPPINGS_PER_PAGE + 1}–{Math.min((plannerMappingPage + 1) * PLANNER_MAPPINGS_PER_PAGE, classMappings.length)} of {classMappings.length}
                                </p>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setPlannerMappingPage((p) => Math.max(0, p - 1))}
                                    disabled={plannerMappingPage === 0}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPlannerMappingPage((p) => Math.min(totalMappingPages - 1, p + 1))}
                                    disabled={plannerMappingPage >= totalMappingPages - 1}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-50 disab/led:opacity-30 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => { setShowPlannerDropdown(false); setPlannerUploadStatus('idle'); }}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs hover:bg-slate-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleConfirmPlannerUpload()}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors"
                        >
                          Confirm Export
                        </button>
                      </div>
                  </div>
                )}
              </div>
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
                  'group ' +
                  newUploadClassName +
                  ' ' +
                  (isSyncComplete ? newUploadPurple : newUploadNeutral) +
                  (isSyncComplete ? ' hover:-translate-y-[1px]' : '')
                }
              >
                <span className="transition-transform duration-300 group-hover:translate-x-0.5">New Upload →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {reviewEditEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-edit-event-title"
        >
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h2 id="review-edit-event-title" className="text-lg font-semibold text-gray-900 mb-4">
              Edit event
            </h2>
            {reviewDeleteConfirm ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-700">
                  Remove this event from the list? It will not be synced to Google Calendar.
                </p>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setReviewDeleteConfirm(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleReviewEditDelete}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleReviewEditSave} className="space-y-4">
                <div>
                  <label htmlFor="rev-title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    id="rev-title"
                    type="text"
                    value={revTitle}
                    onChange={(e) => setRevTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Event title"
                  />
                </div>
                <div>
                  <label htmlFor="rev-date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    id="rev-date"
                    type="date"
                    value={revDate}
                    onChange={(e) => setRevDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="rev-allday"
                    type="checkbox"
                    checked={revAllDay}
                    onChange={(e) => setRevAllDay(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="rev-allday" className="text-sm text-gray-700">All day</label>
                </div>
                {!revAllDay && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="rev-start-time" className="block text-sm font-medium text-gray-700 mb-1">Start time</label>
                      <input
                        id="rev-start-time"
                        type="time"
                        value={revStartTime}
                        onChange={(e) => setRevStartTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="rev-end-time" className="block text-sm font-medium text-gray-700 mb-1">End time</label>
                      <input
                        id="rev-end-time"
                        type="time"
                        value={revEndTime}
                        onChange={(e) => setRevEndTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Repeat</label>
                  <select
                    value={revRepeat}
                    onChange={(e) => setRevRepeat(e.target.value as 'none' | 'daily' | 'weekdays' | 'weekly')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="none">Does not repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekdays">Weekdays (M–F)</option>
                    <option value="weekly">Weekly — pick which days below</option>
                  </select>
                  {revRepeat === 'weekly' && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 mb-1.5">Repeat on these days:</p>
                      <div className="grid grid-cols-7 gap-1">
                        {WEEKLY_REPEAT_DAY_LABELS.map((label, i) => (
                          <label key={label} className="inline-flex items-center justify-center gap-1 px-1 py-1 rounded border border-gray-300 bg-white text-gray-900 text-xs cursor-pointer hover:bg-gray-50 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-100">
                            <input
                              type="checkbox"
                              checked={revWeeklyDays[i]}
                              onChange={(e) => {
                                const next = [...revWeeklyDays];
                                next[i] = e.target.checked;
                                setRevWeeklyDays(next);
                              }}
                              className="rounded border-gray-300 text-indigo-600"
                            />
                            <span className="font-medium shrink-0">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {(revRepeat === 'daily' || revRepeat === 'weekdays' || revRepeat === 'weekly') && (
                    <div className="mt-2 space-y-2">
                      <label className="block text-xs text-gray-600">Ends</label>
                      <select
                        value={revEndType}
                        onChange={(e) => setRevEndType(e.target.value as 'never' | 'date' | 'count')}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                      >
                        <option value="never">Never</option>
                        <option value="date">On a specific date</option>
                        <option value="count">After a number of occurrences</option>
                      </select>
                      {revEndType === 'date' && (
                        <input
                          type="date"
                          value={revEndDate}
                          onChange={(e) => setRevEndDate(e.target.value)}
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                        />
                      )}
                      {revEndType === 'count' && (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            value={revEndCount}
                            onChange={(e) => setRevEndCount(parseInt(e.target.value, 10) || 5)}
                            className="w-20 px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                          />
                          <span className="text-sm text-gray-600">occurrences</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label htmlFor="rev-desc" className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                  <textarea
                    id="rev-desc"
                    value={revDescription}
                    onChange={(e) => setRevDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Description"
                  />
                </div>
                <div className="flex flex-wrap gap-2 justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setReviewDeleteConfirm(true)}
                    className="px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 border border-red-200"
                  >
                    Delete event
                  </button>
                  <div className="flex gap-2">
                    <button type="button" onClick={closeReviewEdit} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700">
                      Save
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {showRegenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Regenerate Events
            </h3>

            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" className="rounded border-gray-300" />
                Lectures
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" className="rounded border-gray-300" />
                Assignments
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" className="rounded border-gray-300" />
                Exams
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRegenerateModal(false)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRegenerateModal(false);
                  void processPendingText();
                }}
                className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
