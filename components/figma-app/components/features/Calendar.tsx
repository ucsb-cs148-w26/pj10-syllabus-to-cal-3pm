'use client';

import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, ChevronDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import type { GoogleCalendarEventItem } from '@/lib/googleCalendar';

interface CalendarMeta {
  id: string;
  summary: string;
  primary?: boolean;
  backgroundColor: string;
}

function CalendarMultiPicker({
  selectedIds,
  onChange,
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [calendars, setCalendars] = useState<CalendarMeta[]>([]);
  const [fetchStatus, setFetchStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (fetchStatus !== 'idle') return;
    setFetchStatus('loading');
    fetch('/api/calendar/calendars')
      .then((res) => res.json())
      .then((data) => {
        if (data.calendars) {
          const list = (data.calendars as CalendarMeta[]).filter((c) => !c.primary);
          setCalendars([{ id: 'primary', summary: 'Default calendar', primary: true, backgroundColor: '#4285f4' }, ...list]);
        }
        setFetchStatus('ok');
      })
      .catch(() => setFetchStatus('error'));
  }, [open, fetchStatus]);

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      const next = selectedIds.filter((x) => x !== id);
      onChange(next.length ? next : ['primary']);
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const displayLabel =
    selectedIds.length === 0
      ? 'No calendars'
      : selectedIds.length === 1
        ? (calendars.find((c) => c.id === selectedIds[0])?.summary ?? selectedIds[0])
        : `${selectedIds.length} calendars`;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
      >
        <span className="truncate max-w-[140px]">{displayLabel}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 min-w-[220px] max-w-[300px] rounded-xl border border-gray-200 bg-white shadow-lg py-2">
          {fetchStatus === 'loading' && (
            <div className="flex gap-2 px-4 py-3 text-xs text-gray-500">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              Loading calendars…
            </div>
          )}
          {fetchStatus === 'error' && (
            <div className="px-4 py-3 text-xs text-rose-600">Could not load calendars.</div>
          )}
          {fetchStatus === 'ok' && (
            <div className="max-h-60 overflow-y-auto">
              {calendars.map((cal) => (
                <label
                  key={cal.id}
                  className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-xs text-gray-700 hover:bg-gray-50"
                >
                  <Checkbox
                    checked={selectedIds.includes(cal.id)}
                    onCheckedChange={() => toggle(cal.id)}
                  />
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: cal.backgroundColor }} />
                  <span className="truncate">
                    {cal.summary}
                    {cal.primary && <span className="ml-1 text-gray-400">(primary)</span>}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface CalendarProps {
  accessToken: string | null;
  onGoToUploads?: () => void;
}

/** Display event: normalized for calendar day; includes start/end for edit. */
interface DisplayEvent {
  id: string;
  title: string;
  date: Date;
  start: string;
  end: string;
  allDay: boolean;
  description?: string;
  recurrence?: string[];
  type: 'google';
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
/** Day labels for weekly repeat checkboxes — one per box so user knows which day: Sun, M, Tue, W, Th, F, Sat */
const WEEKLY_REPEAT_DAY_LABELS = ['Sun', 'M', 'Tue', 'W', 'Th', 'F', 'Sat'];

/** Format time from ISO or date string for display (e.g. "8:00 AM"). Returns empty string for all-day. */
function formatEventTime(start: string, allDay: boolean): string {
  if (allDay || !start.includes('T')) return '';
  const d = new Date(start);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/** Format end time for display. */
function formatEventEndTime(end: string, allDay: boolean): string {
  if (allDay || !end.includes('T')) return '';
  const d = new Date(end);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/** Get HH:mm from ISO or date string for time input value. */
function getTimeFromISO(iso: string): string {
  if (!iso.includes('T')) return '09:00';
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const RRULE_DAY_MAP = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] as const;

/** Build RRULE array for Google Calendar from simple recurrence options. */
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
    parts.push('FREQ=WEEKLY;BYDAY=' + days.join(','));
  } else return [];
  if (endType === 'date' && endDate) {
    const d = new Date(endDate + 'T23:59:59');
    parts.push('UNTIL=' + d.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z');
  } else if (endType === 'count' && endCount > 0) {
    parts.push('COUNT=' + endCount);
  }
  return ['RRULE:' + parts.join(';')];
}

/** Parse RRULE (if any) into simple repeat type for form. */
function parseRecurrenceToRepeat(rrules: string[] | undefined): 'none' | 'daily' | 'weekdays' | 'weekly' {
  if (!rrules || rrules.length === 0) return 'none';
  const r = rrules[0].replace(/^RRULE:/i, '');
  if (r.includes('FREQ=DAILY')) return 'daily';
  if (r.includes('BYDAY=MO,TU,WE,TH,FR') && !r.includes('SA') && !r.includes('SU')) return 'weekdays';
  if (r.includes('FREQ=WEEKLY')) return 'weekly';
  return 'none';
}

/** Human-readable recurrence summary for view modal. */
function recurrenceSummary(rrules: string[] | undefined): string {
  if (!rrules || rrules.length === 0) return 'Does not repeat';
  const r = rrules[0].replace(/^RRULE:/i, '');
  if (r.includes('FREQ=DAILY')) return 'Repeats daily';
  if (r.includes('BYDAY=MO,TU,WE,TH,FR') && !r.includes('SA') && !r.includes('SU')) return 'Repeats on weekdays (M–F)';
  if (r.includes('FREQ=WEEKLY')) {
    const byday = r.match(/BYDAY=([^;]+)/);
    if (byday) return 'Repeats weekly on ' + byday[1].replace(/,/g, ', ');
    return 'Repeats weekly';
  }
  return 'Repeats';
}

function toDisplayEvents(items: GoogleCalendarEventItem[]): DisplayEvent[] {
  return items.map((e) => {
    const d = e.start.includes('T') ? new Date(e.start) : new Date(e.start + 'T12:00:00');
    return {
      id: e.id,
      title: e.title,
      date: d,
      start: e.start,
      end: e.end ?? e.start,
      allDay: e.allDay,
      description: e.description,
      recurrence: e.recurrence,
      type: 'google',
    };
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getWeekStart(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

function getWeekEnd(d: Date): Date {
  const start = getWeekStart(d);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return end;
}

function WeekView({
  weekStart,
  events,
  accessToken,
  openCreateForDate,
  openViewForEvent,
  formatEventTime,
}: {
  weekStart: Date;
  events: DisplayEvent[];
  accessToken: string | null;
  openCreateForDate: (dateStr: string) => void;
  openViewForEvent: (event: DisplayEvent) => void;
  formatEventTime: (start: string, allDay: boolean) => string;
}) {
  const hours = Array.from({ length: 15 }, (_, i) => i + 6); // 6am to 8pm
  const today = new Date();

  const getDateForDay = (d: number) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + d);
    return date;
  };

  const getDateStr = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const getEventsForDate = (date: Date) => events.filter((e) => isSameDay(e.date, date));

  return (
    <div className="grid grid-cols-8 border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Time column + 7 day columns */}
      <div className="bg-gray-100 border-r border-gray-200 w-14 shrink-0" />
      {Array.from({ length: 7 }).map((_, d) => {
        const date = getDateForDay(d);
        const isTodayCell = isSameDay(date, today);
        return (
          <div
            key={d}
            role="button"
            tabIndex={0}
            onClick={() => {
              if (!accessToken) return;
              openCreateForDate(getDateStr(date));
            }}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && accessToken) {
                e.preventDefault();
                openCreateForDate(getDateStr(date));
              }
            }}
            className={`p-2 border-b border-r border-gray-200 text-center min-w-0 ${
              isTodayCell ? 'bg-indigo-100 font-semibold text-indigo-800' : 'text-gray-700'
            } ${accessToken ? 'cursor-pointer hover:bg-gray-50' : ''}`}
          >
            <div className="text-xs text-gray-500">{DAY_NAMES_SHORT[d]}</div>
            <div className="text-lg">{date.getDate()}</div>
          </div>
        );
      })}
      {/* All-day row */}
      <div className="bg-gray-100 border-r border-b border-gray-200 py-1 pr-1 text-right text-xs text-gray-500 font-medium w-14 shrink-0">
        All day
      </div>
      {Array.from({ length: 7 }).map((_, d) => {
        const date = getDateForDay(d);
        const dayEvents = getEventsForDate(date).filter((e) => e.allDay);
        return (
          <div key={d} className="min-h-[52px] border-b border-r border-gray-200 p-1 space-y-0.5 overflow-y-auto">
            {dayEvents.map((ev) => (
              <div
                key={ev.id}
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!accessToken) return;
                  openViewForEvent(ev);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (!accessToken) return;
                    openViewForEvent(ev);
                  }
                }}
                className="text-xs px-1 py-0.5 rounded bg-indigo-400 text-white truncate cursor-pointer hover:bg-indigo-500"
              >
                {ev.title}
              </div>
            ))}
          </div>
        );
      })}
      {/* Hour rows */}
      {hours.map((hour) => (
        <Fragment key={hour}>
          <div className="bg-gray-100 border-r border-b border-gray-200 py-1 pr-1 text-right text-xs text-gray-500 font-medium w-14 shrink-0">
            {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
          </div>
          {Array.from({ length: 7 }).map((_, d) => {
            const date = getDateForDay(d);
            const dayEvents = getEventsForDate(date).filter((e) => !e.allDay);
            const hourEvents = dayEvents.filter((e) => new Date(e.start).getHours() === hour);
            return (
              <div
                key={d}
                className="min-h-[44px] border-b border-r border-gray-200 p-0.5 space-y-0.5"
              >
                {hourEvents.map((ev) => (
                  <div
                    key={ev.id}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!accessToken) return;
                      openViewForEvent(ev);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (!accessToken) return;
                        openViewForEvent(ev);
                      }
                    }}
                    className="text-xs px-1 py-0.5 rounded bg-indigo-500 text-white truncate cursor-pointer hover:bg-indigo-600"
                    title={ev.title}
                  >
                    {formatEventTime(ev.start, false)} {ev.title}
                  </div>
                ))}
              </div>
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}

const DISPLAY_CALENDARS_KEY = 'syllabus_calendar_display_ids';

export function Calendar({ accessToken, onGoToUploads }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<DisplayEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [eventsLoadError, setEventsLoadError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return ['primary'];
    try {
      const saved = localStorage.getItem(DISPLAY_CALENDARS_KEY);
      if (saved) {
        const ids = JSON.parse(saved);
        if (Array.isArray(ids) && ids.length > 0) return ids;
      }
    } catch { /* ignore */ }
    return ['primary'];
  });
  /** Cache events by period key to avoid refetch on every arrow click */
  const eventsCacheRef = useRef<Map<string, DisplayEvent[]>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchIdRef = useRef(0);
  const fetchInProgressRef = useRef<string | null>(null);
  /** When a response arrives, only apply it if we're still displaying this period (avoids overwriting current month with stale data). */
  const displayedPeriodRef = useRef<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createDate, setCreateDate] = useState('');
  const [createAllDay, setCreateAllDay] = useState(true);
  const [createStartTime, setCreateStartTime] = useState('09:00');
  const [createEndTime, setCreateEndTime] = useState('10:00');
  const [createDescription, setCreateDescription] = useState('');
  const [createRepeat, setCreateRepeat] = useState<'none' | 'daily' | 'weekdays' | 'weekly'>('none');
  const [createWeeklyDays, setCreateWeeklyDays] = useState([false, false, true, true, true, true, false]); // Sun-Sat, default M-F
  const [createEndType, setCreateEndType] = useState<'never' | 'date' | 'count'>('never');
  const [createEndDate, setCreateEndDate] = useState('');
  const [createEndCount, setCreateEndCount] = useState(5);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<DisplayEvent | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editAllDay, setEditAllDay] = useState(true);
  const [editStartTime, setEditStartTime] = useState('09:00');
  const [editEndTime, setEditEndTime] = useState('10:00');
  const [editDescription, setEditDescription] = useState('');
  const [editRepeat, setEditRepeat] = useState<'none' | 'daily' | 'weekdays' | 'weekly'>('none');
  const [editWeeklyDays, setEditWeeklyDays] = useState([false, false, true, true, true, true, false]);
  const [editEndType, setEditEndType] = useState<'never' | 'date' | 'count'>('never');
  const [editEndDate, setEditEndDate] = useState('');
  const [editEndCount, setEditEndCount] = useState(5);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewingEvent, setViewingEvent] = useState<DisplayEvent | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

  const calKey = [...selectedCalendarIds].sort().join(',');
  const periodKey = viewMode === 'week' ? getWeekStart(currentDate).toISOString().slice(0, 10) : monthKey;
  const fullCacheKey = `${periodKey}|${calKey}`;
  displayedPeriodRef.current = fullCacheKey;

  const fetchEvents = useCallback(async (bypassCache = false) => {
    if (!accessToken) {
      setEvents([]);
      setEventsLoadError(null);
      return;
    }
    const cacheKey = fullCacheKey;
    if (!bypassCache) {
      const cached = eventsCacheRef.current.get(cacheKey);
      if (cached !== undefined) {
        setEvents(cached);
        setEventsLoadError(null);
        return;
      }
      if (fetchInProgressRef.current === cacheKey) return;
    }
    fetchInProgressRef.current = cacheKey;
    // Cancel any in-flight request for a different period (avoids duplicate calls when switching month/week)
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    const id = ++fetchIdRef.current;
    const responseForPeriod = cacheKey;
    setLoading(true);
    setEventsLoadError(null);
    try {
      const calendarsParam = encodeURIComponent(selectedCalendarIds.join(','));
      const base =
        viewMode === 'week'
          ? `/api/calendar/events?timeMin=${getWeekStart(currentDate).toISOString()}&timeMax=${getWeekEnd(currentDate).toISOString()}`
          : `/api/calendar/events?month=${monthKey}`;
      const url = `${base}&calendars=${calendarsParam}`;
      const res = await fetch(url, { signal });
      const data = await res.json();
      if (id !== fetchIdRef.current) return; // stale response, ignore
      if (!res.ok) throw new Error(data.error ?? 'Failed to load events');
      const list = toDisplayEvents(data.events ?? []);
      eventsCacheRef.current.set(cacheKey, list); // always cache for when user navigates back
      if (displayedPeriodRef.current === responseForPeriod) setEvents(list);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        fetchInProgressRef.current = null;
        return;
      }
      if (id !== fetchIdRef.current) return;
      setEvents([]);
      const message = err instanceof Error ? err.message : 'Failed to load events';
      setEventsLoadError(message);
      console.error(err);
    } finally {
      if (id === fetchIdRef.current) {
        setLoading(false);
        fetchInProgressRef.current = null;
      }
    }
  }, [accessToken, monthKey, viewMode, currentDate, selectedCalendarIds, fullCacheKey]);

  useEffect(() => {
    fetchEvents();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [fetchEvents]);

  const getDaysInMonth = (date: Date) => {
    const y = date.getFullYear();
    const m = date.getMonth();
    const lastDay = new Date(y, m + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = new Date(y, m, 1).getDay();
    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const previousWeek = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() - 7);
    setCurrentDate(next);
  };

  const nextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 7);
    setCurrentDate(next);
  };

  const getEventsForDay = (day: number) => {
    const dateToCheck = new Date(year, month, day);
    return events.filter(
      (event) =>
        event.date.getDate() === dateToCheck.getDate() &&
        event.date.getMonth() === dateToCheck.getMonth() &&
        event.date.getFullYear() === dateToCheck.getFullYear()
    );
  };

  const openCreateForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setCreateDate(dateStr);
    setCreateTitle('');
    setCreateDescription('');
    setCreateError('');
    setCreateOpen(true);
  };

  const openViewForEvent = (event: DisplayEvent) => {
    setViewingEvent(event);
    setViewOpen(true);
  };

  const openEditForEvent = (event: DisplayEvent) => {
    setViewOpen(false);
    setViewingEvent(null);
    setEditingEvent(event);
    setEditTitle(event.title);
    const d = event.start.includes('T') ? event.start.slice(0, 10) : event.start;
    setEditDate(d);
    setEditAllDay(event.allDay);
    setEditStartTime(getTimeFromISO(event.start));
    setEditEndTime(getTimeFromISO(event.end));
    setEditDescription(event.description ?? '');
    setEditRepeat(parseRecurrenceToRepeat(event.recurrence));
    setEditError('');
    setEditOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !createTitle.trim()) return;
    setCreateError('');
    setCreateSubmitting(true);
    try {
      const start = createAllDay
        ? createDate + 'T00:00:00'
        : createDate + 'T' + createStartTime + ':00';
      const end = createAllDay
        ? createDate + 'T00:00:00'
        : createDate + 'T' + createEndTime + ':00';
      const recurrence = buildRecurrence(
        createRepeat,
        createWeeklyDays,
        createEndType,
        createEndDate,
        createEndCount
      );
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: [
            {
              title: createTitle.trim(),
              start,
              end: createAllDay ? undefined : end,
              allDay: createAllDay,
              description: createDescription.trim() || undefined,
              recurrence: recurrence.length ? recurrence : undefined,
            },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create event');
      setCreateOpen(false);
      setCreateTitle('');
      setCreateDate('');
      setCreateDescription('');
      fetchEvents(true);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !editingEvent || !editTitle.trim()) return;
    setEditError('');
    setEditSubmitting(true);
    try {
      const start = editAllDay ? editDate + 'T00:00:00' : editDate + 'T' + editStartTime + ':00';
      const end = editAllDay ? editDate + 'T00:00:00' : editDate + 'T' + editEndTime + ':00';
      const recurrence = buildRecurrence(
        editRepeat,
        editWeeklyDays,
        editEndType,
        editEndDate,
        editEndCount
      );
      const res = await fetch('/api/calendar/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: editingEvent.id,
          title: editTitle.trim(),
          start,
          end,
          allDay: editAllDay,
          description: editDescription.trim() || undefined,
          recurrence: recurrence.length ? recurrence : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to update event');
      setEditOpen(false);
      setEditingEvent(null);
      fetchEvents(true);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update event');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!accessToken) return;
    setDeleteSubmitting(true);
    try {
      const res = await fetch('/api/calendar/events', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to delete event');
      setDeleteConfirmId(null);
      fetchEvents(true);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  const defaultCreateDate =
    month === today.getMonth() && year === today.getFullYear()
      ? today.getDate()
      : 1;
  const createDateValue =
    createDate ||
    `${year}-${String(month + 1).padStart(2, '0')}-${String(defaultCreateDate).padStart(2, '0')}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-gray-900 mb-2">Your Schedule</h2>
          <p className="text-gray-600">
            {accessToken
              ? 'Your Google Calendar events for the selected month'
              : 'Connect your Google account to see and add events'}
          </p>
        </div>
        {accessToken && (
          <div className="flex items-center gap-3">
            <CalendarMultiPicker
              selectedIds={selectedCalendarIds}
              onChange={(ids) => {
                setSelectedCalendarIds(ids);
                try {
                  localStorage.setItem(DISPLAY_CALENDARS_KEY, JSON.stringify(ids));
                } catch { /* ignore */ }
                eventsCacheRef.current.clear();
              }}
            />
            <button
              type="button"
              onClick={() => {
                setCreateDate(createDateValue);
                setCreateOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add event
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToToday}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => (viewMode === 'month' ? previousMonth() : previousWeek())}
              aria-label={viewMode === 'month' ? 'Previous month' : 'Previous week'}
              title={viewMode === 'month' ? 'Previous month' : 'Previous week'}
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => (viewMode === 'month' ? nextMonth() : nextWeek())}
              aria-label={viewMode === 'month' ? 'Next month' : 'Next week'}
              title={viewMode === 'month' ? 'Next month' : 'Next week'}
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-semibold text-gray-900 min-w-[180px]">
              {viewMode === 'month'
                ? `${MONTH_NAMES[month]} ${year}`
                : (() => {
                    const start = getWeekStart(currentDate);
                    const end = new Date(start);
                    end.setDate(end.getDate() + 6);
                    return `${start.getMonth() + 1}/${start.getDate()} – ${end.getMonth() + 1}/${end.getDate()}, ${year}`;
                  })()}
            </h3>
          </div>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'month' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'week' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Week
            </button>
          </div>
        </div>

        <div className="p-6">
          {!accessToken && (
            <div className="mb-4 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <p className="text-gray-700 font-medium mb-2">Your calendar events will show here</p>
              <p className="text-sm text-gray-500 mb-4">Connect your Google account on the Uploads page, then come back to see and add events.</p>
              {onGoToUploads ? (
                <button
                  type="button"
                  onClick={onGoToUploads}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700"
                >
                  Go to Uploads to connect
                </button>
              ) : (
                <p className="text-sm text-gray-600">Click <strong>Uploads</strong> in the menu above to connect.</p>
              )}
            </div>
          )}
          {eventsLoadError && accessToken && (
            <div className="mb-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
              Couldn&apos;t load Google Calendar events: {eventsLoadError}. Enable &quot;Google Calendar API&quot; in Google Cloud Console if needed, then try reconnecting in Uploads or Profile.
              <button
                type="button"
                onClick={() => fetchEvents(true)}
                className="ml-2 font-medium underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}
          {loading && (
            <p className="text-sm text-gray-500 mb-2">Loading events…</p>
          )}
          {accessToken && !loading && !eventsLoadError && events.length === 0 && (
            <p className="text-sm text-gray-500 mb-2">No events this period. Add one with the button above or in Google Calendar.</p>
          )}

          {viewMode === 'week' ? (
            <WeekView
              weekStart={getWeekStart(currentDate)}
              events={events}
              accessToken={accessToken}
              openCreateForDate={(dateStr) => {
                setCreateDate(dateStr);
                setCreateTitle('');
                setCreateDescription('');
                setCreateError('');
                setCreateOpen(true);
              }}
              openViewForEvent={openViewForEvent}
              formatEventTime={formatEventTime}
            />
          ) : (
            <>
          <div className="grid grid-cols-7 gap-2 mb-2">
            {DAY_NAMES_SHORT.map((day) => (
              <div key={day} className="text-center font-semibold text-gray-700 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: startingDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const dayEvents = getEventsForDay(day);
              return (
                <div
                  key={day}
                  role="button"
                  tabIndex={0}
                  onClick={() => accessToken && openCreateForDay(day)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && accessToken) {
                      e.preventDefault();
                      openCreateForDay(day);
                    }
                  }}
                  className={`aspect-square border border-gray-200 rounded-lg p-2 transition-colors flex flex-col min-h-0 ${
                    accessToken ? 'hover:bg-gray-50 cursor-pointer' : ''
                  } ${isToday(day) ? 'bg-indigo-50 border-indigo-300' : ''}`}
                  aria-label={accessToken ? `Add event for ${MONTH_NAMES[month]} ${day}` : undefined}
                >
                  <div
                    className={`font-medium text-sm mb-1 shrink-0 ${
                      isToday(day) ? 'text-indigo-600' : 'text-gray-700'
                    }`}
                  >
                    {day}
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-0.5">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!accessToken) return;
                          openViewForEvent(event);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!accessToken) return;
                            openViewForEvent(event);
                          }
                        }}
                        className="text-xs px-1 py-0.5 rounded truncate bg-indigo-500 text-white hover:bg-indigo-600 cursor-pointer"
                        title={`${event.title} (click to view)`}
                      >
                        {formatEventTime(event.start, event.allDay)
                          ? `${formatEventTime(event.start, event.allDay)} ${event.title}`
                          : event.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
            </>
          )}
        </div>
      </div>

      {createOpen && accessToken && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-event-title"
        >
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 w-full max-w-md mx-4">
            <h3 id="create-event-title" className="text-lg font-semibold text-gray-900 mb-4">
              Create event
            </h3>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label htmlFor="create-title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  id="create-title"
                  type="text"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Event title"
                />
              </div>
              <div>
                <label htmlFor="create-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  id="create-date"
                  type="date"
                  value={createDate || createDateValue}
                  onChange={(e) => setCreateDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="create-allday"
                  type="checkbox"
                  checked={createAllDay}
                  onChange={(e) => setCreateAllDay(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="create-allday" className="text-sm text-gray-700">
                  All day
                </label>
              </div>
              {!createAllDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="create-start-time" className="block text-sm font-medium text-gray-700 mb-1">
                      Start time
                    </label>
                    <input
                      id="create-start-time"
                      type="time"
                      value={createStartTime}
                      onChange={(e) => setCreateStartTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="create-end-time" className="block text-sm font-medium text-gray-700 mb-1">
                      End time
                    </label>
                    <input
                      id="create-end-time"
                      type="time"
                      value={createEndTime}
                      onChange={(e) => setCreateEndTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Repeat</label>
                <select
                  value={createRepeat}
                  onChange={(e) => setCreateRepeat(e.target.value as 'none' | 'daily' | 'weekdays' | 'weekly')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="none">Does not repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekdays">Weekdays (M–F)</option>
                  <option value="weekly">Weekly — pick which days below</option>
                </select>
                {createRepeat === 'weekly' && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 mb-1.5">Repeat on these days (check all that apply):</p>
                    <div className="grid grid-cols-7 gap-1">
                      {WEEKLY_REPEAT_DAY_LABELS.map((label, i) => (
                        <label
                          key={i}
                          className="inline-flex items-center justify-center gap-1 px-1 py-1 rounded border border-gray-300 bg-white text-gray-900 text-xs cursor-pointer hover:bg-gray-50 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-100"
                        >
                          <input
                            type="checkbox"
                            checked={createWeeklyDays[i]}
                            onChange={(e) => {
                              const next = [...createWeeklyDays];
                              next[i] = e.target.checked;
                              setCreateWeeklyDays(next);
                            }}
                            className="rounded border-gray-300 text-indigo-600"
                            aria-label={`Repeat on ${DAY_NAMES_SHORT[i]}`}
                          />
                          <span className="font-medium text-gray-900 shrink-0">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {(createRepeat === 'daily' || createRepeat === 'weekdays' || createRepeat === 'weekly') && (
                  <div className="mt-2 space-y-2">
                    <label className="block text-xs text-gray-600">Ends</label>
                    <select
                      value={createEndType}
                      onChange={(e) => setCreateEndType(e.target.value as 'never' | 'date' | 'count')}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                    >
                      <option value="never">Never</option>
                      <option value="date">On a specific date</option>
                      <option value="count">After a number of occurrences</option>
                    </select>
                    {createEndType === 'date' && (
                      <input
                        type="date"
                        value={createEndDate}
                        onChange={(e) => setCreateEndDate(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                        aria-label="End date"
                      />
                    )}
                    {createEndType === 'count' && (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          value={createEndCount}
                          onChange={(e) => setCreateEndCount(parseInt(e.target.value, 10) || 5)}
                          className="w-20 px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                          aria-label="Number of occurrences"
                        />
                        <span className="text-sm text-gray-600">occurrences</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="create-desc" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="create-desc"
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Description"
                />
              </div>
              {createError && (
                <p className="text-sm text-red-600">{createError}</p>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {createSubmitting ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewOpen && accessToken && viewingEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="view-event-title"
        >
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 w-full max-w-md mx-4">
            <h3 id="view-event-title" className="text-lg font-semibold text-gray-900 mb-4">
              {viewingEvent.title}
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <p>
                {viewingEvent.start.includes('T')
                  ? `${viewingEvent.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} · ${formatEventTime(viewingEvent.start, false)}${formatEventEndTime(viewingEvent.end, false) ? ` – ${formatEventEndTime(viewingEvent.end, false)}` : ''}`
                  : viewingEvent.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) + ' · All day'}
              </p>
              {viewingEvent.description && (
                <p className="text-gray-600 whitespace-pre-wrap">{viewingEvent.description}</p>
              )}
              <p className="text-gray-500">{recurrenceSummary(viewingEvent.recurrence)}</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-end mt-6 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setViewOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!viewingEvent) return;
                  openEditForEvent(viewingEvent);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmId(viewingEvent.id);
                  setViewOpen(false);
                  setViewingEvent(null);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 border border-red-200"
              >
                <Trash2 className="w-4 h-4" />
                Delete event
              </button>
            </div>
          </div>
        </div>
      )}

      {editOpen && accessToken && editingEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-event-title"
        >
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 w-full max-w-md mx-4">
            <h3 id="edit-event-title" className="text-lg font-semibold text-gray-900 mb-4">
              Edit event
            </h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  id="edit-title"
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Event title"
                />
              </div>
              <div>
                <label htmlFor="edit-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  id="edit-date"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="edit-allday"
                  type="checkbox"
                  checked={editAllDay}
                  onChange={(e) => setEditAllDay(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="edit-allday" className="text-sm text-gray-700">
                  All day
                </label>
              </div>
              {!editAllDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="edit-start-time" className="block text-sm font-medium text-gray-700 mb-1">
                      Start time
                    </label>
                    <input
                      id="edit-start-time"
                      type="time"
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-end-time" className="block text-sm font-medium text-gray-700 mb-1">
                      End time
                    </label>
                    <input
                      id="edit-end-time"
                      type="time"
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Repeat</label>
                <select
                  value={editRepeat}
                  onChange={(e) => setEditRepeat(e.target.value as 'none' | 'daily' | 'weekdays' | 'weekly')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="none">Does not repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekdays">Weekdays (M–F)</option>
                  <option value="weekly">Weekly — pick which days below</option>
                </select>
                {editRepeat === 'weekly' && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 mb-1.5">Repeat on these days (check all that apply):</p>
                    <div className="grid grid-cols-7 gap-1">
                      {WEEKLY_REPEAT_DAY_LABELS.map((label, i) => (
                        <label
                          key={i}
                          className="inline-flex items-center justify-center gap-1 px-1 py-1 rounded border border-gray-300 bg-white text-gray-900 text-xs cursor-pointer hover:bg-gray-50 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-100"
                        >
                          <input
                            type="checkbox"
                            checked={editWeeklyDays[i]}
                            onChange={(e) => {
                              const next = [...editWeeklyDays];
                              next[i] = e.target.checked;
                              setEditWeeklyDays(next);
                            }}
                            className="rounded border-gray-300 text-indigo-600"
                            aria-label={`Repeat on ${DAY_NAMES_SHORT[i]}`}
                          />
                          <span className="font-medium text-gray-900 shrink-0">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {(editRepeat === 'daily' || editRepeat === 'weekdays' || editRepeat === 'weekly') && (
                  <div className="mt-2 space-y-2">
                    <label className="block text-xs text-gray-600">Ends</label>
                    <select
                      value={editEndType}
                      onChange={(e) => setEditEndType(e.target.value as 'never' | 'date' | 'count')}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                    >
                      <option value="never">Never</option>
                      <option value="date">On a specific date</option>
                      <option value="count">After a number of occurrences</option>
                    </select>
                    {editEndType === 'date' && (
                      <input
                        type="date"
                        value={editEndDate}
                        onChange={(e) => setEditEndDate(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                        aria-label="End date"
                      />
                    )}
                    {editEndType === 'count' && (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          value={editEndCount}
                          onChange={(e) => setEditEndCount(parseInt(e.target.value, 10) || 5)}
                          className="w-20 px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                          aria-label="Number of occurrences"
                        />
                        <span className="text-sm text-gray-600">occurrences</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="edit-desc" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="edit-desc"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Description"
                />
              </div>
              {editError && (
                <p className="text-sm text-red-600">{editError}</p>
              )}
              <div className="flex flex-wrap gap-2 justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmId(editingEvent.id);
                    setEditOpen(false);
                    setEditingEvent(null);
                  }}
                  className="px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 border border-red-200"
                >
                  Delete event
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setEditOpen(false); setEditingEvent(null); }}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {editSubmitting ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmId && accessToken && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
        >
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 w-full max-w-sm mx-4">
            <h3 id="delete-confirm-title" className="text-lg font-semibold text-gray-900 mb-2">
              Delete event?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              This will remove the event from your Google Calendar. This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleteSubmitting}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteEvent(deleteConfirmId)}
                disabled={deleteSubmitting}
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deleteSubmitting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {accessToken && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600">
            Events are synced with your Google Calendar. Use the arrows to change month.
          </p>
        </div>
      )}
    </div>
  );
}
