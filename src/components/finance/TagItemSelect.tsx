import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useTagsQuery, type RelationalTagItem, type RelationalTagWithItems } from '@/hooks/useRelationalTags';

export interface TagItemSelectProps {
  value?: string;
  onChange?: (tagItemId?: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function TagItemSelect({
  value,
  onChange,
  label,
  placeholder = 'Search tags...',
  disabled = false,
  className,
}: TagItemSelectProps) {
  const { currentOrganization } = useOrganization();
  const { data: tags = [], isLoading } = useTagsQuery(currentOrganization?.id);
  const [open, setOpen] = useState(false);

  const allItems: RelationalTagItem[] = useMemo(() => {
    return tags.flatMap((t) => (t.tag_items || []).filter((i) => i.is_active));
  }, [tags]);

  const selectedItem = useMemo(() => allItems.find((i) => i.id === value), [allItems, value]);


  const renderTriggerText = () => {
    if (selectedItem) return selectedItem.name;
    if (isLoading) return 'Loading tags...';
    return 'Select tag item';
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
            <div className="flex items-center gap-2 truncate">
              {selectedItem && (
                <div
                  className="w-3 h-3 rounded-full border shrink-0"
                  style={{ backgroundColor: selectedItem.color }}
                />
              )}
              <span className="truncate">
                {renderTriggerText()}
              </span>
            </div>
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
            <CommandInput placeholder={placeholder} className="h-10" />
            <CommandList>
              <CommandEmpty>No tag items found.</CommandEmpty>
              {tags.map((tag: RelationalTagWithItems) => {
                const tagItems = (tag.tag_items || []).filter((i) => i.is_active);
                if (tagItems.length === 0) return null;
                return (
                  <CommandGroup key={tag.id} heading={tag.name}>
                    <ScrollArea className="max-h-[260px]">
                      {tagItems
                        .sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999))
                        .map((item) => (
                          <CommandItem
                            key={item.id}
                            onSelect={() => handleSelect(item.id)}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <div
                              className="w-3 h-3 rounded-full border shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm">{item.name}</div>
                              {item.description && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {item.description}
                                </div>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                    </ScrollArea>
                  </CommandGroup>
                );
              })}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}