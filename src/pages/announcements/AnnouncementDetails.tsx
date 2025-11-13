import SlideEditor from '@/components/announcements/slides/SlideEditor';
import ThumbnailList from '@/components/announcements/slides/ThumbnailList';
import PresentationView from '@/components/announcements/slides/PresentationView';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  useAnnouncement,
  useUpdateAnnouncement,
} from '@/hooks/announcements/useAnnouncements';
import type { SlideDraft } from '@/types';
import { ArrowLeft } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { normalizeSlides, createDefaultSlide } from '@/components/announcements/slides/utils';

export default function AnnouncementDetails() {
  const { announcementId } = useParams();
  const aQuery = useAnnouncement(announcementId || '');
  const updateAnnouncement = useUpdateAnnouncement();

  const [mode, setMode] = useState<'list' | 'presentation'>('list');
  const [localSlides, setLocalSlides] = useState<SlideDraft[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Parse slides from JSON string when announcement data loads
  React.useEffect(() => {
    const raw = aQuery.data?.slides as unknown;
    let arr: any[] = [];
    if (Array.isArray(raw)) {
      arr = raw as any[];
    } else if (typeof raw === 'string') {
      const str = raw.trim();
      if (str.length > 0) {
        try {
          const parsed = JSON.parse(str);
          if (Array.isArray(parsed)) arr = parsed;
        } catch {}
      }
    }
    const normalized = normalizeSlides(arr);
    if (normalized.length === 0) {
      const s = createDefaultSlide(1);
      setLocalSlides([s]);
      setEditingId(s.id);
    } else {
      setLocalSlides(normalized);
      setEditingId(normalized[0].id);
    }
    setHasUnsavedChanges(false);
  }, [aQuery.data?.slides]);

  const slides = useMemo(() => localSlides, [localSlides]);

  

  const addSlide = () => {
    const next = createDefaultSlide(slides.length + 1);
    setLocalSlides((prev) => normalizeSlides([...prev, next]));
    setEditingId(next.id);
    setHasUnsavedChanges(true);
  };

  const saveAllSlides = async () => {
    if (!announcementId) return;

    try {
      const normalized = normalizeSlides([...localSlides]);
      const sortedSlides = normalized.sort((a, b) => a.position - b.position);
      const slidesJson = JSON.stringify(sortedSlides);

      await updateAnnouncement.mutateAsync({
        id: announcementId,
        updates: { slides: slidesJson },
      });

      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save slides:', error);
    }
  };
  const startEdit = (slideId: string) => {
    if (!slides.find((x) => x.id === slideId)) return;
    setEditingId(slideId);
  };

  const deleteSlide = (slideId: string) => {
    const next = normalizeSlides(localSlides.filter((slide) => slide.id !== slideId));
    if (next.length === 0) {
      const s = createDefaultSlide(1);
      setLocalSlides([s]);
      setEditingId(s.id);
    } else {
      setLocalSlides(next);
      if (editingId === slideId) setEditingId(next[0].id);
    }
    setHasUnsavedChanges(true);
  };

  const onReorder = (next: SlideDraft[]) => {
    setLocalSlides(next);
    setHasUnsavedChanges(true);
  };

  const applyPatch = (patch: Partial<SlideDraft>) => {
    if (!editingId) return;
    setLocalSlides((prev) =>
      prev.map((s) => (s.id === editingId ? { ...s, ...patch } : s))
    );
    setHasUnsavedChanges(true);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => history.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">
          {aQuery.data?.title || 'Announcement'}
        </h1>
        <div className="ml-auto flex gap-2">
          <Button
            variant={mode === 'list' ? 'default' : 'outline'}
            onClick={() => setMode('list')}
          >
            Editor
          </Button>
          <Button
            variant={mode === 'presentation' ? 'default' : 'outline'}
            onClick={() => setMode('presentation')}
          >
            Presentation
          </Button>
        </div>
      </div>

      {mode === 'list' && (
        <div className="space-y-4">
          <p className="text-lg font-semibold pl-12 pr-2">Manage Announcement Slides</p>
          <Card className="p-0">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] h-[calc(100vh-220px)] min-h-[560px]">
                <div className="border-r p-4 flex flex-col min-h-0">
                  <div className="flex justify-between items-center mb-4 shrink-0">
                    <h3 className="font-semibold">Slides</h3>
                    <Button onClick={addSlide} size="sm">Add Slide</Button>
                  </div>
                  <div className="flex-1 min-h-0">
                    <ThumbnailList
                      slides={slides}
                      selectedId={editingId}
                      onSelect={startEdit}
                      onDelete={deleteSlide}
                      onReorder={onReorder}
                    />
                  </div>
                </div>
                <div className="flex flex-col overflow-hidden">
                  <SlideEditor
                    slide={slides.find((s) => s.id === editingId) || null}
                    onChange={applyPatch}
                  />
                </div>
              </div>
              <div className="border-t p-4 flex justify-between items-center">
                {hasUnsavedChanges && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span className="inline-block h-2 w-2 rounded-full bg-destructive mr-2" />
                    Unsaved changes
                  </div>
                )}
                <Button
                  onClick={saveAllSlides}
                  disabled={updateAnnouncement.isPending || !hasUnsavedChanges}
                  className="ml-auto"
                >
                  {updateAnnouncement.isPending ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {mode === 'presentation' && (
        <PresentationView slides={slides} onExit={() => setMode('list')} />
      )}
    </div>
  );
}
