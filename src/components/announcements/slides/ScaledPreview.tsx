import React from 'react';

export default function ScaledPreview({ html }: { html: string }) {
  const frameRef = React.useRef<HTMLDivElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = React.useState(0.25);

  React.useEffect(() => {
    const ro = new ResizeObserver(() => {
      const frame = frameRef.current;
      if (!frame) return;
      const baseW = 1280;
      const baseH = 720;
      const w = frame.clientWidth;
      const h = frame.clientHeight;
      const next = Math.min(w / baseW, h / baseH);
      setScale(next);
    });
    if (frameRef.current) ro.observe(frameRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={frameRef} className="relative w-full h-full overflow-hidden">
      <div
        ref={contentRef}
        className="prose prose-sm dark:prose-invert max-w-none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 1280,
          height: 720,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          overflow: 'hidden',
        }}
        dangerouslySetInnerHTML={{ __html: html || '' }}
      />
    </div>
  );
}