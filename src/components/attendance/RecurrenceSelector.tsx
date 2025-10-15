import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface RecurrenceSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}

type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

const WEEKDAYS = [
  { label: 'Sunday', value: 'SU' },
  { label: 'Monday', value: 'MO' },
  { label: 'Tuesday', value: 'TU' },
  { label: 'Wednesday', value: 'WE' },
  { label: 'Thursday', value: 'TH' },
  { label: 'Friday', value: 'FR' },
  { label: 'Saturday', value: 'SA' },
];

export function RecurrenceSelector({ value = '', onChange, error }: RecurrenceSelectorProps) {
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(() => {
    if (!value) return 'none';
    if (value === 'FREQ=DAILY') return 'daily';
    if (value.startsWith('FREQ=WEEKLY')) return 'weekly';
    if (value.startsWith('FREQ=MONTHLY')) return 'monthly';
    if (value.startsWith('FREQ=YEARLY')) return 'yearly';
    return 'custom';
  });

  const [interval, setInterval] = useState(1);
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>(() => {
    if (value && value.includes('BYDAY=')) {
      const match = value.match(/BYDAY=([^;]+)/);
      return match ? match[1].split(',') : [];
    }
    return [];
  });
  const [customRule, setCustomRule] = useState(value);

  // Update state when value prop changes (for edit mode)
  useEffect(() => {
    if (value !== customRule) {
      setCustomRule(value);
      
      // Update recurrence type based on new value
      if (!value) {
        setRecurrenceType('none');
      } else if (value === 'FREQ=DAILY') {
        setRecurrenceType('daily');
      } else if (value.startsWith('FREQ=WEEKLY')) {
        setRecurrenceType('weekly');
        // Update selected weekdays
        if (value.includes('BYDAY=')) {
          const match = value.match(/BYDAY=([^;]+)/);
          setSelectedWeekdays(match ? match[1].split(',') : []);
        } else {
          setSelectedWeekdays([]);
        }
      } else if (value.startsWith('FREQ=MONTHLY')) {
        setRecurrenceType('monthly');
      } else if (value.startsWith('FREQ=YEARLY')) {
        setRecurrenceType('yearly');
      } else {
        setRecurrenceType('custom');
      }
      
      // Update interval if present
      const intervalMatch = value.match(/INTERVAL=(\d+)/);
      if (intervalMatch) {
        setInterval(parseInt(intervalMatch[1]));
      } else {
        setInterval(1);
      }
    }
  }, [value, customRule]);

  const generateRecurrenceRule = (type: RecurrenceType) => {
    switch (type) {
      case 'none':
        return '';
      case 'daily':
        return interval === 1 ? 'FREQ=DAILY' : `FREQ=DAILY;INTERVAL=${interval}`;
      case 'weekly':
        let weeklyRule = interval === 1 ? 'FREQ=WEEKLY' : `FREQ=WEEKLY;INTERVAL=${interval}`;
        if (selectedWeekdays.length > 0) {
          weeklyRule += `;BYDAY=${selectedWeekdays.join(',')}`;
        }
        return weeklyRule;
      case 'monthly':
        return interval === 1 ? 'FREQ=MONTHLY' : `FREQ=MONTHLY;INTERVAL=${interval}`;
      case 'yearly':
        return interval === 1 ? 'FREQ=YEARLY' : `FREQ=YEARLY;INTERVAL=${interval}`;
      case 'custom':
        return customRule;
      default:
        return '';
    }
  };

  const handleTypeChange = (type: RecurrenceType) => {
    setRecurrenceType(type);
    const rule = generateRecurrenceRule(type);
    onChange(rule);
  };

  const handleIntervalChange = (newInterval: number) => {
    setInterval(newInterval);
    const rule = generateRecurrenceRule(recurrenceType);
    onChange(rule);
  };

  const handleWeekdayToggle = (weekday: string) => {
    const newWeekdays = selectedWeekdays.includes(weekday)
      ? selectedWeekdays.filter(w => w !== weekday)
      : [...selectedWeekdays, weekday];
    
    setSelectedWeekdays(newWeekdays);
    
    if (recurrenceType === 'weekly') {
      let rule = interval === 1 ? 'FREQ=WEEKLY' : `FREQ=WEEKLY;INTERVAL=${interval}`;
      if (newWeekdays.length > 0) {
        rule += `;BYDAY=${newWeekdays.join(',')}`;
      }
      onChange(rule);
    }
  };

  const handleCustomRuleChange = (rule: string) => {
    setCustomRule(rule);
    if (recurrenceType === 'custom') {
      onChange(rule);
    }
  };

  return (
    <div className="space-y-4">
      <Label>Recurrence</Label>
      
      {/* Recurrence Type Selector */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Button
          type="button"
          variant={recurrenceType === 'none' ? "default" : "outline"}
          size="sm"
          onClick={() => handleTypeChange('none')}
          className="text-xs"
        >
          None
        </Button>
        <Button
          type="button"
          variant={recurrenceType === 'daily' ? "default" : "outline"}
          size="sm"
          onClick={() => handleTypeChange('daily')}
          className="text-xs"
        >
          Daily
        </Button>
        <Button
          type="button"
          variant={recurrenceType === 'weekly' ? "default" : "outline"}
          size="sm"
          onClick={() => handleTypeChange('weekly')}
          className="text-xs"
        >
          Weekly
        </Button>
        <Button
          type="button"
          variant={recurrenceType === 'monthly' ? "default" : "outline"}
          size="sm"
          onClick={() => handleTypeChange('monthly')}
          className="text-xs"
        >
          Monthly
        </Button>
        <Button
          type="button"
          variant={recurrenceType === 'yearly' ? "default" : "outline"}
          size="sm"
          onClick={() => handleTypeChange('yearly')}
          className="text-xs"
        >
          Yearly
        </Button>
        <Button
          type="button"
          variant={recurrenceType === 'custom' ? "default" : "outline"}
          size="sm"
          onClick={() => handleTypeChange('custom')}
          className="text-xs"
        >
          Custom
        </Button>
      </div>

      {/* Interval Selector for non-none types */}
      {recurrenceType !== 'none' && recurrenceType !== 'custom' && (
        <div className="flex items-center gap-2">
          <Label className="text-sm">Every</Label>
          <Select value={interval.toString()} onValueChange={(val) => handleIntervalChange(parseInt(val))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6].map(num => (
                <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {recurrenceType === 'daily' && (interval === 1 ? 'day' : 'days')}
            {recurrenceType === 'weekly' && (interval === 1 ? 'week' : 'weeks')}
            {recurrenceType === 'monthly' && (interval === 1 ? 'month' : 'months')}
            {recurrenceType === 'yearly' && (interval === 1 ? 'year' : 'years')}
          </span>
        </div>
      )}

      {/* Weekday Selector for Weekly */}
      {recurrenceType === 'weekly' && (
        <div className="space-y-2">
          <Label className="text-sm">On days:</Label>
          <div className="grid grid-cols-4 gap-1 sm:grid-cols-7">
            {WEEKDAYS.map((day) => (
              <Button
                key={day.value}
                type="button"
                variant={selectedWeekdays.includes(day.value) ? "default" : "outline"}
                size="sm"
                onClick={() => handleWeekdayToggle(day.value)}
                className="text-xs px-2"
              >
                {day.label.slice(0, 3)}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Custom Rule Input */}
      {recurrenceType === 'custom' && (
        <div className="space-y-2">
          <Label className="text-sm">RFC 5545 Recurrence Rule</Label>
          <Input
            type="text"
            value={customRule}
            onChange={(e) => handleCustomRuleChange(e.target.value)}
            placeholder="e.g., FREQ=WEEKLY;BYDAY=MO,WE,FR"
            className={cn(
              "text-sm",
              error && "border-destructive focus-visible:ring-destructive"
            )}
          />
          <p className="text-xs text-muted-foreground">
            Enter a valid RFC 5545 recurrence rule for advanced patterns
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}