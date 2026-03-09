'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
  BookOpen,
  Check as CheckIcon,
  Undo2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../ui/dropdown-menu';
import { Card, CardContent } from '../ui/card';
import { createClient } from '@/lib/supabase/client';
import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse as dbDeleteCourse,
  getAllAssignments,
  markAssignmentComplete,
  deleteAssignment,
  type DbCourse,
  type DbAssignment,
} from '@/lib/supabase/database';

export interface StudyPlanProps {
  accessToken: string | null;
  onGoToUploads?: () => void;
  isAuthenticated?: boolean;
}

import { priority_score} from '../../../../code/priorityscore';

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

function formatTime12h(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

function getRelativeDate(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);

  // Compute Sun–Sat boundaries for the current week
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  if (target >= weekStart && target <= weekEnd) {
    if (diffDays === 0) return 'Today';
    return target.toLocaleDateString('en-US', { weekday: 'long' });
  }
  // Outside current week → MM/DD/YY
  return target.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
}

const ITEMS_PER_PAGE = 5;
const EVENTS_PER_CARD = 3;

// Inline input style: underline only, no box
const inlineInputBase =
  'bg-transparent outline-none border-0 border-b-2 border-b-slate-300 focus:border-b-indigo-500 transition-colors w-full';

export function StudyPlan({ accessToken, isAuthenticated }: StudyPlanProps) {
  const supabase = useMemo(() => createClient(), []);

  // --- Planner pagination ---
  const [plannerPage, setPlannerPage] = useState(0);
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // --- Courses & assignments state (Supabase-backed) ---
  const [courses, setCourses] = useState<DbCourse[]>([]);
  const [assignments, setAssignments] = useState<DbAssignment[]>([]);
  const [dbLoading, setDbLoading] = useState(true);

  // Per-card details dropdown & pagination
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [cardEventPage, setCardEventPage] = useState<Record<string, number>>({});
  const [cardSlideDir, setCardSlideDir] = useState<Record<string, 'left' | 'right'>>({});
  const [cardAnimKey, setCardAnimKey] = useState<Record<string, number>>({});

  //Class prority (0-5) 
  const CLASS_PRIORITY_MULTIPLIER: Record<number, number> = {
    1: 0.8,
    2: 0.9,
    3: 1.0,
    4: 1.1,
    5: 1.2,
  };
  
  const CLASS_PRIORITY_LABEL: Record<number, string> = {
    1: 'Low Priority',
    2: 'Below Average',
    3: 'Average',
    4: 'Above Average',
    5: 'High Priority',
  };

  const CLASS_PRIORITY_COLORS: Record<number, string> = {
    1: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    2: 'bg-lime-50 text-lime-700 border-lime-200',
    3: 'bg-amber-50 text-amber-700 border-amber-200',
    4: 'bg-orange-50 text-orange-700 border-orange-200',
    5: 'bg-rose-50 text-rose-700 border-rose-200',
  };



  // Track planner page direction for slide animation
  const [plannerDirection, setPlannerDirection] = useState<'left' | 'right'>('right');
  const [plannerAnimKey, setPlannerAnimKey] = useState(0);
  const plannerListRef = useRef<HTMLDivElement>(null);

  // Prevent onBlur save when Escape was used to cancel inline editing
  const escapeInlineRef = useRef(false);
  const escapeEventRef = useRef(false);

  // Inline field editing state (for existing course fields)
  const [editingField, setEditingField] = useState<{
    courseId: string;
    field: 'class_name' | 'teacher' | 'academic_term';
    value: string;
  } | null>(null);

  // Inline event field editing state
  const [editingEvent, setEditingEvent] = useState<{
    id: string;
    field: 'event_name' | 'due_date' | 'time';
    value: string;
  } | null>(null);

  // Draft course (inline add — no modal)
  const [draftCourse, setDraftCourse] = useState<{
    class_name: string;
    teacher: string;
    academic_term: string;
  } | null>(null);
  const [draftVisible, setDraftVisible] = useState(false); // controls fade-in/out

  // Draft event (inline add inside Details — no modal)
  const [draftEvent, setDraftEvent] = useState<{
    courseId: string;
    event_name: string;
    due_date: string;
    time: string;
    type: 'assignment' | 'exam';
  } | null>(null);
  const draftEventBlurRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Course color customization (localStorage-backed)
  const [courseColors, setCourseColors] = useState<Record<string, number>>(() => {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem('course-colors') ?? '{}'); } catch { return {}; }
  });
  const handleCycleColor = useCallback((courseId: string, currentIdx: number) => {
    const next = (currentIdx + 1) % PROGRESS_COLORS.length;
    setCourseColors((prev) => {
      const updated = { ...prev, [courseId]: next };
      localStorage.setItem('course-colors', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Undo completion
  const [lastCompleted, setLastCompleted] = useState<{ id: string; title: string } | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Fetch data from Supabase on mount ---
  const fetchData = useCallback(async () => {
    if (!isAuthenticated) {
      setDbLoading(false);
      return;
    }
    try {
      const [c, a] = await Promise.all([getCourses(supabase), getAllAssignments(supabase)]);
      setCourses(c);
      setAssignments(a);
    } catch (err) {
      console.error('Failed to load planner data:', err);
    } finally {
      setDbLoading(false);
    }
  }, [supabase, isAuthenticated]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- Helper: compute counts for a course ---
  const courseCounts = useMemo(() => {
    const counts: Record<string, { completed: number; remaining: number }> = {};
    for (const c of courses) {
      counts[c.id] = { completed: 0, remaining: 0 };
    }
    for (const a of assignments) {
      if (!counts[a.course_id]) continue;
      if (a.completed) {
        counts[a.course_id].completed++;
      } else {
        counts[a.course_id].remaining++;
      }
    }
    return counts;
  }, [courses, assignments]);

  //adding handler for class prority

  const handleSaveClassPriority = useCallback(async (courseId: string, nextPriority: number) => {
    const safe = Math.max(1, Math.min(5, nextPriority));

    setCourses((curr) =>
      curr.map((c) => (c.id === courseId ? { ...c, class_priority: safe } : c))
    );

    try { 
      await updateCourse(supabase, courseId, { class_priority: safe });
    } catch (err) {
      console.error('Failed to update class priority:', err);
      // Don't roll back manually—fetchData() will restore the truth from the server
      // This prevents clobbering concurrent edits to other courses
      fetchData();
    }
  }, [supabase, fetchData]);



  // Map course ID → { bg: tailwind class, idx: number }
  const courseColorMap = useMemo(() => {
    const map: Record<string, { bg: string; idx: number }> = {};
    courses.forEach((c, idx) => {
      const colorIdx = courseColors[c.id] ?? idx % PROGRESS_COLORS.length;
      map[c.id] = { bg: PROGRESS_COLORS[colorIdx], idx: colorIdx };
    });
    return map;
  }, [courses, courseColors]);

  // --- Planner items (DB assignments — include past, exclude completed) ---
  const plannerItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      course: string;
      dateStr: string;
      time?: string;
      type: 'assignment' | 'exam' | 'event';
      priority?: 'high' | 'medium' | 'low';
      dbAssignmentId?: string;
      courseId?: string;
      score: number; // Store for sorting items with same due date by priority
    }> = [];

    for (const a of assignments) {
      if (a.completed) continue;
      const courseName = courses.find((c) => c.id === a.course_id)?.class_name ?? 'No Course';

      // Compute priority from days until due
       const due = new Date(a.due_date + 'T00:00:00');
      const baseScore = priority_score(due, due, a.type);
      if (isNaN(baseScore)) continue;

      const classPriority = courses.find((c) => c.id === a.course_id)?.class_priority ?? 3;
      const multiplier = CLASS_PRIORITY_MULTIPLIER[classPriority] ?? 1;
      const score = baseScore / multiplier;
      
      let priority: 'high' | 'medium' | 'low' = 'low';
      if (score < 480) priority = 'high';
      else if (score < 1680) priority = 'medium';

      items.push({
        id: `db-${a.id}`,
        title: a.event_name,
        course: courseName,
        dateStr: a.due_date,
        time: a.time ?? undefined,
        type: a.type as 'assignment' | 'exam',
        priority,
        dbAssignmentId: a.id,
        courseId: a.course_id,
        score, // Include for secondary sort
      });
    }

    // Sort by due date first, then by score (ascending = lower score = higher priority)
    items.sort((a, b) => {
      const dateCompare = a.dateStr.localeCompare(b.dateStr);
      if (dateCompare !== 0) return dateCompare; // Different dates: sort by date
      return a.score - b.score; // Same date: sort by score (lower = higher priority)
    });

    if (priorityFilter !== 'all') {
      return items.filter((i) => i.priority === priorityFilter || !i.priority);
    }
    return items;
  }, [priorityFilter, assignments, courses]);

  const totalPlannerPages = Math.max(1, Math.ceil(plannerItems.length / ITEMS_PER_PAGE));
  const currentPlannerItems = plannerItems.slice(
    plannerPage * ITEMS_PER_PAGE,
    (plannerPage + 1) * ITEMS_PER_PAGE
  );

  // Reset page when filter changes
  useEffect(() => { setPlannerPage(0); }, [priorityFilter]);

  // --- Draft course handlers ---
  const handleOpenDraftCourse = () => {
    if (courses.length >= 10) return;
    setDraftCourse({ class_name: '', teacher: '', academic_term: '' });
    setDraftVisible(true);
  };

  const handleDraftCourseBlur = useCallback(async () => {
    if (!draftCourse) return;
    if (!draftCourse.class_name.trim()) {
      // Fade out and remove
      setDraftVisible(false);
      setTimeout(() => setDraftCourse(null), 200);
      return;
    }
    const trimmedName = draftCourse.class_name.trim();
    const duplicate = courses.find((c) => c.class_name.toLowerCase() === trimmedName.toLowerCase());
    if (duplicate) {
      // Course with same name already exists — don't create a duplicate
      setDraftCourse(null);
      setDraftVisible(false);
      return;
    }
    // Save
    try {
      const created = await createCourse(supabase, {
        class_name: trimmedName,
        teacher: draftCourse.teacher.trim() || undefined,
        academic_term: draftCourse.academic_term.trim() || undefined,
      });
      setCourses((prev) => [...prev, created]);
    } catch (err) {
      console.error('Failed to add course:', err);
    }
    setDraftCourse(null);
    setDraftVisible(false);
  }, [supabase, draftCourse]);

  // --- Delete course ---
  const handleDeleteCourse = async (id: string) => {
    try {
      await dbDeleteCourse(supabase, id);
      setCourses((prev) => prev.filter((c) => c.id !== id));
      setAssignments((prev) => prev.filter((a) => a.course_id !== id));
    } catch (err) {
      console.error('Failed to delete course:', err);
    }
  };

  // --- Draft event handlers ---
  const todayStr = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const handleOpenDraftEvent = (courseId: string) => {
    if (draftEventBlurRef.current) clearTimeout(draftEventBlurRef.current);
    const courseAssignmentCount = assignments.filter((a) => a.course_id === courseId).length;
    if (courseAssignmentCount >= 50) return;
    setDraftEvent({ courseId, event_name: '', due_date: todayStr(), time: '', type: 'assignment' });
    // Ensure Details is expanded
    setExpandedCards((prev) => new Set([...prev, courseId]));
  };

  const handleDraftEventNameBlur = useCallback(() => {
    // Small delay so Tab to next field doesn't prematurely close
    draftEventBlurRef.current = setTimeout(() => {
      if (!draftEvent || !draftEvent.event_name.trim()) {
        setDraftEvent(null);
      }
    }, 150);
  }, [draftEvent]);

  const handleDraftEventFocus = () => {
    if (draftEventBlurRef.current) clearTimeout(draftEventBlurRef.current);
  };

  const handleSaveDraftEvent = useCallback(async () => {
    if (!draftEvent || !draftEvent.event_name.trim() || !draftEvent.due_date) return;
    if (draftEventBlurRef.current) clearTimeout(draftEventBlurRef.current);

    try {
      const { data: dbData, error: dbErr } = await supabase
        .from('assignments')
        .insert({
          course_id: draftEvent.courseId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          event_name: draftEvent.event_name.trim(),
          due_date: draftEvent.due_date,
          time: draftEvent.time || null,
          type: draftEvent.type,
          completed: false,
        })
        .select()
        .single();

      if (!dbErr && dbData) {
        setAssignments((prev) => {
          const next = [...prev, dbData].sort((a, b) => a.due_date.localeCompare(b.due_date));
          // Navigate to the page containing the new event for this course
          const courseAssigns = next.filter((a) => a.course_id === draftEvent.courseId);
          const newIdx = courseAssigns.findIndex((a) => a.id === dbData.id);
          if (newIdx >= 0) {
            const page = Math.floor(newIdx / EVENTS_PER_CARD);
            setCardEventPage((prev) => ({ ...prev, [draftEvent.courseId]: page }));
          }
          return next;
        });
      }
    } catch (err) {
      console.error('Failed to save event:', err);
    }
    setDraftEvent(null);
  }, [supabase, draftEvent]);

  // --- Completion toggle ---
  const handleMarkComplete = useCallback(async (assignmentId: string, title: string) => {
    setAssignments((prev) => prev.map((a) => a.id === assignmentId ? { ...a, completed: true } : a));
    setLastCompleted({ id: assignmentId, title });

    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => setLastCompleted(null), 5000);

    try {
      await markAssignmentComplete(supabase, assignmentId, true);
    } catch (err) {
      console.error('Failed to mark complete:', err);
      setAssignments((prev) => prev.map((a) => a.id === assignmentId ? { ...a, completed: false } : a));
      setLastCompleted(null);
    }
  }, [supabase]);

  const handleUndoComplete = useCallback(async () => {
    if (!lastCompleted) return;
    const { id } = lastCompleted;

    setAssignments((prev) => prev.map((a) => a.id === id ? { ...a, completed: false } : a));
    setLastCompleted(null);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);

    try {
      await markAssignmentComplete(supabase, id, false);
    } catch (err) {
      console.error('Failed to undo:', err);
      setAssignments((prev) => prev.map((a) => a.id === id ? { ...a, completed: true } : a));
    }
  }, [supabase, lastCompleted]);

  useEffect(() => {
    return () => { if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current); };
  }, []);

  const handleDeleteAssignment = useCallback(async (id: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    try {
      await deleteAssignment(supabase, id);
    } catch (err) {
      console.error('Failed to delete assignment:', err);
      fetchData();
    }
  }, [supabase, fetchData]);

  const handleToggleType = useCallback(async (id: string, current: 'assignment' | 'exam') => {
    const next = current === 'assignment' ? 'exam' : 'assignment';
    setAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, type: next } : a)));
    try {
      await supabase.from('assignments').update({ type: next }).eq('id', id);
    } catch {
      setAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, type: current } : a)));
    }
  }, [supabase]);

  const handleToggleComplete = useCallback(async (assignmentId: string, title: string, currentCompleted: boolean) => {
    if (!currentCompleted) {
      handleMarkComplete(assignmentId, title);
    } else {
      setAssignments((prev) => prev.map((a) => a.id === assignmentId ? { ...a, completed: false } : a));
      try {
        await markAssignmentComplete(supabase, assignmentId, false);
      } catch {
        setAssignments((prev) => prev.map((a) => a.id === assignmentId ? { ...a, completed: true } : a));
      }
    }
  }, [supabase, handleMarkComplete]);

  const handleSaveField = useCallback(async (
    courseId: string,
    field: 'class_name' | 'teacher' | 'academic_term',
    value: string
  ) => {
    const trimmed = value.trim();
    if (!trimmed && field === 'class_name') { setEditingField(null); return; }
    setCourses((prev) => prev.map((c) => c.id === courseId ? { ...c, [field]: trimmed || null } : c));
    setEditingField(null);
    try {
      await updateCourse(supabase, courseId, { [field]: trimmed || undefined });
    } catch {
      fetchData();
    }
  }, [supabase, fetchData]);

  const handleSaveEventField = useCallback(async (
    id: string,
    field: 'event_name' | 'due_date' | 'time',
    value: string
  ) => {
    const trimmed = value.trim();
    if (!trimmed && field === 'event_name') { setEditingEvent(null); return; }
    setAssignments((prev) => prev.map((a) => a.id === id ? { ...a, [field]: trimmed || null } : a));
    setEditingEvent(null);
    try {
      await supabase.from('assignments').update({ [field]: trimmed || null }).eq('id', id);
    } catch {
      fetchData();
    }
  }, [supabase, fetchData]);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'assignment': return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'exam': return 'bg-indigo-50 text-indigo-600 border-indigo-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Helper: open details and jump to last-completed event page
  const handleToggleDetails = useCallback((courseId: string, courseAssignments: DbAssignment[]) => {
    setExpandedCards((prev) => {
      if (prev.has(courseId)) {
        const next = new Set(prev);
        next.delete(courseId);
        return next;
      }
      // Find last completed event and start on that page
      const lastCompletedIdx = courseAssignments
        .map((a, i) => ({ a, i }))
        .filter(({ a }) => a.completed)
        .pop()?.i ?? 0;
      const startPage = Math.floor(lastCompletedIdx / EVENTS_PER_CARD);
      setCardEventPage((p) => ({ ...p, [courseId]: startPage }));
      return new Set([courseId]);
    });
  }, []);

  return (
    <div className="relative max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 py-2 pb-64">
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
              <p className="text-sm text-slate-500 mb-1">No Remaining Events</p>
              <p className="text-xs text-slate-400">Add events here inside courses or through upload.</p>
            </div>
          ) : (
            <>
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
                            {item.dbAssignmentId ? (
                              <button
                                type="button"
                                onClick={() => handleMarkComplete(item.dbAssignmentId!, item.title)}
                                className="w-5 h-5 rounded-md border-2 border-slate-300 hover:border-indigo-500 hover:bg-indigo-50 flex items-center justify-center transition-colors shrink-0"
                                title="Mark complete"
                              >
                                <CheckIcon className="w-3 h-3 text-transparent hover:text-indigo-400" />
                              </button>
                            ) : (
                              <div className="w-5 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-900 truncate">{item.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {item.time
                                  ? `${getRelativeDate(item.dateStr)} at ${item.time}`
                                  : getRelativeDate(item.dateStr)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {item.courseId && courseColorMap[item.courseId] && (
                                <span className={`px-2 py-1 rounded-lg text-[11px] font-medium text-white max-w-[88px] truncate ${courseColorMap[item.courseId].bg}`}>
                                  {item.course}
                                </span>
                              )}
                              {item.priority && (
                                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
                                  item.priority === 'high' ? 'bg-red-50 text-red-600 border-red-200' :
                                  item.priority === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                  'bg-emerald-50 text-emerald-600 border-emerald-200'
                                }`}>
                                  {item.priority}
                                </span>
                              )}
                              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border ${getTypeBadge(item.type)}`}>
                                {item.type}
                              </span>
                              {item.dbAssignmentId && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAssignment(item.dbAssignmentId!)}
                                  className="p-1 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
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

          {lastCompleted && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-slate-800 text-white px-4 py-2.5 text-xs animate-in slide-in-from-bottom-2">
              <span className="truncate">&ldquo;{lastCompleted.title}&rdquo; completed</span>
              <button
                type="button"
                onClick={handleUndoComplete}
                className="inline-flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-colors"
              >
                <Undo2 className="w-3 h-3" />
                Undo
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========== Courses ========== */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-0.5">Courses</h2>
          <p className="text-xs text-gray-600">Track or edit course information and progress.</p>
        </div>
        <button
          type="button"
          onClick={handleOpenDraftCourse}
          disabled={!!draftCourse || courses.length >= 10}
          title={courses.length >= 10 ? 'Course limit reached (10 max)' : undefined}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 shadow-sm transition-colors disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Course {courses.length > 0 && <span className="opacity-70">({courses.length}/10)</span>}
        </button>
      </div>

      {courses.length === 0 && !draftCourse ? (
        <Card className="border-slate-200/80 bg-white shadow-sm mb-8">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-7 h-7 text-slate-300" />
              </div>
              <h3 className="text-sm text-slate-500 mb-1">No Courses</h3>
              <p className="text-xs text-slate-400">
                Add the classes you&apos;re taking this quarter here or through upload.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 items-start">
          {courses.map((course, idx) => {
            // Sort assignments by date for consistent pagination
            const courseAssignments = assignments
              .filter((a) => a.course_id === course.id)
              .sort((a, b) => a.due_date.localeCompare(b.due_date));
            const counts = courseCounts[course.id] ?? { completed: 0, remaining: 0 };
            const total = counts.completed + counts.remaining || 1;
            const pct = Math.min(100, Math.round((counts.completed / total) * 100));
            const colorData = courseColorMap[course.id] ?? { bg: PROGRESS_COLORS[idx % PROGRESS_COLORS.length], idx: idx % PROGRESS_COLORS.length };
            const progressColor = colorData.bg;
            const isExpanded = expandedCards.has(course.id);
            const evtPage = cardEventPage[course.id] ?? 0;
            const totalEvtPages = Math.max(1, Math.ceil(courseAssignments.length / EVENTS_PER_CARD));
            const visibleEvts = courseAssignments.slice(evtPage * EVENTS_PER_CARD, (evtPage + 1) * EVENTS_PER_CARD);
            const today = new Date().toISOString().slice(0, 10);
            const nextEvt = courseAssignments.find((e) => e.due_date >= today && !e.completed) ?? null;
            const showDraftEventRow = draftEvent?.courseId === course.id;

            return (
              <div
                key={course.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow"
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="flex items-start gap-2 min-w-0">
                    <button
                      type="button"
                      title="Change color"
                      onClick={() => handleCycleColor(course.id, colorData.idx)}
                      className={`w-3 h-3 mt-1.5 rounded-full shrink-0 ${progressColor} hover:ring-2 hover:ring-offset-1 hover:ring-slate-400 transition-all`}
                    />
                    <div className="min-w-0 flex-1">
                      {/* Inline-editable class_name */}
                      {editingField?.courseId === course.id && editingField.field === 'class_name' ? (
                        <input
                          autoFocus
                          className={`${inlineInputBase} font-semibold text-slate-900 text-base`}
                          value={editingField.value}
                          onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                          onBlur={() => {
                            if (escapeInlineRef.current) { escapeInlineRef.current = false; return; }
                            handleSaveField(course.id, 'class_name', editingField.value);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); }
                            if (e.key === 'Escape') { escapeInlineRef.current = true; setEditingField(null); }
                          }}
                        />
                      ) : (
                        <h4
                          className="font-semibold text-slate-900 text-base truncate cursor-text hover:underline hover:decoration-dotted transition-all"
                          title="Click to edit"
                          onClick={() => setEditingField({ courseId: course.id, field: 'class_name', value: course.class_name })}
                        >{course.class_name}</h4>
                      )}
                      {/* Inline-editable teacher */}
                      {editingField?.courseId === course.id && editingField.field === 'teacher' ? (
                        <input
                          autoFocus
                          className={`${inlineInputBase} text-xs text-slate-500 mt-0.5`}
                          value={editingField.value}
                          onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                          onBlur={() => {
                            if (escapeInlineRef.current) { escapeInlineRef.current = false; return; }
                            handleSaveField(course.id, 'teacher', editingField.value);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); }
                            if (e.key === 'Escape') { escapeInlineRef.current = true; setEditingField(null); }
                          }}
                        />
                      ) : (
                        <p
                          className="text-xs text-slate-500 mt-0.5 cursor-text hover:underline hover:decoration-dotted transition-all truncate"
                          title="Click to edit professor"
                          onClick={() => setEditingField({ courseId: course.id, field: 'teacher', value: course.teacher ?? '' })}
                        >{course.teacher || <span className="text-slate-300 italic">Professor</span>}</p>
                      )}
                      {/* Inline-editable academic_term */}
                      {editingField?.courseId === course.id && editingField.field === 'academic_term' ? (
                        <input
                          autoFocus
                          className={`${inlineInputBase} text-xs text-slate-400 mt-0.5`}
                          value={editingField.value}
                          onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                          onBlur={() => {
                            if (escapeInlineRef.current) { escapeInlineRef.current = false; return; }
                            handleSaveField(course.id, 'academic_term', editingField.value);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); }
                            if (e.key === 'Escape') { escapeInlineRef.current = true; setEditingField(null); }
                          }}
                        />
                      ) : (
                        <p
                          className="text-xs text-slate-400 mt-0.5 cursor-text hover:underline hover:decoration-dotted transition-all truncate"
                          title="Click to edit term"
                          onClick={() => setEditingField({ courseId: course.id, field: 'academic_term', value: course.academic_term ?? '' })}
                        >{course.academic_term || <span className="italic">Term</span>}</p>
                      )}

                      {/* 📌 CLASS PRIORITY DROPDOWN */}
                      <div className="mt-4 mb-3 flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-600">Class Priority</label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer hover:opacity-80 transition-opacity ${CLASS_PRIORITY_COLORS[course.class_priority ?? 3]}`}
                              title="Click to change priority"
                            >
                              {course.class_priority ?? 3}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <DropdownMenuItem
                                key={level}
                                onSelect={() => handleSaveClassPriority(course.id, level)}
                              >
                                {CLASS_PRIORITY_LABEL[level]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCourse(course.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors shrink-0"
                    title="Delete course"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Progress bar */}
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
                    <p className="text-xl font-bold text-slate-900 leading-none">{counts.completed}</p>
                    <p className="text-[11px] text-slate-500 mt-1">Completed</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-slate-900 leading-none">{counts.remaining}</p>
                    <p className="text-[11px] text-slate-500 mt-1">Remaining</p>
                  </div>
                </div>

                {/* Next event preview + View Details */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {nextEvt ? (
                      <>
                        <CalendarIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <p className="text-xs text-slate-500 truncate">
                          Next: {nextEvt.event_name} &ndash; {getRelativeDate(nextEvt.due_date)}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-slate-400">No upcoming events</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleDetails(course.id, courseAssignments)}
                    className="shrink-0 ml-3 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-0.5"
                  >
                    {isExpanded ? 'Hide Details' : 'View Details'}
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ease-out ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>

                {/* Expandable event list */}
                <div
                  className="overflow-hidden transition-all duration-300 ease-out"
                  style={{
                    maxHeight: isExpanded
                      ? `${Math.max((visibleEvts.length + (showDraftEventRow ? 1 : 0)) * 52 + 80, 100)}px`
                      : '0px',
                    opacity: isExpanded ? 1 : 0,
                  }}
                >
                  <div className="pt-3">
                    {courseAssignments.length === 0 && !showDraftEventRow ? (
                      <p className="text-xs text-slate-400 text-center py-3">No events yet</p>
                    ) : (
                      <div
                        key={cardAnimKey[course.id] ?? 0}
                        className={`space-y-1.5 ${(cardSlideDir[course.id] ?? 'right') === 'right' ? 'animate-card-evt-slide-right' : 'animate-card-evt-slide-left'}`}
                      >
                        {visibleEvts.map((evt) => (
                          <div
                            key={evt.id}
                            className="flex items-center gap-2 rounded-lg bg-slate-50/80 px-3 py-2"
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleComplete(evt.id, evt.event_name, evt.completed)}
                              title={evt.completed ? 'Mark incomplete' : 'Mark complete'}
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                evt.completed
                                  ? `${progressColor} border-transparent`
                                  : 'border-slate-300 hover:border-indigo-500'
                              }`}
                            >
                              {evt.completed && <CheckIcon className="w-2.5 h-2.5 text-white" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              {editingEvent?.id === evt.id && editingEvent.field === 'event_name' ? (
                                <input
                                  autoFocus
                                  className={`${inlineInputBase} text-[13px] font-medium text-slate-800`}
                                  value={editingEvent.value}
                                  onChange={(e) => setEditingEvent({ ...editingEvent, value: e.target.value })}
                                  onBlur={() => {
                                    if (escapeEventRef.current) { escapeEventRef.current = false; return; }
                                    handleSaveEventField(evt.id, 'event_name', editingEvent.value);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); }
                                    if (e.key === 'Escape') { escapeEventRef.current = true; setEditingEvent(null); }
                                  }}
                                />
                              ) : (
                                <p
                                  className={`text-[13px] font-medium truncate cursor-text hover:underline hover:decoration-dotted transition-all ${evt.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}
                                  title="Click to edit"
                                  onClick={() => setEditingEvent({ id: evt.id, field: 'event_name', value: evt.event_name })}
                                >{evt.event_name}</p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleToggleType(evt.id, evt.type)}
                              title="Click to toggle type"
                              className={`shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-medium cursor-pointer hover:opacity-70 transition-opacity ${
                                evt.type === 'exam' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'
                              }`}
                            >
                              {evt.type}
                            </button>
                            <div className="flex items-center gap-1 shrink-0">
                              {editingEvent?.id === evt.id && editingEvent.field === 'due_date' ? (
                                <input
                                  autoFocus
                                  type="date"
                                  className="text-[11px] text-slate-500 bg-transparent outline-none border-b border-indigo-400 w-28"
                                  value={editingEvent.value}
                                  onChange={(e) => setEditingEvent({ ...editingEvent, value: e.target.value })}
                                  onBlur={() => {
                                    if (escapeEventRef.current) { escapeEventRef.current = false; return; }
                                    handleSaveEventField(evt.id, 'due_date', editingEvent.value);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); }
                                    if (e.key === 'Escape') { escapeEventRef.current = true; setEditingEvent(null); }
                                  }}
                                />
                              ) : (
                                <span
                                  className="text-[11px] text-slate-400 cursor-text hover:underline hover:decoration-dotted transition-all"
                                  title="Click to edit date"
                                  onClick={() => setEditingEvent({ id: evt.id, field: 'due_date', value: evt.due_date })}
                                >
                                  {getRelativeDate(evt.due_date)}
                                </span>
                              )}
                              {editingEvent?.id === evt.id && editingEvent.field === 'time' ? (
                                <input
                                  autoFocus
                                  type="time"
                                  className="text-[11px] text-slate-500 bg-transparent outline-none border-b border-indigo-400 w-20"
                                  value={editingEvent.value}
                                  onChange={(e) => setEditingEvent({ ...editingEvent, value: e.target.value })}
                                  onBlur={() => {
                                    if (escapeEventRef.current) { escapeEventRef.current = false; return; }
                                    handleSaveEventField(evt.id, 'time', editingEvent.value);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); }
                                    if (e.key === 'Escape') { escapeEventRef.current = true; setEditingEvent(null); }
                                  }}
                                />
                              ) : (
                                <span
                                  className="text-[11px] cursor-text hover:underline hover:decoration-dotted transition-all"
                                  title="Click to edit time"
                                  onClick={() => setEditingEvent({ id: evt.id, field: 'time', value: evt.time ?? '' })}
                                >
                                  {evt.time
                                    ? <span className="text-slate-400">{formatTime12h(evt.time)}</span>
                                    : <span className="text-slate-300 italic">+ time</span>
                                  }
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteAssignment(evt.id)}
                              title="Delete"
                              className="p-0.5 rounded text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors shrink-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}

                        {/* Draft event row */}
                        {showDraftEventRow && draftEvent && (
                          <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 animate-in fade-in duration-150">
                            <div className="w-4 h-4 rounded border-2 border-slate-200 shrink-0" />
                            <input
                              autoFocus
                              placeholder="Event name"
                              value={draftEvent.event_name}
                              onChange={(e) => setDraftEvent({ ...draftEvent, event_name: e.target.value })}
                              onBlur={handleDraftEventNameBlur}
                              onFocus={handleDraftEventFocus}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); handleSaveDraftEvent(); }
                                if (e.key === 'Escape') { setDraftEvent(null); }
                              }}
                              className="flex-1 min-w-0 text-[13px] bg-transparent outline-none border-b border-slate-300 text-slate-600 focus:border-indigo-400 placeholder-slate-300"
                            />
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => setDraftEvent((d) => d ? { ...d, type: d.type === 'assignment' ? 'exam' : 'assignment' } : d)}
                              className={`shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-medium cursor-pointer hover:opacity-70 transition-opacity ${
                                draftEvent.type === 'exam' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'
                              }`}
                            >
                              {draftEvent.type}
                            </button>
                            <input
                              type="date"
                              value={draftEvent.due_date}
                              onChange={(e) => setDraftEvent({ ...draftEvent, due_date: e.target.value })}
                              onFocus={handleDraftEventFocus}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); handleSaveDraftEvent(); }
                              }}
                              className="text-[11px] text-slate-500 bg-transparent outline-none border-b border-slate-300 focus:border-indigo-400 w-28 shrink-0"
                            />
                            <input
                              type="time"
                              value={draftEvent.time}
                              onChange={(e) => setDraftEvent({ ...draftEvent, time: e.target.value })}
                              onFocus={handleDraftEventFocus}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); handleSaveDraftEvent(); }
                              }}
                              className="text-[11px] text-slate-500 bg-transparent outline-none border-b border-slate-300 focus:border-indigo-400 w-20 shrink-0"
                            />
                            <button
                              type="button"
                              onClick={() => setDraftEvent(null)}
                              className="p-0.5 rounded text-slate-300 hover:text-rose-400 transition-colors shrink-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Controls row */}
                    <div className="flex items-center justify-between pt-2.5">
                      <button
                        type="button"
                        onClick={() => handleOpenDraftEvent(course.id)}
                        disabled={!!draftEvent || courseAssignments.length >= 50}
                        title={courseAssignments.length >= 50 ? 'Assignment limit reached (50 max)' : undefined}
                        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Event
                      </button>
                      {totalEvtPages > 1 && (
                        <div className="flex items-center gap-1.5">
                          <p className="text-[11px] text-slate-400 mr-0.5">
                            {evtPage * EVENTS_PER_CARD + 1}&ndash;{Math.min((evtPage + 1) * EVENTS_PER_CARD, courseAssignments.length)} of {courseAssignments.length}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setCardSlideDir((prev) => ({ ...prev, [course.id]: 'left' }));
                              setCardAnimKey((prev) => ({ ...prev, [course.id]: (prev[course.id] ?? 0) + 1 }));
                              setCardEventPage((prev) => ({ ...prev, [course.id]: Math.max(0, (prev[course.id] ?? 0) - 1) }));
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
                              setCardEventPage((prev) => ({ ...prev, [course.id]: Math.min(totalEvtPages - 1, (prev[course.id] ?? 0) + 1) }));
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

          {/* Draft course card (inline, at bottom of grid) */}
          {draftCourse && (
            <div
              className={`rounded-2xl border-2 border-dashed border-slate-300 bg-white p-5 transition-opacity duration-200 ${draftVisible ? 'opacity-100' : 'opacity-0'}`}
            >
              <div className="flex items-start gap-2 mb-4">
                <div className="w-3 h-3 mt-1.5 rounded-full bg-slate-200 shrink-0" />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <input
                    autoFocus
                    placeholder="Course name"
                    value={draftCourse.class_name}
                    onChange={(e) => setDraftCourse({ ...draftCourse, class_name: e.target.value })}
                    onBlur={handleDraftCourseBlur}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); handleDraftCourseBlur(); }
                      if (e.key === 'Escape') { setDraftVisible(false); setTimeout(() => setDraftCourse(null), 200); }
                    }}
                    className={`${inlineInputBase} font-semibold text-slate-900 text-base placeholder-slate-300`}
                  />
                  <input
                    placeholder="Professor (optional)"
                    value={draftCourse.teacher}
                    onChange={(e) => setDraftCourse({ ...draftCourse, teacher: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); handleDraftCourseBlur(); }
                    }}
                    className={`${inlineInputBase} text-xs text-slate-500 placeholder-slate-300`}
                  />
                  <input
                    placeholder="Term (optional)"
                    value={draftCourse.academic_term}
                    onChange={(e) => setDraftCourse({ ...draftCourse, academic_term: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); handleDraftCourseBlur(); }
                    }}
                    className={`${inlineInputBase} text-xs text-slate-400 placeholder-slate-300`}
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-400">Press Enter to save</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
