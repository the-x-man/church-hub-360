import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';
import { SlideView } from './SlideView';
import type { Slide } from '../../utils/schema';

interface AnnouncementRendererProps {
  slides: Slide[];
  onClose?: () => void;
}

export const AnnouncementRenderer: React.FC<AnnouncementRendererProps> = ({
  slides,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const BASE_WIDTH = 1600;
  const BASE_HEIGHT = 900;

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, isFullscreen, toggleFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScale = (w: number, h: number) => {
      const s = Math.min(w / BASE_WIDTH, h / BASE_HEIGHT);
      setScale(s > 0 ? s : 1);
    };

    const initialW = el.clientWidth;
    const initialH = el.clientHeight;
    updateScale(initialW, initialH);

    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      const w = rect?.width ?? el.clientWidth;
      const h = rect?.height ?? el.clientHeight;
      updateScale(w, h);
    });
    ro.observe(el);

    const onWindowResize = () => updateScale(el.clientWidth, el.clientHeight);
    window.addEventListener('resize', onWindowResize);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onWindowResize);
    };
  }, []);

  if (!slides || slides.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-gray-500">No slides to display</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-gray-900 flex flex-col">
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <button
          onClick={toggleFullscreen}
          className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 text-gray-500"
          title="Toggle Fullscreen"
        >
          <Maximize2 size={20} />
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 text-gray-500"
            title="Close"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div ref={containerRef} className="flex-1 flex items-center justify-center overflow-hidden">
        <div
          style={{
            width: BASE_WIDTH * scale,
            height: BASE_HEIGHT * scale,
          }}
        >
          <div
            style={{
              width: BASE_WIDTH,
              height: BASE_HEIGHT,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            <SlideView slide={slides[currentIndex]} />
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
        <button
          onClick={handlePrev}
          className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 disabled:opacity-50 text-gray-500"
          disabled={slides.length <= 1}
        >
          <ChevronLeft size={24} />
        </button>

        <div className="px-4 py-2 bg-white rounded-full shadow-lg text-gray-500">
          <span className="font-medium">
            {currentIndex + 1} / {slides.length}
          </span>
        </div>

        <button
          onClick={handleNext}
          className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 disabled:opacity-50 text-gray-500"
          disabled={slides.length <= 1}
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
};
