import type { SlideDraft } from '@/types';

export function normalizeSlides(slides: SlideDraft[]): SlideDraft[] {
  return slides.map((s, index) => ({
    ...s,
    id: s.id || crypto.randomUUID(),
    position: index + 1,
  }));
}

export function createDefaultSlide(position?: number): SlideDraft {
  return {
    id: crypto.randomUUID(),
    position: position ?? 1,
    title: 'New Slide',
    content_html: '',
  };
}

export function sanitizeForThumbnail(html: string): string {
  try {
    const root = document.createElement('div');
    root.innerHTML = html || '';
    const all = root.querySelectorAll('*');
    all.forEach((n) => {
      const el = n as HTMLElement;
      const classes = (el.className || '')
        .split(/\s+/)
        .filter(Boolean)
        .filter((c) => !/^text-(?:xs|sm|base|lg|xl|[2-9]xl|\[[^\]]+\])$/.test(c))
        .filter((c) => !/^leading-/.test(c));
      el.className = classes.join(' ');
    });
    root.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach((h) => {
      const p = document.createElement('p');
      p.innerHTML = (h as HTMLElement).innerHTML;
      h.parentElement?.replaceChild(p, h);
    });
    root.querySelectorAll('img').forEach((img) => {
      const e = img as HTMLImageElement;
      e.style.maxHeight = '48px';
      e.style.width = 'auto';
      e.style.objectFit = 'contain';
    });
    return root.innerHTML;
  } catch {
    return html;
  }
}