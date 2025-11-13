import { Button } from '@/components/ui/button';
import { GripVertical, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';
import ScaledPreview from './ScaledPreview';

export default function ThumbnailItem({
  id,
  index,
  selected,
  onSelect,
  title,
  html,
  onDelete,
}: {
  id: string;
  index: number;
  selected?: boolean;
  onSelect: () => void;
  title?: string;
  html?: string;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as React.CSSProperties;
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-md border ${selected ? 'ring-2 ring-primary' : ''}`}
    >
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="cursor-grab"
            {...attributes}
            {...listeners}
            onClick={(e) => e.preventDefault()}
            aria-label="Drag to reorder"
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </Button>
          <div className="text-xs text-muted-foreground">{index + 1}</div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <button type="button" className="w-full text-left" onClick={onSelect}>
        <div className="w-full aspect-[16/9] bg-card">
          <div className="h-full w-full p-3 overflow-hidden">
            {title && (
              <div className="text-sm font-semibold mb-2 truncate">{title}</div>
            )}
            <ScaledPreview html={html || ''} />
          </div>
        </div>
      </button>
    </div>
  );
}