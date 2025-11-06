import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from 'lucide-react';
import { Calendar as UiCalendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, startOfToday, endOfToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subMonths } from 'date-fns';

export type DatePreset =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_month'
  | 'custom';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface DatePresetValue {
  preset: DatePreset;
  range: DateRange;
}

interface DatePresetPickerProps {
  value: DatePresetValue;
  onChange: (val: DatePresetValue) => void;
  disabled?: boolean;
  className?: string;
}

function computePreset(preset: DatePreset): DateRange {
  const now = new Date();
  switch (preset) {
    case 'today':
      return { from: startOfToday(), to: endOfToday() };
    case 'this_week':
      return { from: startOfWeek(now), to: endOfWeek(now) };
    case 'this_month':
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case 'last_7_days':
      return { from: subDays(startOfToday(), 6), to: endOfToday() };
    case 'last_30_days':
      return { from: subDays(startOfToday(), 29), to: endOfToday() };
    case 'last_month': {
      const lastMonthDate = subMonths(now, 1);
      return { from: startOfMonth(lastMonthDate), to: endOfMonth(lastMonthDate) };
    }
    case 'custom':
    default:
      return { from: startOfToday(), to: endOfToday() };
  }
}

export function DatePresetPicker({ value, onChange, disabled, className }: DatePresetPickerProps) {
  const [open, setOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange>(value.range);

  const displayLabel = useMemo(() => {
    const { from, to } = value.range;
    const label = {
      today: 'Today',
      this_week: 'This Week',
      this_month: 'This Month',
      last_7_days: 'Last 7 Days',
      last_30_days: 'Last 30 Days',
      last_month: 'Last Month',
      custom: 'Custom Range',
    }[value.preset];
    return `${label} • ${format(from, 'MMM d, yyyy')} – ${format(to, 'MMM d, yyyy')}`;
  }, [value]);

  const applyPreset = (preset: DatePreset) => {
    const range = computePreset(preset);
    setTempRange(range);
    onChange({ preset, range });
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex flex-wrap gap-2">
        <Button variant={value.preset === 'today' ? 'default' : 'outline'} size="sm" onClick={() => applyPreset('today')} disabled={disabled}>Today</Button>
        <Button variant={value.preset === 'this_week' ? 'default' : 'outline'} size="sm" onClick={() => applyPreset('this_week')} disabled={disabled}>This Week</Button>
        <Button variant={value.preset === 'this_month' ? 'default' : 'outline'} size="sm" onClick={() => applyPreset('this_month')} disabled={disabled}>This Month</Button>
        <Button variant={value.preset === 'last_7_days' ? 'default' : 'outline'} size="sm" onClick={() => applyPreset('last_7_days')} disabled={disabled}>Last 7 Days</Button>
        <Button variant={value.preset === 'last_30_days' ? 'default' : 'outline'} size="sm" onClick={() => applyPreset('last_30_days')} disabled={disabled}>Last 30 Days</Button>
        <Button variant={value.preset === 'last_month' ? 'default' : 'outline'} size="sm" onClick={() => applyPreset('last_month')} disabled={disabled}>Last Month</Button>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant={value.preset === 'custom' ? 'default' : 'outline'} size="sm" disabled={disabled}>
            <Calendar className="w-4 h-4 mr-2" />
            Custom
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-xs mb-2">From</div>
              <UiCalendar
                mode="single"
                selected={tempRange.from}
                onSelect={(date) => date && setTempRange((prev) => ({ ...prev, from: date }))}
              />
            </div>
            <div>
              <div className="text-xs mb-2">To</div>
              <UiCalendar
                mode="single"
                selected={tempRange.to}
                onSelect={(date) => date && setTempRange((prev) => ({ ...prev, to: date }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => { onChange({ preset: 'custom', range: tempRange }); setOpen(false); }}>Apply</Button>
          </div>
        </PopoverContent>
      </Popover>

      <div className="text-xs text-muted-foreground truncate max-w-[320px]" aria-live="polite">{displayLabel}</div>
    </div>
  );
}