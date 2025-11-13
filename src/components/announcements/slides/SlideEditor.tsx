import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import TailwindRichTextEditor from '@/components/shared/TailwindRichTextEditor';
import type { SlideDraft } from '@/types';

export default function SlideEditor({
  slide,
  onChange,
}: {
  slide: SlideDraft | null;
  onChange: (patch: Partial<SlideDraft>) => void;
}) {
  if (!slide) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-muted-foreground text-center">Select a slide to edit</div>
      </div>
    );
  }
  return (
    <div className="flex-1 flex flex-col p-4 overflow-hidden">
      <div className="mb-4">
        <Label>Slide Title</Label>
        <Input
          value={slide.title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Slide title"
          className="text-lg font-medium"
        />
      </div>
      <div className="flex-1 flex flex-col">
        <Label>Content</Label>
        <div className="flex-1 mt-1">
          <TailwindRichTextEditor
            value={slide.content_html || ''}
            onChange={(html) => onChange({ content_html: html })}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}