import { ScrollArea } from '@/components/ui/scroll-area';
import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import ThumbnailItem from './ThumbnailItem';
import type { SlideDraft } from '@/types';
import { normalizeSlides } from './utils';

export default function ThumbnailList({
  slides,
  selectedId,
  onSelect,
  onDelete,
  onReorder,
}: {
  slides: SlideDraft[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (next: SlideDraft[]) => void;
}) {
  const ids = slides.map((s) => s.id);
  return (
    <ScrollArea className="h-full px-2 border-y">
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={({ active, over }) => {
          if (!over || active.id === over.id) return;
          const oldIndex = ids.indexOf(String(active.id));
          const newIndex = ids.indexOf(String(over.id));
          const reordered = arrayMove(slides, oldIndex, newIndex);
          onReorder(normalizeSlides(reordered));
        }}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 p-2">
            {slides.map((s, idx) => (
              <ThumbnailItem
                key={s.id}
                id={s.id}
                index={idx}
                selected={selectedId === s.id}
                onSelect={() => onSelect(s.id)}
                title={s.title || ''}
                html={s.content_html || ''}
                onDelete={() => onDelete(s.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </ScrollArea>
  );
}
