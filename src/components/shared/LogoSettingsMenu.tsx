import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type {
  LogoBackgroundSize,
  LogoOrientation,
} from '@/types/organizations';
import {
  Maximize,
  Maximize2,
  RectangleHorizontal,
  RectangleVertical,
  Settings,
  Square,
  StretchHorizontal,
} from 'lucide-react';
import React from 'react';

interface LogoSettingsMenuProps {
  logoOrientation: LogoOrientation;
  logoBackgroundSize: LogoBackgroundSize;
  setOrientation: (value: LogoOrientation) => void;
  setBackgroundSize: (value: LogoBackgroundSize) => void;
}

const orientationOptions = [
  {
    value: 'square' as LogoOrientation,
    label: 'Square (1:1)',
    icon: Square,
  },
  {
    value: 'portrait' as LogoOrientation,
    label: 'Portrait (3:4)',
    icon: RectangleVertical,
  },
  {
    value: 'landscape' as LogoOrientation,
    label: 'Landscape (4:3)',
    icon: RectangleHorizontal,
  },
];

const backgroundSizeOptions = [
  {
    value: 'contain' as LogoBackgroundSize,
    label: 'Contain (Show All)',
    icon: Maximize,
  },
  {
    value: 'cover' as LogoBackgroundSize,
    label: 'Cover (Fill & Crop)',
    icon: Maximize2,
  },
  {
    value: 'fill' as LogoBackgroundSize,
    label: 'Stretch to Fill',
    icon: StretchHorizontal,
  },
];

export const LogoSettingsMenu: React.FC<LogoSettingsMenuProps> = ({
  logoOrientation,
  logoBackgroundSize,
  setOrientation,
  setBackgroundSize,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted">
        <Settings className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Logo Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
            Orientation
          </DropdownMenuLabel>
          {orientationOptions.map(({ value, label, icon: Icon }) => (
            <DropdownMenuItem
              key={value}
              onClick={() => setOrientation(value)}
              className={cn(
                'my-1',
                logoOrientation === value
                  ? 'bg-accent focus:bg-accent/90'
                  : 'focus:bg-muted'
              )}
            >
              <Icon className="h-4 w-4 mr-2" />
              <span>{label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
            Fit Style
          </DropdownMenuLabel>
          {backgroundSizeOptions.map(({ value, label, icon: Icon }) => (
            <DropdownMenuItem
              key={value}
              onClick={() => setBackgroundSize(value)}
              className={cn(
                'my-1',
                logoBackgroundSize === value
                  ? 'bg-accent focus:bg-accent/90'
                  : 'focus:bg-muted'
              )}
            >
              <Icon className="h-4 w-4 mr-2" />
              <span>{label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
