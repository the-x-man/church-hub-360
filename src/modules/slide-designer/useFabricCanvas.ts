import { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';

export function useFabricCanvas(baseWidth: number, baseHeight: number) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!canvasRef.current) return;
    const c = new fabric.Canvas(canvasRef.current, {
      preserveObjectStacking: true,
      selection: true,
      backgroundColor: '#ffffff',
    });
    c.setWidth(baseWidth);
    c.setHeight(baseHeight);
    c.requestRenderAll();
    setCanvas(c);
    return () => {
      c.dispose();
      setCanvas(null);
    };
  }, [baseWidth, baseHeight]);

  const setAutoZoom = (containerWidth: number) => {
    if (!canvas) return;
    const scale = containerWidth / baseWidth;
    const nextZoom = Math.max(0.1, Math.min(scale, 4));
    canvas.setZoom(nextZoom);
    setZoom(nextZoom);
    canvas.setWidth(baseWidth * nextZoom);
    canvas.setHeight(baseHeight * nextZoom);
    canvas.calcOffset();
    canvas.requestRenderAll();
  };

  const toJSON = () => {
    if (!canvas) return null;
    return canvas.toJSON();
  };

  const loadJSON = async (json: any) => {
    if (!canvas) return;
    await new Promise<void>((resolve) => {
      canvas.loadFromJSON(json, () => {
        canvas.renderAll();
        resolve();
      });
    });
  };

  const addText = (text: string) => {
    if (!canvas) return;
    const t = new fabric.IText(text || 'Text', {
      left: 100,
      top: 100,
      fontSize: 48,
      fill: '#111827',
      fontFamily: 'Inter, system-ui, Arial',
    });
    canvas.add(t);
    canvas.setActiveObject(t);
    canvas.requestRenderAll();
  };

  const addRect = () => {
    if (!canvas) return;
    const r = new fabric.Rect({
      left: 120,
      top: 120,
      width: 240,
      height: 140,
      fill: '#e5e7eb',
      stroke: '#111827',
      strokeWidth: 1,
    });
    canvas.add(r);
    canvas.setActiveObject(r);
    canvas.requestRenderAll();
  };

  const addCircle = () => {
    if (!canvas) return;
    const c = new fabric.Circle({
      left: 140,
      top: 140,
      radius: 80,
      fill: '#e5e7eb',
      stroke: '#111827',
      strokeWidth: 1,
    });
    canvas.add(c);
    canvas.setActiveObject(c);
    canvas.requestRenderAll();
  };

  const addTriangle = () => {
    if (!canvas) return;
    const t = new fabric.Triangle({
      left: 160,
      top: 160,
      width: 180,
      height: 160,
      fill: '#e5e7eb',
      stroke: '#111827',
      strokeWidth: 1,
    });
    canvas.add(t);
    canvas.setActiveObject(t);
    canvas.requestRenderAll();
  };

  const addImageFromFile = (file: File) => {
    if (!canvas) return;
    const url = URL.createObjectURL(file);
    fabric.Image.fromURL(url, { crossOrigin: 'anonymous' }).then((img) => {
      img.set({ left: 120, top: 120, scaleX: 0.5, scaleY: 0.5 });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.requestRenderAll();
    });
  };

  const updateActiveText = (patch: { fontSize?: number; fill?: string; fontFamily?: string }) => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active || active.type !== 'i-text') return;
    const it = active as fabric.IText;
    if (patch.fontSize) it.set('fontSize', patch.fontSize);
    if (patch.fill) it.set('fill', patch.fill);
    if (patch.fontFamily) it.set('fontFamily', patch.fontFamily);
    canvas.requestRenderAll();
  };

  const setBackground = (color: string | null) => {
    if (!canvas) return;
    canvas.backgroundColor = color ?? '';
    canvas.requestRenderAll();
  };

  const toDataURL = (format: 'png' | 'jpeg', multiplier = 1) => {
    if (!canvas) return '';
    return canvas.toDataURL({ format, multiplier });
  };

  return {
    canvasRef,
    canvas,
    zoom,
    setAutoZoom,
    toJSON,
    loadJSON,
    addText,
    addRect,
    addCircle,
    addTriangle,
    addImageFromFile,
    updateActiveText,
    setBackground,
    toDataURL,
  };
}