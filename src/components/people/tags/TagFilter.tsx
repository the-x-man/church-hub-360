import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Check, ChevronsUpDown, X, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RelationalTagWithItems } from '@/hooks/useRelationalTags';

export interface TagFilterValue {
  tag_items: string[];
  tag_filter_mode: 'any' | 'all';
}

interface TagFilterProps {
  tags: RelationalTagWithItems[];
  value?: TagFilterValue;
  onChange?: (value: TagFilterValue | undefined) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function TagFilter({
  tags,
  value,
  onChange,
  disabled = false,
  className,
  placeholder = 'Filter by tags...',
}: TagFilterProps) {
  const [open, setOpen] = useState(false);

  // Flatten all tag items with their parent tag info
  const allTagItems = useMemo(() => {
    return tags
      .flatMap(
        (tag) =>
          tag.tag_items
            ?.filter((item) => item.is_active)
            .map((item) => ({
              ...item,
              tagName: tag.name,
              tagId: tag.id,
            })) || []
      )
      .sort((a, b) => {
        // Sort by tag name first, then by item display order
        if (a.tagName !== b.tagName) {
          return a.tagName.localeCompare(b.tagName);
        }
        return (a.display_order ?? 999) - (b.display_order ?? 999);
      });
  }, [tags]);

  const selectedItems = useMemo(() => {
    if (!value?.tag_items) return [];
    return allTagItems.filter((item) => value.tag_items.includes(item.id));
  }, [allTagItems, value?.tag_items]);

  const handleItemToggle = (itemId: string) => {
    const currentItems = value?.tag_items || [];
    const isSelected = currentItems.includes(itemId);

    let newItems: string[];
    if (isSelected) {
      newItems = currentItems.filter((id) => id !== itemId);
    } else {
      newItems = [...currentItems, itemId];
    }

    if (newItems.length === 0) {
      onChange?.(undefined);
    } else {
      onChange?.({
        tag_items: newItems,
        tag_filter_mode: value?.tag_filter_mode || 'any',
      });
    }
  };

  const handleModeChange = (mode: 'any' | 'all') => {
    if (value) {
      onChange?.({
        ...value,
        tag_filter_mode: mode,
      });
    }
  };

  const handleClear = () => {
    onChange?.(undefined);
  };

  const hasSelection = value && value.tag_items.length > 0;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between h-9 px-3',
              !hasSelection && 'text-muted-foreground'
            )}
            disabled={disabled}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Tag className="h-4 w-4 shrink-0" />
              <div className="flex-1 text-left overflow-hidden">
                {!hasSelection ? (
                  placeholder
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium">
                      {selectedItems.length} tag
                      {selectedItems.length !== 1 ? 's' : ''}
                    </span>
                    {selectedItems.length <= 2 ? (
                      <div className="flex gap-1">
                        {selectedItems.map((item) => (
                          <Badge
                            key={item.id}
                            variant="secondary"
                            className="text-xs px-1 py-0 h-4"
                          >
                            {item.name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="text-xs px-1 py-0 h-4"
                      >
                        +{selectedItems.length - 2} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {hasSelection && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-3 border-b">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Filter Mode</Label>
              {hasSelection && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-6 px-2 text-xs"
                >
                  Clear all
                </Button>
              )}
            </div>
            <Select
              value={value?.tag_filter_mode || 'any'}
              onValueChange={handleModeChange}
              disabled={!hasSelection}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">
                  <div className="flex flex-col">
                    <span>Any (OR)</span>
                    <span className="text-xs text-muted-foreground">
                      Match members with any selected tag
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="all">
                  <div className="flex flex-col">
                    <span>All (AND)</span>
                    <span className="text-xs text-muted-foreground">
                      Match members with all selected tags
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Command>
            <CommandInput placeholder="Search tags..." className="h-8" />
            <CommandList>
              <CommandEmpty>No tags found.</CommandEmpty>
              {tags.map((tag) => {
                const tagItems =
                  tag.tag_items?.filter((item) => item.is_active) || [];
                if (tagItems.length === 0) return null;

                return (
                  <CommandGroup key={tag.id} heading={tag.name}>
                    {tagItems
                      .sort(
                        (a, b) =>
                          (a.display_order ?? 999) - (b.display_order ?? 999)
                      )
                      .map((item) => {
                        const isSelected =
                          value?.tag_items.includes(item.id) || false;
                        return (
                          <CommandItem
                            key={item.id}
                            onSelect={() => handleItemToggle(item.id)}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Check
                              className={cn(
                                'h-4 w-4',
                                isSelected ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            <div
                              className="w-3 h-3 rounded-full border shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm">{item.name}</div>
                            </div>
                          </CommandItem>
                        );
                      })}
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
