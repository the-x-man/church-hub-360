import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface DurationSelectorProps {
  value?: number;
  onChange: (value: number) => void;
  error?: string;
}

const PRESET_DURATIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hour', value: 60 },
  { label: '1 hour 30 min', value: 90 },
  { label: '2 hours', value: 120 },
  { label: '2 hours 30 min', value: 150 },
  { label: '3 hours', value: 180 },
  { label: '3 hours 30 min', value: 210 },
  { label: '4 hours', value: 240 },
  { label: '4 hours 30 min', value: 270 },
  { label: '5 hours', value: 300 },
  { label: '5 hours 30 min', value: 330 },
  { label: '6 hours', value: 360 },
];

export function DurationSelector({
  value = 60,
  onChange,
  error,
}: DurationSelectorProps) {
  const [inputValue, setInputValue] = useState(value.toString());

  // Update inputValue when value prop changes (for edit mode)
  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handlePresetChange = (selectedValue: string) => {
    const numValue = parseInt(selectedValue);
    setInputValue(numValue.toString());
    onChange(numValue);
  };

  const handleInputChange = (inputVal: string) => {
    setInputValue(inputVal);
    const numValue = parseInt(inputVal);
    if (!isNaN(numValue) && numValue > 0) {
      onChange(numValue);
    }
  };

  // Find if current value matches a preset
  const currentPreset = PRESET_DURATIONS.find(
    (preset) => preset.value === value
  );

  return (
    <div className="space-y-3">
      <Label>Default Duration</Label>

      <div className="flex items-center gap-3">
        {/* Preset Dropdown */}
        <div className="flex-1">
          <Select
            value={currentPreset ? currentPreset.value.toString() : undefined}
            onValueChange={handlePresetChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              {PRESET_DURATIONS.map((preset) => (
                <SelectItem key={preset.value} value={preset.value.toString()}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Custom Input */}
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Minutes"
            min="1"
            max="1440"
            className={cn(
              'w-24 text-sm',
              error && 'border-destructive focus-visible:ring-destructive'
            )}
          />
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            minutes
          </span>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
