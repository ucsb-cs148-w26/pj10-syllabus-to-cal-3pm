'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
  BookOpen,
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import type { StudySession } from '@/lib/studySessionScheduling';
import { get_events } from '@/components/figma-app/components/features/Uploads';
import { schedule_sessions } from '@/lib/studySessionScheduling';

export interface StudyPlanProps {
  accessToken: string | null;
  onGoToUploads?: () => void;
}

interface Course {
  id: string;
  name: string;
  quarterStart: string;
  quarterEnd: string;
  teacher: string;
  completed: number;
  remaining: number;
  grade?: string;
}

interface CourseEvent {
  id: string;
  title: string;
  date: string;
  googleEventId?: string;
}

const COURSES_STORAGE_KEY = 'syllabus_profile_courses_v1';
const COURSE_EVENTS_STORAGE_KEY = 'syllabus_profile_course_events_v1';

const WEEKLY_REPEAT_DAY_LABELS = ['Sun', 'M', 'Tue', 'W', 'Th', 'F', 'Sat'] as const;
const RRULE_DAY_MAP = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] as const;

const PROGRESS_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-orange-500',
  'bg-rose-500',
  'bg-teal-500',
  'bg-amber-500',
  'bg-cyan-500',
];

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

function getRelativeDate(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr + 'T00:00:00');
  const diffDays = Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0 && diffDays <= 7) {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
  }
  if (diffDays > 7 && diffDays <= 14) return 'Next Week';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const ITEMS_PER_PAGE = 5;

export function StudyPlan({ accessToken, onGoToUploads }: StudyPlanProps) {
  // --- Planner pagination ---
  const [plannerPage, setPlannerPage] = useState(0);
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // --- Courses state ---
  const [courses, setCourses] = useState<Course[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(COURSES_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [courseEvents, setCourseEvents] = useState<Record<string, CourseEvent[]>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = window.localStorage.getItem(COURSE_EVENTS_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  });

  // Per-card details dropdown & pagination
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [cardEventPage, setCardEventPage] = useState<Record<string, number>>({});
  const [cardSlideDir, setCardSlideDir] = useState<Record<string, 'left' | 'right'>>({});
  const [cardAnimKey, setCardAnimKey] = useState<Record<string, number>>({});
  const EVENTS_PER_CARD = 3;

  // Track planner page direction for slide animation
  const [plannerDirection, setPlannerDirection] = useState<'left' | 'right'>('right');
  const [plannerAnimKey, setPlannerAnimKey] = useState(0);
  const plannerListRef = useRef<HTMLDivElement>(null);

  // Add course modal
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTeacher, setNewTeacher] = useState('');
  const [newQuarterStart, setNewQuarterStart] = useState('');
  const [newQuarterEnd, setNewQuarterEnd] = useState('');

  // Add event modal
  const [eventCourseId, setEventCourseId] = useState<string | null>(null);
  const [eventOpen, setEventOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventAllDay, setEventAllDay] = useState(true);
  const [eventStartTime, setEventStartTime] = useState('09:00');
  const [eventEndTime, setEventEndTime] = useState('10:00');
  const [eventRepeat, setEventRepeat] = useState<'none' | 'daily' | 'weekdays' | 'weekly'>('none');
  const [eventWeeklyDays, setEventWeeklyDays] = useState<boolean[]>([false, false, true, true, true, true, false]);
  const [eventEndType, setEventEndType] = useState<'never' | 'date' | 'count'>('never');
  const [eventEndDate, setEventEndDate] = useState('');
  const [eventEndCount, setEventEndCount] = useState(5);
  const [eventDescription, setEventDescription] = useState('');
  const [eventSubmitting, setEventSubmitting] = useState(false);
  const [eventError, setEventError] = useState('');

  // Study sessions from uploaded syllabi
  const events = get_events();
  const studySessions: StudySession[] = schedule_sessions(events);

  // Persist
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { window.localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(courses)); } catch {}
  }, [courses]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { window.localStorage.setItem(COURSE_EVENTS_STORAGE_KEY, JSON.stringify(courseEvents)); } catch {}
  }, [courseEvents]);

  // --- Planner items ---
  const plannerItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      course: string;
      dateStr: string;
      time?: string;
      type: 'assignment' | 'event';
      priority?: 'high' | 'medium' | 'low';
    }> = [];

    studySessions.forEach((s) => {
      items.push({
        id: s.id,
        title: s.assignment,
        course: s.course,
        dateStr: s.date,
        time: s.suggestedTime,
        type: 'assignment',
        priority: s.priority,
      });
    });

    items.sort((a, b) => a.dateStr.localeCompare(b.dateStr));

    if (priorityFilter !== 'all') {
      return items.filter((i) => i.priority === priorityFilter || !i.priority);
    }
    return items;
  }, [studySessions, priorityFilter]);

  const totalPlannerPages = Math.max(1, Math.ceil(plannerItems.length / ITEMS_PER_PAGE));
  const currentPlannerItems = plannerItems.slice(
    plannerPage * ITEMS_PER_PAGE,
    (plannerPage + 1) * ITEMS_PER_PAGE
  );

  // Reset page when filter changes
  useEffect(() => { setPlannerPage(0); }, [priorityFilter]);

  // --- Handlers ---
  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setCourses((prev) => [
      ...prev,
      {
        id,
        name: newName.trim(),
        quarterStart: newQuarterStart,
        quarterEnd: newQuarterEnd,
        teacher: newTeacher.trim(),
        completed: 0,
        remaining: 0,
      },
    ]);
    setAddOpen(false);
    setNewName('');
    setNewTeacher('');
    setNewQuarterStart('');
    setNewQuarterEnd('');
  };

  const handleDeleteCourse = (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
    setCourseEvents((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const handleOpenAddEvent = (courseId: string) => {
    setEventCourseId(courseId);
    setEventTitle('');
    const today = new Date();
    setEventDate(
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    );
    setEventAllDay(true);
    setEventStartTime('09:00');
    setEventEndTime('10:00');
    setEventRepeat('none');
    setEventWeeklyDays([false, false, true, true, true, true, false]);
    setEventEndType('never');
    setEventEndDate('');
    setEventEndCount(5);
    setEventDescription('');
    setEventError('');
    setEventOpen(true);
  };

  const eventCourse = useMemo(
    () => courses.find((c) => c.id === eventCourseId) ?? null,
    [courses, eventCourseId]
  );

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventCourseId || !eventCourse) return;
    if (!eventTitle.trim() || !eventDate) return;

    if (!accessToken) {
      setEventError('Connect your Google account on Uploads to sync this event.');
      return;
    }

    setEventSubmitting(true);
    setEventError('');
    try {
      const start = eventAllDay ? `${eventDate}T00:00:00` : `${eventDate}T${eventStartTime}:00`;
      const end = eventAllDay ? `${eventDate}T00:00:00` : `${eventDate}T${eventEndTime}:00`;
      const recurrence = buildRecurrence(eventRepeat, eventWeeklyDays, eventEndType, eventEndDate, eventEndCount);
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken,
          events: [
            {
              title: `${eventCourse.name}: ${eventTitle.trim()}`,
              start,
              end: eventAllDay ? undefined : end,
              allDay: eventAllDay,
              description: eventDescription.trim() || undefined,
              recurrence: recurrence.length ? recurrence : undefined,
            },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create calendar event');

      const created = Array.isArray(data.events) && data.events.length > 0 ? data.events[0] : null;
      const googleEventId: string | undefined = created?.id;

      const localEvent: CourseEvent = {
        id: googleEventId || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title: eventTitle.trim(),
        date: eventDate,
        googleEventId,
      };
      setCourseEvents((prev) => ({
        ...prev,
        [eventCourseId]: [...(prev[eventCourseId] ?? []), localEvent],
      }));
      setEventOpen(false);
    } catch (err) {
      setEventError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setEventSubmitting(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'assignment': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'event': return 'bg-violet-50 text-violet-700 border-violet-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="relative max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 py-2">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_circle_at_20%_5%,theme(colors.indigo.100),transparent_55%),radial-gradient(1000px_circle_at_80%_35%,theme(colors.violet.100),transparent_60%),linear-gradient(to_bottom,theme(colors.white),theme(colors.slate.50))] transition-all duration-700" />

      {/* ========== Planner  ========== */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-0.5">Planner</h2>
          <p className="text-xs text-gray-600">
            View your assignments and exams and their estimated priority.
          </p>
        </div>
        <div className="relative">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as typeof priorityFilter)}
            className="appearance-none pl-8 pr-4 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
      <Card className="border-slate-200/80 bg-white shadow-sm mb-8">
        <CardContent className="pt-6">
          {plannerItems.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CalendarIcon className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-sm text-slate-500 mb-1">No upcoming events</p>
              <p className="text-xs text-slate-400">
                Upload a syllabus to see them here.
              </p>
            </div>
          ) : (
            <>
              {/* Fixed-height container: always reserves space for ITEMS_PER_PAGE rows */}
              <div
                ref={plannerListRef}
                className="relative"
                style={{ minHeight: `${ITEMS_PER_PAGE * 52}px` }}
              >
                <div
                  key={plannerAnimKey}
                  className={`divide-y divide-slate-100 ${plannerDirection === 'right' ? 'animate-planner-slide-right' : 'animate-planner-slide-left'}`}
                >
                  {Array.from({ length: ITEMS_PER_PAGE }).map((_, slotIdx) => {
                    const item = currentPlannerItems[slotIdx];
                    return (
                      <div
                        key={item?.id ?? `empty-${slotIdx}`}
                        className="flex items-center gap-4 px-3 -mx-3 rounded-lg transition-colors"
                        style={{ height: '52px' }}
                      >
                        {item ? (
                          <>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-900 truncate">{item.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {item.course}
                                {item.time
                                  ? ` \u00B7 ${getRelativeDate(item.dateStr)} at ${item.time}`
                                  : ` \u00B7 ${getRelativeDate(item.dateStr)}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {item.priority && (
                                <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                                  item.priority === 'high' ? 'bg-red-50 text-red-600' :
                                  item.priority === 'medium' ? 'bg-amber-50 text-amber-600' :
                                  'bg-emerald-50 text-emerald-600'
                                }`}>
                                  {item.priority}
                                </span>
                              )}
                              <span
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border ${getTypeBadge(item.type)}`}
                              >
                                {item.type}
                              </span>
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-slate-200 select-none">&mdash;</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pagination */}
              {totalPlannerPages > 1 && (
                <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-400">
                    {plannerPage * ITEMS_PER_PAGE + 1}&ndash;{Math.min((plannerPage + 1) * ITEMS_PER_PAGE, plannerItems.length)} of {plannerItems.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPlannerDirection('left');
                        setPlannerAnimKey((k) => k + 1);
                        setPlannerPage((p) => Math.max(0, p - 1));
                      }}
                      disabled={plannerPage === 0}
                      className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPlannerDirection('right');
                        setPlannerAnimKey((k) => k + 1);
                        setPlannerPage((p) => Math.min(totalPlannerPages - 1, p + 1));
                      }}
                      disabled={plannerPage === totalPlannerPages - 1}
                      className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ========== Courses ========== */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-0.5">Courses</h2>
          <p className="text-xs text-gray-600">
            Track or edit course information and progress.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!accessToken && onGoToUploads && (
            <button
              type="button"
              onClick={onGoToUploads}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              Connect Google Calendar
            </button>
          )}
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Course
          </button>
        </div>
      </div>

      {courses.length === 0 ? (
        <Card className="border-slate-200/80 bg-white shadow-sm">
          <CardContent className="py-14">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1.5">No courses yet</h3>
              <p className="text-sm text-slate-500 mb-5 max-w-xs mx-auto">
                Add the classes you're taking this quarter to organize work and track progress.
              </p>
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add your first course
              </button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 items-start">
          {courses.map((course, idx) => {
            const evts = courseEvents[course.id] ?? [];
            const total = course.completed + course.remaining || 1;
            const pct = Math.min(100, Math.round((course.completed / total) * 100));
            const progressColor = PROGRESS_COLORS[idx % PROGRESS_COLORS.length];
            const isExpanded = expandedCards.has(course.id);
            const evtPage = cardEventPage[course.id] ?? 0;
            const totalEvtPages = Math.max(1, Math.ceil(evts.length / EVENTS_PER_CARD));
            const visibleEvts = evts.slice(evtPage * EVENTS_PER_CARD, (evtPage + 1) * EVENTS_PER_CARD);
            // Find next upcoming event for preview
            const today = new Date().toISOString().slice(0, 10);
            const nextEvt = [...evts].sort((a, b) => a.date.localeCompare(b.date)).find((e) => e.date >= today) ?? evts[0] ?? null;

            return (
              <div
                key={course.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow"
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-slate-900 text-base truncate">{course.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {course.teacher || '\u00A0'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {course.grade && (
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${PROGRESS_COLORS[idx % PROGRESS_COLORS.length].replace('bg-', 'bg-') } text-white`}>
                        {course.grade}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteCourse(course.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                      title="Delete course"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar - fixed width, shows empty portion */}
                <div className="mt-3 mb-4">
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${progressColor} transition-all duration-500 ease-out`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-8 mb-4">
                  <div>
                    <p className="text-xl font-bold text-slate-900 leading-none">{course.completed}</p>
                    <p className="text-[11px] text-slate-500 mt-1">Completed</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-slate-900 leading-none">{course.remaining}</p>
                    <p className="text-[11px] text-slate-500 mt-1">Remaining</p>
                  </div>
                </div>

                {/* Next event preview + View Details link */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {nextEvt ? (
                      <>
                        <CalendarIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <p className="text-xs text-slate-500 truncate">
                          Next: {nextEvt.title} &ndash; {getRelativeDate(nextEvt.date)}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-slate-400">No upcoming events</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedCards((prev) => {
                        if (prev.has(course.id)) return new Set();
                        return new Set([course.id]);
                      })
                    }
                    className="shrink-0 ml-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-0.5"
                  >
                    {isExpanded ? 'Hide Details' : 'View Details'}
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ease-out ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Expandable event list dropdown */}
                <div
                  className="overflow-hidden transition-all duration-300 ease-out"
                  style={{
                    maxHeight: isExpanded ? `${Math.max(visibleEvts.length * 52 + 56, 90)}px` : '0px',
                    opacity: isExpanded ? 1 : 0,
                  }}
                >
                  <div className="pt-3">
                    {evts.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-3">No events yet</p>
                    ) : (
                      <div
                        key={cardAnimKey[course.id] ?? 0}
                        className={`space-y-1.5 ${(cardSlideDir[course.id] ?? 'right') === 'right' ? 'animate-card-evt-slide-right' : 'animate-card-evt-slide-left'}`}
                      >
                        {visibleEvts.map((evt) => (
                          <div
                            key={evt.id}
                            className="flex items-center gap-3 rounded-lg bg-slate-50/80 px-3 py-2"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium text-slate-800 truncate">{evt.title}</p>
                            </div>
                            <p className="text-[11px] text-slate-400 shrink-0">{getRelativeDate(evt.date)}</p>
                            {evt.googleEventId && (
                              <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
                                Synced
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Controls row: Add Event + pagination arrows + page numbers */}
                    <div className="flex items-center justify-between pt-2.5">
                      <button
                        type="button"
                        onClick={() => handleOpenAddEvent(course.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Event
                      </button>
                      {totalEvtPages > 1 && (
                        <div className="flex items-center gap-1.5">
                          <p className="text-[11px] text-slate-400 mr-0.5">
                            {evtPage * EVENTS_PER_CARD + 1}&ndash;{Math.min((evtPage + 1) * EVENTS_PER_CARD, evts.length)} of {evts.length}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setCardSlideDir((prev) => ({ ...prev, [course.id]: 'left' }));
                              setCardAnimKey((prev) => ({ ...prev, [course.id]: (prev[course.id] ?? 0) + 1 }));
                              setCardEventPage((prev) => ({
                                ...prev,
                                [course.id]: Math.max(0, (prev[course.id] ?? 0) - 1),
                              }));
                            }}
                            disabled={evtPage === 0}
                            className="w-6 h-6 rounded-md flex items-center justify-center border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCardSlideDir((prev) => ({ ...prev, [course.id]: 'right' }));
                              setCardAnimKey((prev) => ({ ...prev, [course.id]: (prev[course.id] ?? 0) + 1 }));
                              setCardEventPage((prev) => ({
                                ...prev,
                                [course.id]: Math.min(totalEvtPages - 1, (prev[course.id] ?? 0) + 1),
                              }));
                            }}
                            disabled={evtPage >= totalEvtPages - 1}
                            className="w-6 h-6 rounded-md flex items-center justify-center border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========== ADD COURSE MODAL ========== */}
      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) setAddOpen(false); }}
        >
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Add Course</h2>
            <form onSubmit={handleAddCourse} className="space-y-4 text-sm">
              <div>
                <label htmlFor="course-name" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Course name
                </label>
                <input
                  id="course-name"
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Data Structures & Algorithms"
                  autoFocus
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="quarter-start" className="block text-xs font-medium text-slate-700 mb-1.5">
                    Quarter start
                  </label>
                  <input
                    id="quarter-start"
                    type="date"
                    value={newQuarterStart}
                    onChange={(e) => setNewQuarterStart(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="quarter-end" className="block text-xs font-medium text-slate-700 mb-1.5">
                    Quarter end
                  </label>
                  <input
                    id="quarter-end"
                    type="date"
                    value={newQuarterEnd}
                    onChange={(e) => setNewQuarterEnd(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="course-teacher" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Instructor (optional)
                </label>
                <input
                  id="course-teacher"
                  type="text"
                  value={newTeacher}
                  onChange={(e) => setNewTeacher(e.target.value)}
                  placeholder="e.g. Dr. Smith"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Add Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== ADD EVENT MODAL ========== */}
      {eventOpen && eventCourse && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) setEventOpen(false); }}
        >
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Add event for {eventCourse.name}
            </h2>
            <form onSubmit={handleSubmitEvent} className="space-y-4 text-sm">
              <div>
                <label htmlFor="event-title" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Event name
                </label>
                <input
                  id="event-title"
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. Midterm Exam"
                  autoFocus
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="event-date" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Date
                </label>
                <input
                  id="event-date"
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="event-allday"
                  type="checkbox"
                  checked={eventAllDay}
                  onChange={(e) => setEventAllDay(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="event-allday" className="text-sm text-gray-700">All day</label>
              </div>
              {!eventAllDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="event-start-time" className="block text-xs font-medium text-slate-700 mb-1.5">Start time</label>
                    <input id="event-start-time" type="time" value={eventStartTime} onChange={(e) => setEventStartTime(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500" />
                  </div>
                  <div>
                    <label htmlFor="event-end-time" className="block text-xs font-medium text-slate-700 mb-1.5">End time</label>
                    <input id="event-end-time" type="time" value={eventEndTime} onChange={(e) => setEventEndTime(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Repeat</label>
                <select
                  value={eventRepeat}
                  onChange={(e) => setEventRepeat(e.target.value as typeof eventRepeat)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
                >
                  <option value="none">Does not repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekdays">Weekdays (M-F)</option>
                  <option value="weekly">Weekly - pick days below</option>
                </select>
                {eventRepeat === 'weekly' && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 mb-1.5">Repeat on:</p>
                    <div className="grid grid-cols-7 gap-1">
                      {WEEKLY_REPEAT_DAY_LABELS.map((label, i) => (
                        <label
                          key={label}
                          className="inline-flex items-center justify-center gap-1 px-1 py-1 rounded-lg border border-gray-300 bg-white text-xs cursor-pointer hover:bg-gray-50 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-100"
                        >
                          <input
                            type="checkbox"
                            checked={eventWeeklyDays[i]}
                            onChange={(e) => {
                              const next = [...eventWeeklyDays];
                              next[i] = e.target.checked;
                              setEventWeeklyDays(next);
                            }}
                            className="rounded border-gray-300 text-indigo-600"
                          />
                          <span className="font-medium text-gray-900 shrink-0">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {eventRepeat !== 'none' && (
                  <div className="mt-2 space-y-2">
                    <label className="block text-xs text-gray-600">Ends</label>
                    <select
                      value={eventEndType}
                      onChange={(e) => setEventEndType(e.target.value as typeof eventEndType)}
                      className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl"
                    >
                      <option value="never">Never</option>
                      <option value="date">On a specific date</option>
                      <option value="count">After a number of occurrences</option>
                    </select>
                    {eventEndType === 'date' && (
                      <input type="date" value={eventEndDate} onChange={(e) => setEventEndDate(e.target.value)} className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl" />
                    )}
                    {eventEndType === 'count' && (
                      <div className="flex items-center gap-2">
                        <input type="number" min={1} value={eventEndCount} onChange={(e) => setEventEndCount(parseInt(e.target.value, 10) || 5)} className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-xl" />
                        <span className="text-sm text-gray-600">occurrences</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="event-description" className="block text-xs font-medium text-slate-700 mb-1.5">Description (optional)</label>
                <textarea
                  id="event-description"
                  rows={2}
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
                  placeholder="Add a description..."
                />
              </div>
              {eventError && (
                <p className="text-xs text-rose-600">
                  {eventError}
                  {!accessToken && onGoToUploads && (
                    <>
                      {' '}
                      <button type="button" onClick={onGoToUploads} className="underline font-medium hover:no-underline">
                        Connect account
                      </button>.
                    </>
                  )}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEventOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={eventSubmitting}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {eventSubmitting ? 'Adding...' : 'Add Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
