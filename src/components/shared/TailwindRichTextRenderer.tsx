import { cn } from '@/lib/utils';

interface TailwindRichTextRendererProps {
  html: string;
  className?: string;
}

export default function TailwindRichTextRenderer({ html, className }: TailwindRichTextRendererProps) {
  return (
    <div
      className={cn('prose prose-lg dark:prose-invert max-w-none', className)}
      dangerouslySetInnerHTML={{ __html: html || '' }}
    />
  );
}