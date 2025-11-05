import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { RelationalTagWithItems } from '@/hooks/useRelationalTags';

interface TagMultiCheckboxRendererProps {
  tag: RelationalTagWithItems;
  tagKey: string;
  value?: string[];
  onChange?: (value: string[]) => void;
  disabled?: boolean;
  className?: string;
}

export function TagMultiCheckboxRenderer({
  tag,
  tagKey,
  value = [],
  onChange,
  disabled = false,
  className,
}: TagMultiCheckboxRendererProps) {
  const activeItems = tag.tag_items?.filter((item) => item.is_active) || [];
  const sortedItems = activeItems.sort((a, b) => {
    const orderA = a.display_order ?? 999;
    const orderB = b.display_order ?? 999;
    return orderA - orderB;
  });

  const handleToggle = (itemId: string, checked: boolean) => {
    if (!onChange) return;
    const current = Array.isArray(value) ? value : [];
    if (checked) {
      onChange(Array.from(new Set([...current, itemId])));
    } else {
      onChange(current.filter((v) => v !== itemId));
    }
  };

  const handleSelectAll = () => {
    if (!onChange) return;
    onChange(sortedItems.map((i) => i.id));
  };

  const handleClear = () => {
    onChange?.([]);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Label
          className="text-sm font-medium truncate"
          title={tag.description || undefined}
        >
          {tag.name}
        </Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7"
            onClick={handleSelectAll}
            disabled={disabled || sortedItems.length === 0}
          >
            Select all
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7"
            onClick={handleClear}
            disabled={disabled || value.length === 0}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="space-y-2">
          <div className="space-y-2 pr-2 max-h-[250px] overflow-auto">
            {sortedItems.map((item) => (
              <div key={item.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`${tagKey}-${item.id}`}
                  checked={value.includes(item.id)}
                  onCheckedChange={(checked) => handleToggle(item.id, Boolean(checked))}
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
            {sortedItems.length === 0 && (
              <div className="text-sm text-muted-foreground">No items</div>
            )}
          </div>
      </div>
    </div>
  );
}