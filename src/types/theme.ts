export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground?: string;
  border: string;
  input: string;
  ring: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
}

export interface ThemeFonts {
  sans: string;
  serif: string;
  mono: string;
}

export interface ThemeShadows {
  xs2: string;
  xs: string;
  sm: string;
  default: string;
  md: string;
  lg: string;
  xl: string;
  xl2: string;
}

export interface ThemeConfig {
  radius: string;
  trackingNormal?: string;
  spacing?: string;
}

export interface CompleteTheme {
  id: string;
  name: string;
  description: string;
  light: ThemeColors;
  dark: ThemeColors;
  fonts: ThemeFonts;
  shadows: ThemeShadows;
  config: ThemeConfig;
}

export interface ThemeMetadata {
  id: string;
  name: string;
  description: string;
  author?: string;
  version?: string;
  tags?: string[];
}