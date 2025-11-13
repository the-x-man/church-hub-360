import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Code,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Plus,
  Minus,
} from 'lucide-react';

interface TailwindRichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  className?: string;
}

const TEXT_COLORS = [
  { label: 'Slate', text: 'text-slate-800', preview: 'bg-slate-800' },
  { label: 'Gray', text: 'text-gray-700', preview: 'bg-gray-700' },
  { label: 'Red', text: 'text-red-600', preview: 'bg-red-600' },
  { label: 'Orange', text: 'text-orange-600', preview: 'bg-orange-600' },
  { label: 'Amber', text: 'text-amber-600', preview: 'bg-amber-600' },
  { label: 'Yellow', text: 'text-yellow-600', preview: 'bg-yellow-600' },
  { label: 'Lime', text: 'text-lime-600', preview: 'bg-lime-600' },
  { label: 'Green', text: 'text-green-600', preview: 'bg-green-600' },
  { label: 'Teal', text: 'text-teal-600', preview: 'bg-teal-600' },
  { label: 'Cyan', text: 'text-cyan-600', preview: 'bg-cyan-600' },
  { label: 'Sky', text: 'text-sky-600', preview: 'bg-sky-600' },
  { label: 'Blue', text: 'text-blue-600', preview: 'bg-blue-600' },
  { label: 'Indigo', text: 'text-indigo-600', preview: 'bg-indigo-600' },
  { label: 'Violet', text: 'text-violet-600', preview: 'bg-violet-600' },
  { label: 'Purple', text: 'text-purple-600', preview: 'bg-purple-600' },
  { label: 'Fuchsia', text: 'text-fuchsia-600', preview: 'bg-fuchsia-600' },
  { label: 'Pink', text: 'text-pink-600', preview: 'bg-pink-600' },
  { label: 'Rose', text: 'text-rose-600', preview: 'bg-rose-600' },
];

const BG_COLORS = [
  'bg-yellow-200',
  'bg-red-200',
  'bg-green-200',
  'bg-blue-200',
  'bg-indigo-200',
  'bg-violet-200',
  'bg-rose-200',
  'bg-orange-200',
  'bg-amber-200',
  'bg-lime-200',
  'bg-teal-200',
  'bg-cyan-200',
  'bg-pink-200',
];

const FONT_SIZES = [
  { label: '10px', px: 10, cls: 'text-[10px]' },
  { label: '12px', px: 12, cls: 'text-[12px]' },
  { label: '14px', px: 14, cls: 'text-[14px]' },
  { label: '16px', px: 16, cls: 'text-[16px]' },
  { label: '18px', px: 18, cls: 'text-[18px]' },
  { label: '20px', px: 20, cls: 'text-[20px]' },
  { label: '24px', px: 24, cls: 'text-[24px]' },
  { label: '28px', px: 28, cls: 'text-[28px]' },
  { label: '32px', px: 32, cls: 'text-[32px]' },
  { label: '36px', px: 36, cls: 'text-[36px]' },
  { label: '48px', px: 48, cls: 'text-[48px]' },
  { label: '64px', px: 64, cls: 'text-[64px]' },
];

export default function TailwindRichTextEditor({
  value,
  onChange,
  className,
}: TailwindRichTextEditorProps) {
  const editorRef = React.useRef<HTMLDivElement | null>(null);
  const lastRangeRef = React.useRef<Range | null>(null);
  const [linkUrl, setLinkUrl] = React.useState('');
  const [imageUrl, setImageUrl] = React.useState('');
  const [fontSize, setFontSize] = React.useState<number>(16);

  const setHtml = React.useCallback((html: string) => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== html) {
      editorRef.current.innerHTML = html;
    }
  }, []);

  React.useEffect(() => {
    setHtml(value || '');
  }, [value, setHtml]);

  const getCleanHtml = React.useCallback(() => {
    if (!editorRef.current) return '';
    const clone = editorRef.current.cloneNode(true) as HTMLDivElement;
    const handles = clone.querySelectorAll('.rte-resize-handle');
    handles.forEach((h) => h.parentElement?.removeChild(h));
    return clone.innerHTML;
  }, []);

  const sync = React.useCallback(() => {
    const html = getCleanHtml();
    onChange(html);
  }, [getCleanHtml, onChange]);

  const getNearestElementFromNode = (n: Node | null): HTMLElement | null => {
    let cur: Node | null = n;
    while (cur && !(cur instanceof HTMLElement))
      cur = cur.parentNode as Node | null;
    return cur instanceof HTMLElement ? cur : null;
  };

  const hasAnyClass = (el: HTMLElement | null, group: string[]) => {
    if (!el) return false;
    return group.some((c) => el.classList.contains(c));
  };

  const getAncestorWithClassInGroup = (n: Node | null, group: string[]) => {
    let cur = getNearestElementFromNode(n);
    while (cur && cur !== editorRef.current) {
      if (hasAnyClass(cur, group)) return cur;
      cur = cur.parentElement as HTMLElement | null;
    }
    return null;
  };

  const getAppliedFontSizePxAt = (n: Node | null): number => {
    let cur = getNearestElementFromNode(n);
    while (cur && cur !== editorRef.current) {
      for (const f of FONT_SIZES) {
        if (cur.classList.contains(f.cls)) return f.px;
      }
      cur = cur.parentElement as HTMLElement | null;
    }
    const target = getNearestElementFromNode(n) || editorRef.current;
    if (!target) return 16;
    const fs = window.getComputedStyle(target).fontSize;
    const px = parseInt(fs || '16', 10);
    const nearest = FONT_SIZES.reduce(
      (best, f) => (Math.abs(f.px - px) < Math.abs(best.px - px) ? f : best),
      FONT_SIZES[0]
    );
    return nearest.px;
  };

  const getRange = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    if (!editorRef.current) return null;
    const c = range.commonAncestorContainer as Node;
    if (!editorRef.current.contains(c)) return null;
    return range;
  };

  const getActiveRange = () => {
    const r = getRange();
    if (r) {
      try {
        lastRangeRef.current = r.cloneRange();
      } catch {
        lastRangeRef.current = r;
      }
      return r;
    }
    return lastRangeRef.current;
  };

  const wrapSelection = (tag: string, classes: string[]) => {
    const range = getRange();
    if (!range || range.collapsed) return;
    const el = document.createElement(tag);
    el.className = classes.join(' ');
    try {
      range.surroundContents(el);
    } catch {
      const frag = range.extractContents();
      el.appendChild(frag);
      range.insertNode(el);
    }
    sync();
  };

  const applyTextAlign = (
    cls: 'text-left' | 'text-center' | 'text-right' | 'text-justify'
  ) => {
    const range = getRange();
    if (!range) return;
    let node = range.startContainer as HTMLElement | null;
    while (
      node &&
      editorRef.current &&
      node !== editorRef.current &&
      node.parentElement
    ) {
      if (
        node instanceof HTMLElement &&
        /^(P|DIV|H1|H2|H3|H4|BLOCKQUOTE|PRE)$/.test(node.tagName)
      )
        break;
      node = node.parentElement as HTMLElement;
    }
    const target =
      node && node instanceof HTMLElement ? node : editorRef.current;
    const aligns = ['text-left', 'text-center', 'text-right', 'text-justify'];
    target?.classList.remove(...aligns);
    target?.classList.add(cls);
    sync();
  };

  const applyFontSize = (px: number) => {
    const entry =
      FONT_SIZES.find((f) => f.px === px) ||
      FONT_SIZES.find((f) => f.px === 16)!;
    setFontSize(entry.px);
    const range = getActiveRange();
    if (!range) return;
    const cls = entry.cls;
    const allSizeClasses = FONT_SIZES.map((f) => f.cls);
    if (range.collapsed) {
      let el = range.startContainer as Node;
      let target: HTMLElement | null = null;
      while (el && el !== editorRef.current) {
        if (el instanceof HTMLElement && el.classList) {
          target = el as HTMLElement;
          break;
        }
        el = (el as HTMLElement).parentElement as HTMLElement;
      }
      if (target) {
        target.classList.remove(...allSizeClasses);
        target.classList.add(cls);
      } else {
        const span = document.createElement('span');
        span.className = cls;
        span.appendChild(document.createTextNode('\u200b'));
        range.insertNode(span);
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          const r = document.createRange();
          r.setStart(span.firstChild!, 1);
          r.collapse(true);
          sel.addRange(r);
        }
      }
    } else {
      const frag = range.extractContents();
      frag.querySelectorAll('*').forEach((n) => {
        if (n instanceof HTMLElement) n.classList.remove(...allSizeClasses);
      });
      const wrapper = document.createElement('span');
      wrapper.className = cls;
      wrapper.appendChild(frag);
      range.insertNode(wrapper);
    }
    sync();
  };

  const isInlineActive = (classes: string[]) => {
    const range = getRange();
    if (!range) return false;
    if (range.collapsed) {
      let elem = getNearestElementFromNode(range.startContainer);
      while (elem && elem !== editorRef.current) {
        if (classes.some((c) => elem?.classList.contains(c))) return true;
        elem = elem.parentElement as HTMLElement | null;
      }
      return false;
    }
    const frag = range.cloneContents();
    const nodes = frag.querySelectorAll('*');
    for (const n of Array.from(nodes)) {
      const e = n as HTMLElement;
      if (e.classList && classes.some((c) => e.classList.contains(c)))
        return true;
    }
    return false;
  };

  const toggleInline = (classes: string[]) => {
    const range = getRange();
    if (!range) return;
    if (range.collapsed) {
      let target = getNearestElementFromNode(range.startContainer);
      if (target && classes.some((c) => target!.classList.contains(c))) {
        classes.forEach((c) => target!.classList.remove(c));
        if (target.tagName === 'SPAN' && target.className.trim() === '') {
          const parent = target.parentElement;
          if (parent) {
            while (target.firstChild)
              parent.insertBefore(target.firstChild, target);
            parent.removeChild(target);
          }
        }
      } else {
        const span = document.createElement('span');
        span.className = classes.join(' ');
        span.appendChild(document.createTextNode('\u200b'));
        range.insertNode(span);
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          const r = document.createRange();
          r.setStart(span.firstChild!, 1);
          r.collapse(true);
          sel.addRange(r);
        }
      }
      sync();
      return;
    }
    const has = isInlineActive(classes);
    if (has) {
      const frag = range.extractContents();
      frag.querySelectorAll('*').forEach((n) => {
        const e = n as HTMLElement;
        classes.forEach((c) => e.classList?.remove(c));
      });
      range.insertNode(frag);
    } else {
      const frag = range.extractContents();
      const span = document.createElement('span');
      span.className = classes.join(' ');
      span.appendChild(frag);
      range.insertNode(span);
    }
    sync();
  };

  const clearInlineGroup = (group: string[]) => {
    const range = getRange();
    if (!range) return;
    if (range.collapsed) {
      let target = getNearestElementFromNode(range.startContainer);
      if (target) {
        target.classList.remove(...group);
        if (target.tagName === 'SPAN' && target.className.trim() === '') {
          const parent = target.parentElement;
          if (parent) {
            while (target.firstChild)
              parent.insertBefore(target.firstChild, target);
            parent.removeChild(target);
          }
        }
      }
    } else {
      const startAnc = getAncestorWithClassInGroup(range.startContainer, group);
      const endAnc = getAncestorWithClassInGroup(range.endContainer, group);
      if (startAnc && endAnc && startAnc === endAnc) {
        const anc = startAnc;
        const parent = anc.parentNode as Node | null;
        if (!parent) return;
        const ref = anc.nextSibling;
        const before = document.createRange();
        before.selectNodeContents(anc);
        before.setEnd(range.startContainer, range.startOffset);
        const after = document.createRange();
        after.selectNodeContents(anc);
        after.setStart(range.endContainer, range.endOffset);
        const left = before.extractContents();
        const mid = range.extractContents();
        const right = after.extractContents();
        parent.removeChild(anc);
        if (left.childNodes.length > 0) {
          const leftWrap = anc.cloneNode(false) as HTMLElement;
          leftWrap.appendChild(left);
          parent.insertBefore(leftWrap, ref);
        }
        parent.insertBefore(mid, ref);
        if (right.childNodes.length > 0) {
          const rightWrap = anc.cloneNode(false) as HTMLElement;
          rightWrap.appendChild(right);
          parent.insertBefore(rightWrap, ref);
        }
      } else {
        const frag = range.extractContents();
        frag.querySelectorAll('*').forEach((n) => {
          const e = n as HTMLElement;
          e.classList?.remove(...group);
        });
        range.insertNode(frag);
      }
    }
    sync();
  };

  const applyInlineExclusive = (cls: string, group: string[]) => {
    const range = getRange();
    if (!range) return;
    if (range.collapsed) {
      let target = getNearestElementFromNode(range.startContainer);
      if (target && target.classList.contains(cls)) {
        clearInlineGroup(group);
        return;
      }
      if (target) {
        target.classList.remove(...group);
        target.classList.add(cls);
      } else {
        const span = document.createElement('span');
        span.className = cls;
        span.appendChild(document.createTextNode('\u200b'));
        range.insertNode(span);
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          const r = document.createRange();
          r.setStart(span.firstChild!, 1);
          r.collapse(true);
          sel.addRange(r);
        }
      }
    } else {
      const has = isInlineActive([cls]);
      if (has) {
        clearInlineGroup(group);
      } else {
        const frag = range.extractContents();
        frag.querySelectorAll('*').forEach((n) => {
          if (n instanceof HTMLElement) n.classList.remove(...group);
        });
        const span = document.createElement('span');
        span.className = cls;
        span.appendChild(frag);
        range.insertNode(span);
      }
    }
    sync();
  };

  const applyCodeInline = () =>
    toggleInline(['font-mono', 'bg-muted', 'rounded', 'px-1']);

  const insertCodeBlock = () => {
    const range = getRange();
    if (!range) return;
    const pre = document.createElement('pre');
    pre.className = 'font-mono bg-muted rounded p-3 overflow-auto';
    const code = document.createElement('code');
    code.textContent = '';
    pre.appendChild(code);
    range.insertNode(pre);
    sync();
  };

  const applyLink = () => {
    const url = linkUrl.trim();
    if (!url) return;
    const range = getRange();
    if (!range || range.collapsed) return;
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = 'underline text-blue-600 dark:text-blue-400';
    try {
      range.surroundContents(a);
    } catch {
      const frag = range.extractContents();
      a.appendChild(frag);
      range.insertNode(a);
    }
    sync();
  };

  const insertImage = () => {
    const url = imageUrl.trim();
    if (!url) return;
    const range = getRange();
    if (!range) return;
    const wrap = document.createElement('div');
    wrap.className = 'relative inline-block';
    const img = document.createElement('img');
    img.src = url;
    img.className = 'max-w-full h-auto rounded';
    const handle = document.createElement('span');
    handle.className =
      'rte-resize-handle absolute right-0 bottom-0 h-3 w-3 bg-muted rounded-sm border cursor-se-resize';
    wrap.appendChild(img);
    wrap.appendChild(handle);
    range.insertNode(wrap);
    sync();
  };

  React.useEffect(() => {
    const root = editorRef.current;
    if (!root) return;
    let resizing = false;
    let targetImg: HTMLImageElement | null = null;
    let startX = 0;
    let startWidth = 0;
    const onMouseDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.classList.contains('rte-resize-handle')) return;
      const parent = t.parentElement;
      const img = parent?.querySelector('img') as HTMLImageElement | null;
      if (!img) return;
      resizing = true;
      targetImg = img;
      startX = e.clientX;
      startWidth = img.getBoundingClientRect().width;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      e.preventDefault();
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!resizing || !targetImg) return;
      const dx = e.clientX - startX;
      const w = Math.max(50, startWidth + dx);
      targetImg.style.width = `${Math.round(w)}px`;
    };
    const onMouseUp = () => {
      if (!resizing) return;
      resizing = false;
      targetImg = null;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      sync();
    };
    root.addEventListener('mousedown', onMouseDown);
    return () => {
      root.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [sync]);

  const onInput = () => {
    sync();
    const range = getRange();
    if (range) {
      try {
        lastRangeRef.current = range.cloneRange();
      } catch {
        lastRangeRef.current = range;
      }
      setFontSize(getAppliedFontSizePxAt(range.startContainer));
    }
  };

  React.useEffect(() => {
    const handler = () => {
      const range = getRange();
      if (!range) return;
      try {
        lastRangeRef.current = range.cloneRange();
      } catch {
        lastRangeRef.current = range;
      }
      setFontSize(getAppliedFontSizePxAt(range.startContainer));
    };
    document.addEventListener('selectionchange', handler);
    return () => document.removeEventListener('selectionchange', handler);
  }, []);

  return (
    <div className={cn('border rounded-md flex flex-col h-full', className)}>
      <div className="flex items-center gap-1 p-2 border-b bg-muted/30 shrink-0 overflow-x-auto flex-nowrap min-w-0">
        <div className="flex items-center gap-1">
          <Select
            value={String(fontSize)}
            onValueChange={(v) => applyFontSize(Number(v))}
          >
            <SelectTrigger
              className="h-8 w-[80px]"
              onMouseDown={(e) => e.preventDefault()}
            >
              <SelectValue placeholder="Font" />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZES.map((f) => (
                <SelectItem key={f.cls} value={String(f.px)}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() =>
              applyFontSize(
                FONT_SIZES[
                  Math.max(
                    0,
                    FONT_SIZES.findIndex((x) => x.px === fontSize) - 1
                  )
                ]?.px ?? FONT_SIZES[0].px
              )
            }
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() =>
              applyFontSize(
                FONT_SIZES[
                  Math.min(
                    FONT_SIZES.length - 1,
                    FONT_SIZES.findIndex((x) => x.px === fontSize) + 1
                  )
                ]?.px ?? FONT_SIZES[FONT_SIZES.length - 1].px
              )
            }
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="mx-2 h-6 shrink-0" />

        <Button
          variant="ghost"
          size="icon"
          className={isInlineActive(['font-bold']) ? 'bg-muted' : ''}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => toggleInline(['font-bold'])}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={isInlineActive(['italic']) ? 'bg-muted' : ''}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => toggleInline(['italic'])}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={isInlineActive(['underline']) ? 'bg-muted' : ''}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => toggleInline(['underline'])}
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={isInlineActive(['line-through']) ? 'bg-muted' : ''}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => toggleInline(['line-through'])}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="mx-2 h-6 shrink-0" />

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onMouseDown={(e) => e.preventDefault()}
            >
              <Highlighter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="grid grid-cols-7 gap-2">
              <button
                type="button"
                className="h-6 w-6 rounded border flex items-center justify-center text-xs cursor-pointer"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => clearInlineGroup(BG_COLORS)}
              >
                X
              </button>
              {BG_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={cn('h-6 w-6 rounded border cursor-pointer', c)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyInlineExclusive(c, BG_COLORS)}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onMouseDown={(e) => e.preventDefault()}
            >
              <span className="inline-flex items-center justify-center h-4 w-4 rounded border">
                <span className="font-bold text-foreground">A</span>
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="grid grid-cols-7 gap-2">
              <button
                type="button"
                className="h-6 w-6 rounded border flex items-center justify-center text-xs cursor-pointer"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => clearInlineGroup(TEXT_COLORS.map((x) => x.text))}
              >
                X
              </button>
              {TEXT_COLORS.map((c) => (
                <button
                  key={c.text}
                  type="button"
                  className="h-6 w-6 rounded border flex items-center justify-center cursor-pointer"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() =>
                    applyInlineExclusive(
                      c.text,
                      TEXT_COLORS.map((x) => x.text)
                    )
                  }
                >
                  <span className={cn('font-bold', c.text)}>A</span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="mx-2 h-6 shrink-0" />

        <Button
          variant="ghost"
          size="icon"
          onMouseDown={(e) => e.preventDefault()}
          className=""
          onClick={() => applyTextAlign('text-left')}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onMouseDown={(e) => e.preventDefault()}
          className=""
          onClick={() => applyTextAlign('text-center')}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onMouseDown={(e) => e.preventDefault()}
          className=""
          onClick={() => applyTextAlign('text-right')}
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onMouseDown={(e) => e.preventDefault()}
          className=""
          onClick={() => applyTextAlign('text-justify')}
        >
          <AlignJustify className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="mx-2 h-6 shrink-0" />

        <Button
          variant="ghost"
          size="icon"
          onMouseDown={(e) => e.preventDefault()}
          onClick={applyCodeInline}
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onMouseDown={(e) => e.preventDefault()}
          onClick={insertCodeBlock}
        >
          <Code className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="mx-2 h-6 shrink-0" />

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onMouseDown={(e) => e.preventDefault()}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <div className="space-y-2">
              <Input
                placeholder="https://"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
              <div className="flex justify-end">
                <Button size="sm" onClick={applyLink}>
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onMouseDown={(e) => e.preventDefault()}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <div className="space-y-2">
              <Input
                placeholder="Image URL"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <div className="flex justify-end">
                <Button size="sm" onClick={insertImage}>
                  Insert
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="mx-2 h-6" />

        <Button
          variant="ghost"
          size="icon"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() =>
            wrapSelection('blockquote', [
              'border-l-4',
              'pl-4',
              'italic',
              'text-muted-foreground',
            ])
          }
        >
          <Quote className="h-4 w-4" />
        </Button>
      </div>

      <div
        ref={editorRef}
        className="flex-1 overflow-auto max-w-none min-h-[200px] p-3 focus:outline-none leading-normal [&>p]:my-1 [&>div]:my-1 [&>h1]:my-2 [&>h2]:my-2 [&>h3]:my-2 [&>blockquote]:my-2"
        contentEditable
        suppressContentEditableWarning
        onInput={onInput}
      />
    </div>
  );
}
