import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGroups } from '@/hooks/useGroups';

export interface GroupSelectProps {
  value?: string;
  onChange?: (groupId?: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function GroupSelect({
  value,
  onChange,
  label,
  placeholder = 'Search groups...',
  disabled = false,
  className,
}: GroupSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data } = useGroups({ page: 1, pageSize: 50, search });
  const groups = data?.data || [];

  const selectedGroup = useMemo(() => groups.find((g) => g.id === value), [groups, value]);

  const renderTriggerText = () => {
    if (selectedGroup) return selectedGroup.name;
    return 'Select group';
  };

  const handleSelect = (id: string) => {
    onChange?.(id);
    setOpen(false);
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    onChange?.(undefined);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && <Label>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            <span className="truncate">{renderTriggerText()}</span>
            <div className="flex items-center gap-2">
              {value && (
                <X
                  className="h-4 w-4 opacity-70 hover:opacity-100"
                  onClick={clearSelection}
                />
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput
              placeholder={placeholder}
              className="h-10"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>No groups found.</CommandEmpty>
              <ScrollArea className="max-h-[260px]">
                <CommandGroup>
                  {groups.map((group) => (
                    <CommandItem
                      key={group.id}
                      onSelect={() => handleSelect(group.id)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm truncate">{group.name}</span>
                        {group.description && (
                          <span className="text-xs text-muted-foreground truncate">{group.description}</span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}