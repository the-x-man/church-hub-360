import { rrulestr } from 'rrule';
import { startOfMonth, endOfMonth, addMonths, startOfDay, endOfDay } from 'date-fns';

export type BulkDurationOption =
  | 'next_1_session'
  | 'next_2_sessions'
  | 'next_3_sessions'
  | 'next_4_sessions'
  | 'next_5_sessions'
  | 'next_6_sessions'
  | 'next_7_sessions'
  | 'next_8_sessions'
  | 'current_month'
  | 'next_2_months'
  | 'next_3_months'
  | 'next_4_months'
  | 'next_5_months'
  | 'next_6_months'
  | 'custom_range';

export function getRangeForOption(option: BulkDurationOption, now: Date = new Date()): { start: Date; end: Date } {
  switch (option) {
    case 'current_month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'next_2_months': {
      const start = startOfMonth(now);
      return { start, end: endOfMonth(addMonths(start, 1)) };
    }
    case 'next_3_months': {
      const start = startOfMonth(now);
      return { start, end: endOfMonth(addMonths(start, 2)) };
    }
    case 'next_4_months': {
      const start = startOfMonth(now);
      return { start, end: endOfMonth(addMonths(start, 3)) };
    }
    case 'next_5_months': {
      const start = startOfMonth(now);
      return { start, end: endOfMonth(addMonths(start, 4)) };
    }
    case 'next_6_months': {
      const start = startOfMonth(now);
      return { start, end: endOfMonth(addMonths(start, 5)) };
    }
    case 'custom_range':
    default:
      // For session-count options we don't use a date range; return a noop range.
      return { start: now, end: now };
  }
}

export function generateOccurrences(recurrenceRule: string, start: Date, end: Date): Date[] {
  try {
    const rule = rrulestr(recurrenceRule);
    return rule.between(start, end, true);
  } catch (e) {
    console.error('Invalid recurrence rule:', recurrenceRule, e);
    return [];
  }
}

export function doesDateMatch(recurrenceRule: string, date: Date): boolean {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  const matches = generateOccurrences(recurrenceRule, dayStart, dayEnd);
  return matches.length > 0;
}

export function generateNextOccurrences(recurrenceRule: string, count: number, from: Date = new Date()): Date[] {
  try {
    const rule = rrulestr(recurrenceRule);
    const results: Date[] = [];
    let cursor = from;
    for (let i = 0; i < count; i++) {
      const next = (rule as any).after(cursor, false) as Date | null;
      if (!next) break;
      results.push(next);
      cursor = next;
    }
    return results;
  } catch (e) {
    console.error('Invalid recurrence rule:', recurrenceRule, e);
    return [];
  }
}