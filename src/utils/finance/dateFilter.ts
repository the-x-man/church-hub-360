import type { DateFilter } from '@/types/finance';
import type { DatePresetValue } from '@/components/attendance/reports/DatePresetPicker';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  addDays,
} from 'date-fns';

// Shared utilities to keep date filter mapping consistent across Finance and Pledge filter bars

export function mapPickerToDateFilter(v: DatePresetValue): DateFilter {
  const { preset, range } = v;
  const start = range.from.toISOString();
  const end = range.to.toISOString();
  if (preset !== 'custom') {
    return { type: 'preset', preset, start_date: start, end_date: end } as DateFilter;
  }
  return { type: 'custom', start_date: start, end_date: end };
}

export function mapDateFilterToPicker(df: DateFilter): DatePresetValue {
  if (df.type === 'custom' && df.start_date && df.end_date) {
    return { preset: 'custom', range: { from: new Date(df.start_date), to: new Date(df.end_date) } };
  }
  if (df.type === 'preset' && df.preset) {
    const supported: DatePresetValue['preset'][] = [
      'yesterday',
      'last_3_days',
      'last_7_days',
      'last_15_days',
      'last_30_days',
      'last_60_days',
      'last_90_days',
      'this_week',
      'this_month',
      'last_month',
      'last_2_months',
      'last_3_months',
      'this_year',
    ];
    if (supported.includes(df.preset as any)) {
      const now = new Date();
      let from: Date = now;
      let to: Date = now;
      const presetKey = df.preset as unknown as DatePresetValue['preset'];
      switch (presetKey) {
        case 'yesterday': {
          const y = addDays(now, -1);
          from = startOfDay(y);
          to = endOfDay(y);
          break;
        }
        case 'last_3_days':
          from = startOfDay(addDays(now, -2));
          to = endOfDay(now);
          break;
        case 'last_7_days':
          from = startOfDay(addDays(now, -6));
          to = endOfDay(now);
          break;
        case 'last_15_days':
          from = startOfDay(addDays(now, -14));
          to = endOfDay(now);
          break;
        case 'last_30_days':
          from = startOfDay(addDays(now, -29));
          to = endOfDay(now);
          break;
        case 'last_60_days':
          from = startOfDay(addDays(now, -59));
          to = endOfDay(now);
          break;
        case 'last_90_days':
          from = startOfDay(addDays(now, -89));
          to = endOfDay(now);
          break;
        case 'this_week': {
          from = startOfDay(startOfWeek(now));
          to = endOfDay(endOfWeek(now));
          break;
        }
        case 'this_month': {
          from = startOfMonth(now);
          to = endOfMonth(now);
          break;
        }
        case 'last_month': {
          const last = subMonths(now, 1);
          from = startOfMonth(last);
          to = endOfMonth(last);
          break;
        }
        case 'last_2_months': {
          const twoAgo = subMonths(now, 2);
          const oneAgo = subMonths(now, 1);
          from = startOfMonth(twoAgo);
          to = endOfMonth(oneAgo);
          break;
        }
        case 'last_3_months': {
          const threeAgo = subMonths(now, 3);
          const oneAgo = subMonths(now, 1);
          from = startOfMonth(threeAgo);
          to = endOfMonth(oneAgo);
          break;
        }
        case 'this_year': {
          from = startOfYear(now);
          to = endOfYear(now);
          break;
        }
        default: {
          from = startOfDay(now);
          to = endOfDay(now);
        }
      }
      return { preset: presetKey, range: { from, to } };
    }
  }
  const now = new Date();
  return { preset: 'custom', range: { from: now, to: now } };
}

// User-friendly label for preset keys used across filter bars
export function getPresetLabel(preset?: string): string {
  switch (preset) {
    case 'last_3_days':
      return 'Last 3 Days';
    case 'last_7_days':
      return 'Last 7 Days';
    case 'last_15_days':
      return 'Last 15 Days';
    case 'last_30_days':
      return 'Last 30 Days';
    case 'last_60_days':
      return 'Last 60 Days';
    case 'last_90_days':
      return 'Last 90 Days';
    case 'today':
      return 'Today';
    case 'yesterday':
      return 'Yesterday';
    case 'this_week':
      return 'This Week';
    case 'last_week':
      return 'Last Week';
    case 'this_month':
      return 'This Month';
    case 'last_month':
      return 'Last Month';
    case 'last_2_months':
      return 'Last 2 Months';
    case 'last_3_months':
      return 'Last 3 Months';
    case 'this_quarter':
      return 'This Quarter';
    case 'last_quarter':
      return 'Last Quarter';
    case 'this_year':
      return 'This Year';
    case 'last_year':
      return 'Last Year';
    default:
      return 'Custom Range';
  }
}

export function getDateBounds(df: DateFilter): { start?: string; end?: string } {
  if (df?.start_date || df?.end_date) {
    return { start: df.start_date, end: df.end_date };
  }
  if (df?.type === 'preset' && df?.preset) {
    const mapped = mapDateFilterToPicker(df);
    const from = mapped.range?.from;
    const to = mapped.range?.to;
    return {
      start: from ? from.toISOString() : undefined,
      end: to ? to.toISOString() : undefined,
    };
  }
  return {};
}

export function applyDateFilterQuery(query: any, df?: DateFilter, column: string = 'date') {
  if (!df) return query;
  const { start, end } = getDateBounds(df);
  if (start) query = query.gte(column, start);
  if (end) query = query.lte(column, end);
  return query;
}
