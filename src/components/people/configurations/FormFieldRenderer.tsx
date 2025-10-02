import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { FormComponent } from '@/types/people-configurations';

interface FormFieldRendererProps {
  component: FormComponent;
}

export function FormFieldRenderer({ component }: FormFieldRendererProps) {
  const [value, setValue] = useState<any>('');
  const [date, setDate] = useState<Date>();
  const [checkboxValues, setCheckboxValues] = useState<string[]>([]);

  const handleCheckboxChange = (optionValue: string, checked: boolean) => {
    if (checked) {
      setCheckboxValues(prev => [...prev, optionValue]);
    } else {
      setCheckboxValues(prev => prev.filter(val => val !== optionValue));
    }
  };

  const getDefaultPlaceholder = (type: string): string => {
    switch (type) {
      case 'text':
        return 'Enter text';
      case 'email':
        return 'Enter email address';
      case 'phone':
        return 'Enter phone number';
      case 'number':
        return 'Enter number';
      case 'textarea':
        return 'Enter description';
      default:
        return 'Enter value';
    }
  };

  const placeholder = component.placeholder || getDefaultPlaceholder(component.type);

  switch (component.type) {
    case 'text':
    case 'email':
    case 'phone':
    case 'number':
      return (
        <Input
          type={component.type === 'number' ? 'number' : component.type === 'email' ? 'email' : 'text'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required={component.required}
          className="w-full"
        />
      );

    case 'textarea':
      return (
        <Textarea
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required={component.required}
          className="w-full min-h-[100px]"
        />
      );

    case 'select':
      return (
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={placeholder || "Select an option"} />
          </SelectTrigger>
          <SelectContent>
            {(component.options || ['Option 1', 'Option 2']).map((option, index) => (
              <SelectItem key={index} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'radio':
      return (
        <RadioGroup value={value} onValueChange={setValue} className="space-y-2">
          {(component.options || ['Option 1', 'Option 2']).map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <RadioGroupItem value={option} id={`${component.id}-${index}`} />
              <Label htmlFor={`${component.id}-${index}`} className="text-sm font-normal">
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>
      );

    case 'checkbox':
      return (
        <div className="space-y-2">
          {(component.options || ['Option 1', 'Option 2']).map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Checkbox
                id={`${component.id}-${index}`}
                checked={checkboxValues.includes(option)}
                onCheckedChange={(checked) => handleCheckboxChange(option, checked as boolean)}
              />
              <Label htmlFor={`${component.id}-${index}`} className="text-sm font-normal">
                {option}
              </Label>
            </div>
          ))}
        </div>
      );

    case 'date':
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>{placeholder || "Pick a date"}</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      );

    case 'file':
      return (
        <div className="w-full">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor={`file-${component.id}`}
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-muted-foreground/50 hover:bg-muted/50"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  {placeholder || "Upload a file"}
                </p>
              </div>
              <input
                id={`file-${component.id}`}
                type="file"
                className="hidden"
                required={component.required}
              />
            </label>
          </div>
        </div>
      );

    default:
      return (
        <div className="p-4 border border-dashed border-muted-foreground/25 rounded-md text-center text-muted-foreground">
          Unknown field type: {component.type}
        </div>
      );
  }
}