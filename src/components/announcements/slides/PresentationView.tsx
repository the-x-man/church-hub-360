import { Button } from '@/components/ui/button';
import TailwindRichTextRenderer from '@/components/shared/TailwindRichTextRenderer';
import { ArrowLeft, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import type { SlideDraft } from '@/types';
import React from 'react';

export default function PresentationView({
  slides,
  onExit,
  hideExit,
  hideAutoPlay,
}: {
  slides: SlideDraft[];
  onExit: () => void;
  hideExit?: boolean;
  hideAutoPlay?: boolean;
}) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [autoPlay, setAutoPlay] = React.useState(false);

  React.useEffect(() => {
    if (!autoPlay) return;
    const id = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % Math.max(slides.length, 1));
    }, 5000);
    return () => clearInterval(id);
  }, [autoPlay, slides.length]);

  return (
    <div className="fixed inset-0 bg-background z-50 p-4 md:p-6 grid grid-rows-[auto_1fr]">
      <div className="flex items-center justify-between mb-3 md:mb-4 relative z-10">
        <div className="flex gap-2">
          {!hideExit && (
            <Button variant="ghost" onClick={onExit}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {!hideAutoPlay && (
            <Button variant="outline" onClick={() => setAutoPlay((v) => !v)}>
              {autoPlay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          )}
          <Button variant="outline" onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentIndex((i) => Math.min(i + 1, slides.length - 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="h-full w-full flex items-center justify-center">
        {slides.length > 0 ? (
          <div className="aspect-[16/9] w-[min(100vw,calc(92vh*16/9))] md:w-[min(92vw,calc(92vh*16/9))] max-w-[1600px] rounded-lg border bg-card p-4 md:p-10 overflow-hidden">
            <div className="h-full w-full flex flex-col">
              <TailwindRichTextRenderer className="flex-1 overflow-auto" html={slides[currentIndex]?.content_html || ''} />
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground">No slides</div>
        )}
      </div>
    </div>
  );
}