import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SlideDesigner, SlideRenderer } from '@/modules/slide-designer';
import type { SlideDeckJSON } from '@/modules/slide-designer';

export default function SlideDesignerDev() {
  const [deck, setDeck] = useState<SlideDeckJSON | null>(null);
  const json = useMemo(() => JSON.stringify(deck || { version: '1', slides: [] }, null, 2), [deck]);

  const handleLoadJSON = (file: File | undefined | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}')) as SlideDeckJSON;
        if (parsed && Array.isArray(parsed.slides)) setDeck(parsed);
      } catch {}
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Slide Designer Dev</h1>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={() => setDeck(null)}>Reset</Button>
          <Button
            variant="outline"
            onClick={() => {
              const blob = new Blob([json], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'slides.json';
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Download JSON
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
        <Card>
          <CardContent className="p-4">
            <SlideDesigner value={deck} onChange={setDeck} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-2">
                <Label>Load Deck JSON</Label>
                <Input type="file" accept="application/json" onChange={(e) => handleLoadJSON(e.target.files?.[0])} />
              </div>
              <div className="space-y-2">
                <Label>Deck JSON</Label>
                <Textarea value={json} readOnly className="h-[260px]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              {deck?.slides?.length ? (
                <div className="space-y-2">
                  <Label>First Slide Preview</Label>
                  <div className="border rounded-md overflow-hidden">
                    <SlideRenderer deck={deck} index={0} />
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">No slides yet</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}