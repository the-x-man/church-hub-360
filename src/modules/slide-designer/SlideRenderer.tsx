import { useEffect, useRef } from 'react';
import type { SlideRendererProps } from './types';
import * as fabric from 'fabric';

export default function SlideRenderer({ deck, index = 0, className, onReady }: SlideRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    const slide = deck.slides[index];
    const c = new fabric.Canvas(canvasRef.current, { selection: false });
    c.setWidth(slide.width);
    c.setHeight(slide.height);
    c.backgroundColor = slide.background ?? '';
    c.loadFromJSON(slide.data || {}, () => {
      c.renderAll();
      onReady?.();
    });
    return () => {
      c.dispose();
    };
  }, [deck, index, onReady]);
  return (
    <div className={className}>
      <canvas ref={canvasRef} />
    </div>
  );
}