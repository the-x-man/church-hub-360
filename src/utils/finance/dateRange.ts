import { format } from 'date-fns';
import {
  startOfToday,
  endOfToday,
  endOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
  subWeeks,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfQuarter,
  endOfQuarter,
  subQuarters,
  startOfYear,
  endOfYear,
  subYears,
} from 'date-fns';
import type { DateFilter, DatePreset } from '@/types/finance';

export interface ResolvedDateRange {
  start: Date;
  end: Date;
}

const resolvePresetRange = (preset: DatePreset): ResolvedDateRange => {
  const today = startOfToday();
  switch (preset) {
    case 'today':
      return { start: startOfToday(), end: endOfToday() };
    case 'yesterday': {
      const y = subDays(today, 1);
      return { start: y, end: endOfDay(y) };
    }
    case 'this_week':
      return { start: startOfWeek(today), end: endOfWeek(today) };
    case 'last_week': {
      const last = subWeeks(today, 1);
      return { start: startOfWeek(last), end: endOfWeek(last) };
    }
    case 'this_month':
      return { start: startOfMonth(today), end: endOfMonth(today) };
    case 'last_month': {
      const last = subMonths(today, 1);
      return { start: startOfMonth(last), end: endOfMonth(last) };
    }
    case 'this_quarter':
      return { start: startOfQuarter(today), end: endOfQuarter(today) };
    case 'last_quarter': {
      const last = subQuarters(today, 1);
      return { start: startOfQuarter(last), end: endOfQuarter(last) };
    }
    case 'this_year':
      return { start: startOfYear(today), end: endOfYear(today) };
    case 'last_year': {
      const last = subYears(today, 1);
      return { start: startOfYear(last), end: endOfYear(last) };
    }
    default:
      return { start: startOfToday(), end: endOfToday() };
  }
};

export const resolveDateFilterRange = (df?: DateFilter): ResolvedDateRange | undefined => {
  if (!df) return undefined;
  if (df.type === 'custom') {
    if (df.start_date && df.end_date) {
      const start = new Date(df.start_date);
      const end = new Date(df.end_date);
      return { start, end };
    }
    return undefined;
  }
  if (df.type === 'preset' && df.preset) {
    return resolvePresetRange(df.preset);
  }
  return undefined;
};

export const formatResolvedRangeLabel = (range?: ResolvedDateRange): string | undefined => {
  if (!range) return undefined;
  const sameDay = range.start.toDateString() === range.end.toDateString();
  const from = format(range.start, 'MMM dd, yyyy');
  const to = format(range.end, 'MMM dd, yyyy');
  return sameDay ? from : `${from} - ${to}`;
};

export const formatDateFilterLabel = (df?: DateFilter): string | undefined => {
  const range = resolveDateFilterRange(df);
  return formatResolvedRangeLabel(range);
};