/**
 * Computes an effective-hours score for a student assignment or exam.
 *
 * Lower score = higher urgency. Negative score = overdue.
 *
 * Thresholds used in StudyPlan:
 *   score < 72  → 'high'   (within 3 effective days)
 *   score < 168 → 'medium' (within 7 effective days)
 *   score ≥ 168 → 'low'
 *
 * @param dueDate      YYYY-MM-DD string (deadline treated as 23:59 that day)
 * @param type         'assignment' or 'exam'
 * @param classPriority 1 (Low) – 5 (High), defaults to 3 (Average)
 */
export function priority_score(
  dueDate: string,
  type: 'assignment' | 'exam',
  classPriority: number = 3,
): number {
  // Parse deadline as end-of-day so "due today" still has hours remaining
  const due = new Date(dueDate + 'T23:59:00');
  if (isNaN(due.getTime())) return Infinity;

  const hoursUntilDue = (due.getTime() - Date.now()) / (1000 * 60 * 60);

  // Exams are treated as 3 days more urgent than assignments of the same due date
  const examBoostHours = type === 'exam' ? 72 : 0;
  let effectiveHours = hoursUntilDue - examBoostHours;

  // Class priority scales urgency: high-priority classes feel closer in time
  const CLASS_MULTIPLIER: Record<number, number> = {
    1: 1.40, // Low Priority  → less urgent
    2: 1.20,
    3: 1.00, // Average       → no change
    4: 0.80,
    5: 0.60, // High Priority → more urgent
  };
  effectiveHours *= CLASS_MULTIPLIER[classPriority] ?? 1.0;

  return effectiveHours;
}
