import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RelationalTagWithItems } from '@/hooks/useRelationalTags';

interface TagRendererProps {
  tag: RelationalTagWithItems;
  tagKey: string;
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export function TagRenderer({
  tag,
  tagKey,
  value,
  onChange,
  disabled = false,
  error,
  className,
}: TagRendererProps) {
  const [open, setOpen] = useState(false);

  const activeItems = tag.tag_items?.filter((item) => item.is_active) || [];

  // Sort items by display_order
  const sortedItems = activeItems.sort((a, b) => {
    const orderA = a.display_order ?? 999;
    const orderB = b.display_order ?? 999;
    return orderA - orderB;
  });

  const handleSingleChange = (newValue: string) => {
    onChange?.(newValue);
  };

  const handleMultipleChange = (itemId: string, checked: boolean) => {
    const currentValues = Array.isArray(value) ? value : [];
    if (checked) {
      onChange?.([...currentValues, itemId]);
    } else {
      onChange?.(currentValues.filter((v) => v !== itemId));
    }
  };

  const renderDropdown = () => (
    <Select
      value={typeof value === 'string' ? value : ''}
      onValueChange={handleSingleChange}
      disabled={disabled}
    >
      <SelectTrigger className={cn('w-full', error && 'border-destructive')}>
        <SelectValue placeholder={`Select ${tag.name.toLowerCase()}`} />
      </SelectTrigger>
      <SelectContent>
        {sortedItems.map((item) => (
          <SelectItem key={item.id} value={item.id}>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full border"
                style={{ backgroundColor: item.color }}
              />
              {item.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const renderMultiselect = () => {
    const selectedValues = Array.isArray(value) ? value : [];
    const selectedItems = sortedItems.filter((item) =>
      selectedValues.includes(item.id)
    );

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between min-h-[40px] h-auto',
              error && 'border-destructive',
              selectedValues.length === 0 && 'text-muted-foreground'
            )}
            disabled={disabled}
          >
            <div className="flex-1 text-left overflow-hidden">
              {selectedValues.length === 0 ? (
                `Select ${tag.name.toLowerCase()}`
              ) : (
                <div className="flex flex-wrap gap-1 py-1">
                  {selectedItems.slice(0, 3).map((item) => (
                    <Badge
                      key={item.id}
                      variant="secondary"
                      className="text-xs shrink-0"
                    >
                      {item.name}
                    </Badge>
                  ))}
                  {selectedItems.length > 3 && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      +{selectedItems.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder={`Search ${tag.name.toLowerCase()}...`} />
            <CommandEmpty>No items found.</CommandEmpty>
            <CommandGroup>
              {sortedItems.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => {
                    const isSelected = selectedValues.includes(item.id);
                    handleMultipleChange(item.id, !isSelected);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedValues.includes(item.id)
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  />
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full border"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.name}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  const renderCheckboxes = () => {
    const selectedValues = Array.isArray(value) ? value : [];

    return (
      <div className="space-y-2">
        {sortedItems.map((item) => (
          <div key={item.id} className="flex items-center space-x-2">
            <Checkbox
              id={`${tagKey}-${item.id}`}
              checked={selectedValues.includes(item.id)}
              onCheckedChange={(checked) =>
                handleMultipleChange(item.id, checked as boolean)
              }
              disabled={disabled}
            />
            <Label
              htmlFor={`${tagKey}-${item.id}`}
              className="flex items-center gap-2 cursor-pointer text-sm"
              title={item.description || undefined}
            >
              <div
                className="w-3 h-3 rounded-full border shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate">{item.name}</span>
            </Label>
          </div>
        ))}
      </div>
    );
  };

  const renderRadioButtons = () => (
    <div className="space-y-2">
      {sortedItems.map((item) => (
        <div key={item.id} className="flex items-center space-x-2">
          <input
            type="radio"
            id={`${tagKey}-${item.id}`}
            name={tagKey}
            value={item.id}
            checked={value === item.id}
            onChange={(e) => handleSingleChange(e.target.value)}
            disabled={disabled}
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 shrink-0"
          />
          <Label
            htmlFor={`${tagKey}-${item.id}`}
            className="flex items-center gap-2 cursor-pointer text-sm"
            title={item.description || undefined}
          >
            <div
              className="w-3 h-3 rounded-full border shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="truncate">{item.name}</span>
          </Label>
        </div>
      ))}
    </div>
  );

  const renderList = () => (
    <div className="space-y-1">
      {sortedItems.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-2 p-2 rounded-lg border bg-muted/25"
          title={item.description || undefined}
        >
          <div
            className="w-3 h-3 rounded-full border shrink-0"
            style={{ backgroundColor: item.color }}
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{item.name}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderSelectedValues = () => {
    if (!value) return null;

    const selectedValues = Array.isArray(value) ? value : [value];
    const selectedItems = sortedItems.filter((item) =>
      selectedValues.includes(item.id)
    );

    if (selectedItems.length === 0) return null;

    return (
      <div className="mt-2 flex flex-wrap gap-1">
        {selectedItems.map((item) => (
          <Badge key={item.id} variant="outline" className="text-xs">
            <div
              className="w-2 h-2 rounded-full mr-1"
              style={{ backgroundColor: item.color }}
            />
            {item.name}
            {onChange && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 h-auto p-0 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  if (Array.isArray(value)) {
                    onChange(value.filter((v) => v !== item.id));
                  } else {
                    onChange('');
                  }
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </Badge>
        ))}
      </div>
    );
  };

  const renderComponent = () => {
    switch (tag.component_style) {
      case 'dropdown':
        return renderDropdown();
      case 'multiselect':
        return renderMultiselect();
      case 'checkbox':
        return renderCheckboxes();
      case 'radio':
        return renderRadioButtons();
      case 'list':
        return renderList();
      default:
        return (
          <div className="text-sm text-muted-foreground">
            Unsupported component style
          </div>
        );
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center">
        <Label
          className="text-sm font-medium truncate"
          title={tag.description || undefined}
        >
          {tag.name}
          {tag.is_required && <span className="text-destructive ml-1">*</span>}
        </Label>
      </div>

      {renderComponent()}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {(tag.component_style === 'dropdown' ||
        tag.component_style === 'radio') &&
        renderSelectedValues()}
    </div>
  );
}
