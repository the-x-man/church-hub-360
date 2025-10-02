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
import type { TagCategoryWithId } from '@/types/people-configurations';

interface TagRendererProps {
  category: TagCategoryWithId;
  categoryKey: string;
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export function TagRenderer({
  category,
  categoryKey,
  value,
  onChange,
  disabled = false,
  error,
  className,
}: TagRendererProps) {
  const [open, setOpen] = useState(false);
  
  const activeItems = category.items.filter(item => item.is_active);
  
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
      onChange?.(currentValues.filter(v => v !== itemId));
    }
  };

  const renderDropdown = () => (
    <Select
      value={typeof value === 'string' ? value : ''}
      onValueChange={handleSingleChange}
      disabled={disabled}
    >
      <SelectTrigger className={cn("w-full", error && "border-destructive")}>
        <SelectValue placeholder={`Select ${category.name.toLowerCase()}`} />
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
    const selectedItems = sortedItems.filter(item => selectedValues.includes(item.id));

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              error && "border-destructive",
              selectedValues.length === 0 && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            {selectedValues.length === 0 ? (
              `Select ${category.name.toLowerCase()}`
            ) : (
              <div className="flex flex-wrap gap-1">
                {selectedItems.slice(0, 2).map((item) => (
                  <Badge key={item.id} variant="secondary" className="text-xs">
                    {item.name}
                  </Badge>
                ))}
                {selectedItems.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{selectedItems.length - 2} more
                  </Badge>
                )}
              </div>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder={`Search ${category.name.toLowerCase()}...`} />
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
                      "mr-2 h-4 w-4",
                      selectedValues.includes(item.id) ? "opacity-100" : "opacity-0"
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
      <div className="space-y-3">
        {sortedItems.map((item) => (
          <div key={item.id} className="flex items-center space-x-2">
            <Checkbox
              id={`${categoryKey}-${item.id}`}
              checked={selectedValues.includes(item.id)}
              onCheckedChange={(checked) => 
                handleMultipleChange(item.id, checked as boolean)
              }
              disabled={disabled}
            />
            <Label 
              htmlFor={`${categoryKey}-${item.id}`}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div 
                className="w-3 h-3 rounded-full border"
                style={{ backgroundColor: item.color }}
              />
              {item.name}
              {item.description && (
                <span className="text-xs text-muted-foreground">
                  - {item.description}
                </span>
              )}
            </Label>
          </div>
        ))}
      </div>
    );
  };

  const renderRadioButtons = () => (
    <div className="space-y-3">
      {sortedItems.map((item) => (
        <div key={item.id} className="flex items-center space-x-2">
          <input
            type="radio"
            id={`${categoryKey}-${item.id}`}
            name={categoryKey}
            value={item.id}
            checked={value === item.id}
            onChange={(e) => handleSingleChange(e.target.value)}
            disabled={disabled}
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
          />
          <Label 
            htmlFor={`${categoryKey}-${item.id}`}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div 
              className="w-3 h-3 rounded-full border"
              style={{ backgroundColor: item.color }}
            />
            {item.name}
            {item.description && (
              <span className="text-xs text-muted-foreground">
                - {item.description}
              </span>
            )}
          </Label>
        </div>
      ))}
    </div>
  );

  const renderList = () => (
    <div className="space-y-2">
      {sortedItems.map((item) => (
        <div 
          key={item.id} 
          className="flex items-center gap-3 p-2 rounded-lg border bg-muted/25"
        >
          <div 
            className="w-3 h-3 rounded-full border"
            style={{ backgroundColor: item.color }}
          />
          <div className="flex-1">
            <div className="text-sm font-medium">{item.name}</div>
            {item.description && (
              <div className="text-xs text-muted-foreground">{item.description}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderSelectedValues = () => {
    if (!value) return null;

    const selectedValues = Array.isArray(value) ? value : [value];
    const selectedItems = sortedItems.filter(item => selectedValues.includes(item.id));

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
                    onChange(value.filter(v => v !== item.id));
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
    switch (category.component_style) {
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
        return <div className="text-sm text-muted-foreground">Unsupported component style</div>;
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          {category.name}
          {category.is_required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {category.description && (
          <span className="text-xs text-muted-foreground">{category.description}</span>
        )}
      </div>
      
      {renderComponent()}
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      
      {(category.component_style === 'dropdown' || category.component_style === 'radio') && 
       renderSelectedValues()}
    </div>
  );
}