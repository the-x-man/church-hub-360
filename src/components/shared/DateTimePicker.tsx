'use client';

import * as React from 'react';
import { ChevronDownIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DateTimePickerProps {
  value?: string; // ISO string format: "2024-01-15T10:30:00"
  onChange: (dateTime: string) => void;
  dateLabel?: string;
  timeLabel?: string;
  datePlaceholder?: string;
  timePlaceholder?: string;
  className?: string;
  disabled?: boolean;
  disableDate?: boolean;
  disableTime?: boolean;
  formatDateLabel?: (date: Date) => string;
  id?: string;
  captionLayout?: 'dropdown' | 'dropdown-years' | 'dropdown-months' | 'label';
  fromYear?: number;
  toYear?: number;
  disableFuture?: boolean;
  disablePast?: boolean;
  minDate?: string;
  maxDate?: string;
  align?: 'start' | 'center' | 'end';
  layout?: 'horizontal' | 'vertical';
}

export function DateTimePicker({
  value,
  onChange,
  dateLabel = 'Date',
  timeLabel = 'Time',
  datePlaceholder = 'Select date',
  timePlaceholder = 'Select time',
  className = '',
  disabled = false,
  disableDate = false,
  disableTime = false,
  formatDateLabel,
  id,
  captionLayout = 'dropdown',
  fromYear = 1900,
  toYear = new Date().getFullYear() + 10,
  disableFuture = false,
  disablePast = false,
  minDate,
  maxDate,
  align = 'start',
  layout = 'horizontal',
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Safely parse ISO value using string operations to avoid invalid Date errors
  const iso = value ?? '';
  const [dateOnlyRaw, timeOnlyRaw] = iso.includes('T') ? iso.split('T') : [iso, ''];
  const dateOnly = dateOnlyRaw || '';
  // Display minutes precision to match native behavior elsewhere (HH:MM)
  const timeOnly = timeOnlyRaw ? timeOnlyRaw.split(/[Z+\-]/)[0].slice(0, 5) : '';
  const selectedDate = dateOnly ? new Date(`${dateOnly}T00:00:00`) : undefined;

  const handleDateSelect = (picked: Date | undefined) => {
    if (picked) {
      const datePart = picked.toISOString().slice(0, 10);
      const timePart = timeOnly && /^\d{2}:\d{2}$/.test(timeOnly) ? `${timeOnly}:00` : '00:00:00';
      onChange(`${datePart}T${timePart}`);
    } else {
      onChange('');
    }
    setOpen(false);
  };

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = event.target.value; // expected format HH:MM
    if (!newTime || newTime.length < 5) {
      // Avoid producing invalid ISO during partial edits
      return;
    }
    const datePart = dateOnly || new Date().toISOString().slice(0, 10);
    onChange(`${datePart}T${newTime}:00`);
  };

  const getDisabledDates = (date: Date) => {
    const today = new Date();
    const minDateObj = minDate ? new Date(minDate) : null;
    const maxDateObj = maxDate ? new Date(maxDate) : null;

    // Check future dates
    if (disableFuture && date > today) {
      return true;
    }

    // Check past dates
    if (disablePast && date < today) {
      return true;
    }

    // Check min date
    if (minDateObj && date < minDateObj) {
      return true;
    }

    // Check max date
    if (maxDateObj && date > maxDateObj) {
      return true;
    }

    return false;
  };

  const datePickerId = id ? `${id}-date` : 'date-picker';
  const timePickerId = id ? `${id}-time` : 'time-picker';

  const containerClass =
    layout === 'vertical' ? 'flex flex-col gap-4' : 'flex gap-2';

  return (
    <div className={cn(containerClass, className)}>
      <div className="flex flex-col gap-3 flex-1">
        <Label htmlFor={datePickerId} className="px-1">
          {dateLabel}
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id={datePickerId}
              className="w-full min-w-32 justify-between font-normal"
              disabled={disabled || disableDate}
            >
              {selectedDate
                ? (formatDateLabel ? formatDateLabel(selectedDate) : selectedDate.toLocaleDateString())
                : datePlaceholder}
              <ChevronDownIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align={align}>
            <Calendar
              mode="single"
              selected={selectedDate}
              captionLayout={captionLayout}
              onSelect={handleDateSelect}
              disabled={getDisabledDates}
              fromYear={fromYear}
              toYear={toYear}
              defaultMonth={selectedDate || new Date()}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-col gap-3">
        <Label htmlFor={timePickerId} className="px-1">
          {timeLabel}
        </Label>
        <Input
          type="time"
          id={timePickerId}
          step="60"
          value={timeOnly}
          onChange={handleTimeChange}
          placeholder={timePlaceholder}
          disabled={disabled || disableTime}
          className="bg-background appearance-none "
        />
      </div>
    </div>
  );
}
