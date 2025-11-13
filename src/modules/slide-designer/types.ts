export type SlideJSON = {
  width: number;
  height: number;
  background?: string | null;
  data: any;
};

export type SlideDeckJSON = {
  version: string;
  slides: SlideJSON[];
};

export type SlideDesignerValue = SlideDeckJSON;

export type SlideDesignerProps = {
  value?: SlideDesignerValue | null;
  onChange?: (value: SlideDesignerValue) => void;
  className?: string;
  aspectRatio?: number;
  baseWidth?: number;
  baseHeight?: number;
};

export type SlideRendererProps = {
  deck: SlideDeckJSON;
  index?: number;
  className?: string;
  onReady?: () => void;
};