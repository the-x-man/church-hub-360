import * as React from "react";
import { ChevronDownIcon } from "lucide-react";

import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Label } from "../ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";

interface DateOfBirthPickerProps {
  value?: string;
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DateOfBirthPicker({
  value,
  onChange,
  label = "Date of birth",
  placeholder = "Select date",
  className = "w-full",
  disabled = false
}: DateOfBirthPickerProps) {
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

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor="date-of-birth" className="px-1">
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date-of-birth"
            className={`${className} justify-between font-normal`}
            disabled={disabled}
          >
            {selectedDate ? selectedDate.toLocaleDateString() : placeholder}
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            captionLayout="dropdown"
            onSelect={handleDateSelect}
            disabled={(date) =>
              date > new Date() || date < new Date("1900-01-01")
            }
            fromYear={1900}
            toYear={new Date().getFullYear()}
            defaultMonth={selectedDate || new Date()}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}