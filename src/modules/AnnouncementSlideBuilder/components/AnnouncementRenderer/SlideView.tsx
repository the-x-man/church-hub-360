import React from 'react';
import type {
  Slide,
  Block,
  TextBlock,
  ImageBlock,
  SpacerBlock,
} from '../../utils/schema';

interface SlideViewProps {
  slide: Slide;
}

export const SlideView: React.FC<SlideViewProps> = ({ slide }) => {
  return (
    <div className="w-full h-full bg-white flex items-center justify-center p-12">
      <div className="w-full h-full flex flex-col gap-8">
        {slide.rows.map((row, rIdx) => (
          <div key={rIdx} className={`grid gap-8 ${row.layout === 'one-column' ? 'grid-cols-1' : row.layout === 'two-columns' ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {row.columns.map((column, cIdx) => (
              <div key={cIdx} className="flex-1">
                {column.items.map((block) => (
                  <BlockView key={block.id} block={block} />
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const BlockView: React.FC<{ block: Block }> = ({ block }) => {
  if (block.type === 'title' || block.type === 'paragraph') {
    return <TextBlockView block={block as TextBlock} />;
  }

  if (block.type === 'image') {
    return <ImageBlockView block={block as ImageBlock} />;
  }

  if (block.type === 'spacer') {
    return <SpacerBlockView block={block as SpacerBlock} />;
  }

  return null;
};

const TextBlockView: React.FC<{ block: TextBlock }> = ({ block }) => {
  const textStyle = {
    fontSize: `${block.styles.fontSize}px`,
    textAlign: block.styles.align,
    color: block.styles.color,
    marginTop: `${block.styles.marginTop}px`,
    marginBottom: `${block.styles.marginBottom}px`,
    backgroundColor: block.styles.backgroundColor || 'transparent',
    fontWeight: block.styles.bold ? 'bold' : 'normal',
    fontStyle: block.styles.italic ? 'italic' : 'normal',
    textDecoration: block.styles.underline ? 'underline' : 'none',
  };

  const parsed = new DOMParser().parseFromString(block.content, 'text/html');
  const text = parsed.body.textContent || '';

  return <div style={textStyle as any}>{text}</div>;
};

const ImageBlockView: React.FC<{ block: ImageBlock }> = ({ block }) => {
  return (
    <div className="my-4">
      <img
        src={block.src}
        alt="Content"
        style={{
          width: `${block.styles.width}px`,
          height: `${block.styles.height}px`,
          borderRadius: `${block.styles.borderRadius}px`,
          objectFit: 'cover',
        }}
      />
    </div>
  );
};

const SpacerBlockView: React.FC<{ block: SpacerBlock }> = ({ block }) => {
  return <div style={{ height: `${block.styles.height}px` }} />;
};
