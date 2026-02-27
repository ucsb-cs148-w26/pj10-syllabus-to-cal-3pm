'use client';

import { useEffect, useMemo, useState } from 'react';
import { Calendar as CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

type ProfileTab = 'overview' | 'courses' | 'planner' | 'achievements' | 'activity';

export interface ProfileProps {
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

export function Profile({ accessToken, onGoToUploads }: ProfileProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>('courses');
  const [courses, setCourses] = useState<Course[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(COURSES_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      return [];
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

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTeacher, setNewTeacher] = useState('');
  const [newQuarterStart, setNewQuarterStart] = useState('');
  const [newQuarterEnd, setNewQuarterEnd] = useState('');

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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(courses));
    } catch {
      // ignore
    }
  }, [courses]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(COURSE_EVENTS_STORAGE_KEY, JSON.stringify(courseEvents));
    } catch {
      // ignore
    }
  }, [courseEvents]);

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId) ?? null,
    [courses, selectedCourseId]
  );

  const visibleEvents = selectedCourseId ? courseEvents[selectedCourseId] ?? [] : [];

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const next: Course = {
      id,
      name: newName.trim(),
      quarterStart: newQuarterStart,
      quarterEnd: newQuarterEnd,
      teacher: newTeacher.trim(),
      completed: 0,
      remaining: 0,
    };
    setCourses((prev) => [...prev, next]);
    setAddOpen(false);
    setNewName('');
    setNewTeacher('');
    setNewQuarterStart('');
    setNewQuarterEnd('');
    setSelectedCourseId(id);
  };

  const handleDeleteCourse = (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
    setCourseEvents((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    if (selectedCourseId === id) {
      setSelectedCourseId(null);
    }
  };

  const handleOpenAddEvent = () => {
    if (!selectedCourseId) return;
    setEventTitle('');
    const today = new Date();
    const fallbackDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate()
    ).padStart(2, '0')}`;
    setEventDate(fallbackDate);
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

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !selectedCourse) return;
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
              title: `${selectedCourse.name}: ${eventTitle.trim()}`,
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
      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to create calendar event');
      }
      const created = Array.isArray(data.events) && data.events.length > 0 ? data.events[0] : null;
      const googleEventId: string | undefined = created?.id;

      const localEvent: CourseEvent = {
        id: googleEventId || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title: eventTitle.trim(),
        date: eventDate,
        googleEventId,
      };
      setCourseEvents((prev) => {
        const existing = prev[selectedCourseId] ?? [];
        return {
          ...prev,
          [selectedCourseId]: [...existing, localEvent],
        };
      });
      setEventOpen(false);
      setEventTitle('');
    } catch (err) {
      setEventError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setEventSubmitting(false);
    }
  };

  const headerSubtitle =
    activeTab === 'courses'
      ? 'Add enrolled classes so you can organize work by course.'
      : 'Your profile and study activity';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Profile</h1>
          <p className="text-slate-500 mt-1 text-sm">{headerSubtitle}</p>
        </div>
        <div className="inline-flex rounded-full bg-slate-900 text-white px-4 py-2 items-center gap-3 text-sm shadow-sm">
          <div className="size-9 rounded-full bg-slate-800 flex items-center justify-center text-sm font-semibold">
            U
          </div>
          <div className="text-left">
            <p className="font-medium leading-tight">Your profile</p>
            <p className="text-[11px] text-slate-300 leading-tight">Signed in student</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-200 pb-1">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'courses', label: 'Courses' },
          { id: 'planner', label: 'Planner' },
          { id: 'achievements', label: 'Achievements' },
          { id: 'activity', label: 'Activity' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as ProfileTab)}
            className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab !== 'courses' && (
        <Card className="border-slate-200/80 bg-white shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-medium text-slate-900">Coming soon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              This section is focused on courses for now. Use the Courses tab to add your classes and organize work.
            </p>
          </CardContent>
        </Card>
      )}

      {activeTab === 'courses' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">My courses</h2>
              <p className="text-sm text-slate-500">
                Track enrolled classes, add events, and keep everything organized.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!accessToken && (
                <button
                  type="button"
                  onClick={onGoToUploads}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  Connect Google Calendar
                </button>
              )}
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add course
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[2fr,minmax(260px,1.2fr)]">
            <Card className="border-slate-200/80 bg-white shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-900">
                  {courses.length ? 'Enrolled courses' : 'No courses yet'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {courses.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
                    <p className="text-sm text-slate-600 mb-2">
                      Add the classes you’re taking this quarter so you can attach events and stay organized.
                    </p>
                    <button
                      type="button"
                      onClick={() => setAddOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 text-white text-xs font-medium hover:bg-slate-800"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add your first course
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {courses.map((course) => {
                      const completed = course.completed;
                      const total = course.completed + course.remaining || 1;
                      const percentage = Math.min(100, Math.round((completed / total) * 100));
                      const isSelected = selectedCourseId === course.id;
                      return (
                        <div
                          key={course.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedCourseId(course.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedCourseId(course.id);
                            }
                          }}
                          className={`text-left rounded-xl border px-4 py-4 transition-colors ${
                            isSelected
                              ? 'border-indigo-500 shadow-sm bg-indigo-50/60'
                              : 'border-slate-200 hover:border-indigo-300 hover:shadow-sm bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                              <p className="font-semibold text-slate-900">{course.name}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                {course.quarterStart && course.quarterEnd
                                  ? `${course.quarterStart} – ${course.quarterEnd}`
                                  : 'Quarter dates not set'}
                              </p>
                              {course.teacher && (
                                <p className="text-xs text-slate-500 mt-0.5">Instructor: {course.teacher}</p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {course.grade && (
                                <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
                                  {course.grade}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCourse(course.id);
                                }}
                                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                              <span>{completed} completed</span>
                              <span>{course.remaining} remaining</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-indigo-600 transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                          {(!course.teacher) && (
                            <p className="mt-2 text-[11px] text-slate-500">
                              Add an instructor name to this course.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 bg-white shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-900">
                  {selectedCourse ? selectedCourse.name : 'Course details'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {!selectedCourse && (
                  <p className="text-slate-500">
                    Select a course on the left to see details and add events. New events will be added to this class
                    and synced to Google Calendar.
                  </p>
                )}

                {selectedCourse && (
                  <>
                    <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-3 space-y-1.5">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Quarter
                      </p>
                      <p className="text-sm text-slate-900">
                        {selectedCourse.quarterStart && selectedCourse.quarterEnd
                          ? `${selectedCourse.quarterStart} – ${selectedCourse.quarterEnd}`
                          : 'Quarter dates not set'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {selectedCourse.teacher ? `Instructor: ${selectedCourse.teacher}` : 'Instructor not set'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-slate-500">
                        Add a class event (exam, project, or assignment). It will show here and in Google Calendar.
                      </p>
                      <button
                        type="button"
                        onClick={handleOpenAddEvent}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add event
                      </button>
                    </div>

                    {!accessToken && (
                      <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        Connect your Google account on the Uploads page to sync course events to Google Calendar.
                      </div>
                    )}

                    <div className="border-t border-slate-100 pt-3">
                      <p className="text-xs font-medium text-slate-500 mb-2">
                        Events for this class
                      </p>
                      {visibleEvents.length === 0 ? (
                        <p className="text-xs text-slate-500">
                          No events yet for this course. Use &quot;Add event&quot; to create one.
                        </p>
                      ) : (
                        <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {visibleEvents.map((ev) => (
                            <li
                              key={ev.id}
                              className="flex items-center justify-between gap-2 rounded-md bg-slate-50 border border-slate-100 px-3 py-2"
                            >
                              <div>
                                <p className="text-sm font-medium text-slate-900">{ev.title}</p>
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                  <CalendarIcon className="w-3.5 h-3.5" />
                                  <span>{ev.date}</span>
                                  {ev.googleEventId && (
                                    <span className="ml-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200">
                                      Synced to Google Calendar
                                    </span>
                                  )}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-course-title"
        >
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 w-full max-w-md mx-4 p-6">
            <h2 id="add-course-title" className="text-lg font-semibold text-slate-900 mb-4">
              Add course
            </h2>
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
                  placeholder="Course name"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
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
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
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
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="course-teacher" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Teacher (optional)
                </label>
                <input
                  id="course-teacher"
                  type="text"
                  value={newTeacher}
                  onChange={(e) => setNewTeacher(e.target.value)}
                  placeholder="Instructor name"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
                >
                  Add course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {eventOpen && selectedCourse && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-event-title"
        >
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 w-full max-w-md mx-4 p-6">
            <h2 id="add-event-title" className="text-lg font-semibold text-slate-900 mb-4">
              Add event for {selectedCourse.name}
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
                  placeholder="Event name"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
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
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
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
                <label htmlFor="event-allday" className="text-sm text-gray-700">
                  All day
                </label>
              </div>
              {!eventAllDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="event-start-time" className="block text-xs font-medium text-slate-700 mb-1.5">
                      Start time
                    </label>
                    <input
                      id="event-start-time"
                      type="time"
                      value={eventStartTime}
                      onChange={(e) => setEventStartTime(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="event-end-time" className="block text-xs font-medium text-slate-700 mb-1.5">
                      End time
                    </label>
                    <input
                      id="event-end-time"
                      type="time"
                      value={eventEndTime}
                      onChange={(e) => setEventEndTime(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Repeat</label>
                <select
                  value={eventRepeat}
                  onChange={(e) => setEventRepeat(e.target.value as 'none' | 'daily' | 'weekdays' | 'weekly')}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
                >
                  <option value="none">Does not repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekdays">Weekdays (M–F)</option>
                  <option value="weekly">Weekly — pick which days below</option>
                </select>
                {eventRepeat === 'weekly' && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 mb-1.5">Repeat on these days:</p>
                    <div className="grid grid-cols-7 gap-1">
                      {WEEKLY_REPEAT_DAY_LABELS.map((label, i) => (
                        <label
                          key={label}
                          className="inline-flex items-center justify-center gap-1 px-1 py-1 rounded border border-gray-300 bg-white text-gray-900 text-xs cursor-pointer hover:bg-gray-50 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-100"
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
                            aria-label={`Repeat on ${WEEKLY_REPEAT_DAY_LABELS[i]}`}
                          />
                          <span className="font-medium text-gray-900 shrink-0">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {(eventRepeat === 'daily' || eventRepeat === 'weekdays' || eventRepeat === 'weekly') && (
                  <div className="mt-2 space-y-2">
                    <label className="block text-xs text-gray-600">Ends</label>
                    <select
                      value={eventEndType}
                      onChange={(e) => setEventEndType(e.target.value as 'never' | 'date' | 'count')}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                    >
                      <option value="never">Never</option>
                      <option value="date">On a specific date</option>
                      <option value="count">After a number of occurrences</option>
                    </select>
                    {eventEndType === 'date' && (
                      <input
                        type="date"
                        value={eventEndDate}
                        onChange={(e) => setEventEndDate(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                        aria-label="End date"
                      />
                    )}
                    {eventEndType === 'count' && (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          value={eventEndCount}
                          onChange={(e) => setEventEndCount(parseInt(e.target.value, 10) || 5)}
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
                <label htmlFor="event-description" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Description (optional)
                </label>
                <textarea
                  id="event-description"
                  rows={2}
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
                  placeholder="Description"
                />
              </div>
              {eventError && (
                <p className="text-xs text-rose-600">
                  {eventError}
                  {!accessToken && onGoToUploads && (
                    <>
                      {' '}
                      <button
                        type="button"
                        onClick={onGoToUploads}
                        className="underline font-medium hover:no-underline"
                      >
                        Connect account
                      </button>
                      .
                    </>
                  )}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEventOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={eventSubmitting}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {eventSubmitting ? 'Adding…' : 'Add event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
