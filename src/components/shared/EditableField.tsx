import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Pencil, X } from 'lucide-react';

export interface EditableFieldProps {
  label: string;
  value: React.ReactNode;
  renderEditor: () => React.ReactNode;
  startInEdit?: boolean;
  className?: string;
  defaultShowCloseButton?: boolean;
}

export function EditableField({
  label,
  value,
  renderEditor,
  startInEdit = false,
  className,
  defaultShowCloseButton = true,
}: EditableFieldProps) {
  const [editing, setEditing] = React.useState(startInEdit);

  return (
    <div className={cn('', className)}>
      <Label className="text-sm font-medium mb-0.5">{label}</Label>
      {editing ? (
        <div className="flex items-center gap-2">
          <div className="flex-1">{renderEditor()}</div>
          {defaultShowCloseButton && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Cancel edit"
              onClick={() => setEditing(false)}
              className="h-4 w-4"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-md border bg-muted px-3 py-2">
          <div className="text-sm truncate mr-2">{value}</div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Edit"
            onClick={() => setEditing(true)}
            className="h-4 w-4 p-2"
          >
            <Pencil className="h-2 w-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
