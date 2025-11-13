import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Type, Square, Circle, Triangle, Image as ImageIcon, Download, Plus, Trash2 } from 'lucide-react';
import { useFabricCanvas } from './useFabricCanvas';
import type { SlideDesignerProps, SlideDeckJSON, SlideJSON } from './types';

function Thumb({ dataUrl, active, onClick }: { dataUrl: string; active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full aspect-video rounded-md border overflow-hidden ${active ? 'ring-2 ring-primary' : ''}`}>
      <img src={dataUrl} alt="slide" className="w-full h-full object-cover" />
    </button>
  );
}

export default function SlideDesigner({ value, onChange, className, baseWidth = 1600, baseHeight = 900 }: SlideDesignerProps) {
  const deck: SlideDeckJSON = useMemo(() => {
    if (value?.slides?.length) return value as SlideDeckJSON;
    return { version: '1', slides: [{ width: baseWidth, height: baseHeight, background: '#ffffff', data: {} }] };
  }, [value, baseWidth, baseHeight]);

  const [slides, setSlides] = useState<SlideJSON[]>(deck.slides);
  const [activeIndex, setActiveIndex] = useState(0);
  const [fontFamily, setFontFamily] = useState('Inter, system-ui, Arial');
  const [fontSize, setFontSize] = useState<number>(48);
  const [fontColor, setFontColor] = useState<string>('#111827');
  const [bgColor, setBgColor] = useState<string>('#ffffff');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const { canvasRef, canvas, setAutoZoom, addText, addRect, addCircle, addTriangle, addImageFromFile, updateActiveText, setBackground, toJSON, loadJSON, toDataURL } = useFabricCanvas(baseWidth, baseHeight);

  useEffect(() => {
    const handler = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const max = 1200;
      const cw = Math.min(w, max);
      setAutoZoom(cw);
    };
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [setAutoZoom]);

  useEffect(() => {
    if (!canvas) return;
    const current = slides[activeIndex]?.data;
    if (current && Object.keys(current).length > 0) {
      loadJSON(current);
    } else {
      canvas.clear();
      canvas.setWidth(baseWidth);
      canvas.setHeight(baseHeight);
      canvas.backgroundColor = bgColor;
      canvas.requestRenderAll();
    }
  }, [canvas, slides, activeIndex, baseWidth, baseHeight, bgColor, loadJSON]);

  const saveActive = () => {
    const json = toJSON();
    const next = slides.map((s, i) => (i === activeIndex ? { ...s, background: bgColor, data: json } : s));
    setSlides(next);
    const out: SlideDeckJSON = { version: '1', slides: next };
    onChange?.(out);
  };

  const addNewSlide = () => {
    const next = [...slides, { width: baseWidth, height: baseHeight, background: '#ffffff', data: {} }];
    setSlides(next);
    setActiveIndex(next.length - 1);
  };

  const deleteActive = () => {
    if (slides.length === 0) return;
    const next = slides.filter((_, i) => i !== activeIndex);
    setSlides(next.length ? next : [{ width: baseWidth, height: baseHeight, background: '#ffffff', data: {} }]);
    setActiveIndex(Math.max(0, activeIndex - 1));
  };

  const exportCurrent = (format: 'png' | 'jpeg') => {
    const url = toDataURL(format, 2);
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `slide-${activeIndex + 1}.${format}`;
    a.click();
  };

  const exportDeckJSON = () => {
    const out: SlideDeckJSON = { version: '1', slides };
    const blob = new Blob([JSON.stringify(out)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'slides.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const thumbs = useMemo(() => {
    if (!canvas) return slides.map(() => '');
    return slides.map((_, i) => {
      if (i === activeIndex) return toDataURL('png', 0.5);
      return '';
    });
  }, [slides, activeIndex, canvas, toDataURL]);

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Slides</div>
            <div className="flex gap-2">
              <Button size="sm" onClick={addNewSlide}><Plus className="h-4 w-4" /></Button>
              <Button size="sm" variant="destructive" onClick={deleteActive}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
            {slides.map((_, i) => (
              <Thumb key={i} dataUrl={i === activeIndex ? thumbs[i] : ''} active={i === activeIndex} onClick={() => setActiveIndex(i)} />
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="p-3 border-b flex items-center gap-2">
              <Button variant="outline" onClick={() => addText('Text')}><Type className="h-4 w-4 mr-2" />Add Text</Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline"><ImageIcon className="h-4 w-4 mr-2" />Add Image</Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-64">
                  <div className="space-y-3">
                    <Label>Upload Image</Label>
                    <Input type="file" accept="image/*" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) addImageFromFile(f);
                    }} />
                  </div>
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline"><Square className="h-4 w-4 mr-2" />Shapes</Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-56">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={addRect}><Square className="h-4 w-4" /></Button>
                    <Button variant="ghost" onClick={addCircle}><Circle className="h-4 w-4" /></Button>
                    <Button variant="ghost" onClick={addTriangle}><Triangle className="h-4 w-4" /></Button>
                  </div>
                </PopoverContent>
              </Popover>
              <div className="ml-auto flex gap-2">
                <Button variant="outline" onClick={saveActive}>Save</Button>
                <Button onClick={() => exportCurrent('png')}><Download className="h-4 w-4 mr-2" />PNG</Button>
                <Button onClick={() => exportCurrent('jpeg')}><Download className="h-4 w-4 mr-2" />JPEG</Button>
                <Button variant="secondary" onClick={exportDeckJSON}>JSON</Button>
              </div>
            </div>

            <div className="p-3 border-b grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Font Family</Label>
                <Select value={fontFamily} onValueChange={(v) => { setFontFamily(v); updateActiveText({ fontFamily: v }); }}>
                  <SelectTrigger><SelectValue placeholder="Font" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter, system-ui, Arial">Inter</SelectItem>
                    <SelectItem value="Arial, Helvetica, sans-serif">Arial</SelectItem>
                    <SelectItem value="Georgia, serif">Georgia</SelectItem>
                    <SelectItem value="Times New Roman, Times, serif">Times New Roman</SelectItem>
                    <SelectItem value="Verdana, Geneva, sans-serif">Verdana</SelectItem>
                    <SelectItem value="Montserrat, system-ui, Arial">Montserrat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Font Size</Label>
                <Input type="number" value={fontSize} onChange={(e) => {
                  const v = parseInt(e.target.value || '0', 10);
                  setFontSize(v);
                  updateActiveText({ fontSize: v });
                }} />
              </div>
              <div className="space-y-2">
                <Label>Font Color</Label>
                <Input type="color" value={fontColor} onChange={(e) => {
                  const v = e.target.value;
                  setFontColor(v);
                  updateActiveText({ fill: v });
                }} />
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label>Background</Label>
                <Input type="color" value={bgColor} onChange={(e) => {
                  const v = e.target.value;
                  setBgColor(v);
                  setBackground(v);
                }} />
              </div>
            </div>

            <div ref={containerRef} className="p-3">
              <div className="w-full flex items-center justify-center">
                <div className="border rounded-md bg-card overflow-hidden" style={{ width: '100%', maxWidth: '1200px' }}>
                  <div className="aspect-video w-full flex items-center justify-center">
                    <canvas ref={canvasRef} />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}