import type { SupabaseClient } from '@supabase/supabase-js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DbCourse {
  id: string;
  user_id: string;
  class_name: string;
  teacher: string;
  academic_term: string | null;
  created_at: string;
}

export interface DbAssignment {
  id: string;
  user_id: string;
  course_id: string;
  event_name: string;
  due_date: string;
  time: string | null;
  type: 'assignment' | 'exam';
  completed: boolean;
  created_at: string;
}

// ─── Courses ────────────────────────────────────────────────────────────────

export async function getCourses(supabase: SupabaseClient): Promise<DbCourse[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createCourse(
  supabase: SupabaseClient,
  course: { class_name: string; teacher?: string; academic_term?: string }
): Promise<DbCourse> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('courses')
    .insert({ ...course, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCourse(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<Pick<DbCourse, 'class_name' | 'teacher' | 'academic_term'>>
): Promise<DbCourse> {
  const { data, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCourse(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('courses').delete().eq('id', id);
  if (error) throw error;
}

// ─── Assignments ────────────────────────────────────────────────────────────

export async function getAllAssignments(supabase: SupabaseClient): Promise<DbAssignment[]> {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .order('due_date', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getAssignmentsByCourse(
  supabase: SupabaseClient,
  courseId: string
): Promise<DbAssignment[]> {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('course_id', courseId)
    .order('due_date', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createAssignments(
  supabase: SupabaseClient,
  assignments: Array<{
    course_id: string;
    event_name: string;
    due_date: string;
    time?: string | null;
    type: 'assignment' | 'exam';
  }>
): Promise<DbAssignment[]> {
  if (assignments.length === 0) return [];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const rows = assignments.map((a) => ({ ...a, user_id: user.id }));

  const { data, error } = await supabase
    .from('assignments')
    .upsert(rows, { onConflict: 'user_id,course_id,event_name,due_date', ignoreDuplicates: true })
    .select();
  if (error) throw error;
  return data ?? [];
}

export async function markAssignmentComplete(
  supabase: SupabaseClient,
  id: string,
  completed: boolean
): Promise<void> {
  const { error } = await supabase
    .from('assignments')
    .update({ completed })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteAssignment(supabase: SupabaseClient, id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { error } = await supabase.from('assignments').delete().eq('id', id).eq('user_id', user.id);
  if (error) throw error;
}
