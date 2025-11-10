import * as React from 'react';
import { ChevronDownIcon } from 'lucide-react';

import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { Label } from '../ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface DatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
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
  buttonId?: string;
}

export function DatePicker({
  value,
  onChange,
  label,
  placeholder = 'Select date',
  className = 'w-full',
  disabled = false,
  formatDateLabel,
  id,
  captionLayout = 'dropdown',
  fromYear = 1900,
  toYear = new Date().getFullYear(),
  disableFuture = false,
  disablePast = false,
  minDate,
  maxDate,
  align = 'start',
  buttonId = id || 'date-picker',
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selectedDate = value ? new Date(value) : undefined;

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onChange(date.toISOString().split('T')[0]);
    } else {
      onChange('');
    }
    setOpen(false);
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

  return (
    <div className="flex flex-col gap-3">
      {label && (
        <Label htmlFor={buttonId} className="px-1">
          {label}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id={buttonId}
            className={`${className} justify-between font-normal`}
            disabled={disabled}
          >
            {selectedDate
              ? formatDateLabel
                ? formatDateLabel(selectedDate)
                : selectedDate.toLocaleDateString()
              : placeholder}
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
  );
}
