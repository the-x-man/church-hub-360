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

  // Parse the ISO string to get date and time parts
  const dateTime = value ? new Date(value) : undefined;
  const dateOnly = dateTime ? dateTime.toISOString().split('T')[0] : '';
  const timeOnly = dateTime ? dateTime.toTimeString().split(' ')[0] : '';

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Preserve existing time or use current time
      const existingTime = timeOnly || new Date().toTimeString().split(' ')[0];
      const newDateTime = `${
        selectedDate.toISOString().split('T')[0]
      }T${existingTime}`;
      onChange(newDateTime);
    } else {
      onChange('');
    }
    setOpen(false);
  };

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = event.target.value;
    if (dateOnly) {
      const newDateTime = `${dateOnly}T${newTime}`;
      onChange(newDateTime);
    } else {
      // If no date is selected, use today's date
      const today = new Date().toISOString().split('T')[0];
      const newDateTime = `${today}T${newTime}`;
      onChange(newDateTime);
    }
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
              disabled={disabled}
            >
              {dateTime ? dateTime.toLocaleDateString() : datePlaceholder}
              <ChevronDownIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align={align}>
            <Calendar
              mode="single"
              selected={dateTime}
              captionLayout={captionLayout}
              onSelect={handleDateSelect}
              disabled={getDisabledDates}
              fromYear={fromYear}
              toYear={toYear}
              defaultMonth={dateTime || new Date()}
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
          step="1"
          value={timeOnly}
          onChange={handleTimeChange}
          placeholder={timePlaceholder}
          disabled={disabled}
          className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </div>
    </div>
  );
}
