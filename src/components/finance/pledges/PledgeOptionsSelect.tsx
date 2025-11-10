'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

interface PledgeOptionsSelectProps {
  label: string;
  value: string | null;
  options: string[];
  onChange: (val: string) => void;
  onCreateOption?: (val: string) => Promise<void> | void;
  placeholder?: string;
  buttonClassName?: string;
}

export function PledgeOptionsSelect({
  label,
  value,
  options,
  onChange,
  onCreateOption,
  placeholder,
  buttonClassName,
}: PledgeOptionsSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [newOption, setNewOption] = React.useState('');

  const filtered = React.useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return options;
    return options.filter((opt) => opt.toLowerCase().includes(s));
  }, [search, options]);

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
    setSearch('');
  };

  const handleCreate = async () => {
    const v = newOption.trim();
    if (!v) return;
    if (onCreateOption) await onCreateOption(v);
    onChange(v);
    setOpen(false);
    setNewOption('');
    setSearch('');
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">{label}</p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={buttonClassName || 'w-full justify-start'}
          >
            {value ? (
              <span className="truncate">{value}</span>
            ) : (
              <span className="text-muted-foreground">+ Select</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[280px]" side="right" align="start">
          <Command>
            <CommandInput
              placeholder={placeholder || `Search ${label.toLowerCase()}...`}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {filtered.map((opt) => (
                  <CommandItem key={opt} value={opt} onSelect={handleSelect}>
                    {opt}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          {onCreateOption && (
            <div className="border-t p-2 space-y-2">
              <Input
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                placeholder={`Add new ${label.toLowerCase()}`}
              />
              <div className="flex justify-end">
                <Button size="sm" onClick={handleCreate}>
                  Add
                </Button>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
