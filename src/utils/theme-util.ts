import type { CompleteTheme, ThemeColors, ThemeShadows } from '../types/theme';

/**
 * Converts camelCase property names to kebab-case CSS variable names
 * @param key - The camelCase property name
 * @returns The kebab-case CSS variable name
 */
function toKebabCase(key: string): string {
  return key.replace(/([A-Z])/g, '-$1').toLowerCase();
}

/**
 * Applies theme colors to CSS variables for a specific mode (light/dark)
 * @param colors - The theme colors object
 * @param isDark - Whether this is for dark mode
 */
function applyThemeColors(colors: ThemeColors, isDark: boolean = false): void {
  // Get or create style element for theme variables
  let styleElement = document.getElementById('dynamic-theme-vars') as HTMLStyleElement;
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = 'dynamic-theme-vars';
    document.head.appendChild(styleElement);
  }

  // Build CSS rules
  const selector = isDark ? '.dark' : ':root';
  const rules: string[] = [];

  // Apply color variables
  Object.entries(colors).forEach(([key, value]) => {
    const cssVarName = toKebabCase(key);
    rules.push(`  --${cssVarName}: ${value};`);
  });

  const cssRule = `${selector} {\n${rules.join('\n')}\n}`;
  
  // Update or append to existing stylesheet
  const existingContent = styleElement.textContent || '';
  const selectorRegex = new RegExp(`${selector.replace(/[.*+?^${}()|[\\\]]/g, '\\$&')} \\{[^}]*\\}`, 'g');
  
  let newContent = existingContent.replace(selectorRegex, '');
  newContent += '\n' + cssRule;
  
  styleElement.textContent = newContent;
}

/**
 * Applies font family variables to CSS
 * @param fonts - The theme fonts object
 */
function applyThemeFonts(fonts: { sans: string; serif: string; mono: string }): void {
  const root = document.documentElement;
  
  root.style.setProperty('--font-sans', fonts.sans);
  root.style.setProperty('--font-serif', fonts.serif);
  root.style.setProperty('--font-mono', fonts.mono);
}

/**
 * Applies theme configuration variables to CSS
 * @param config - The theme config object
 */
function applyThemeConfig(config: { radius: string; trackingNormal?: string; spacing?: string }): void {
  const root = document.documentElement;
  
  root.style.setProperty('--radius', config.radius);
  
  if (config.trackingNormal) {
    root.style.setProperty('--tracking-normal', config.trackingNormal);
  }
  
  if (config.spacing) {
    root.style.setProperty('--spacing', config.spacing);
  }
}

/**
 * Applies shadow variables to CSS
 * @param shadows - The theme shadows object
 */
function applyThemeShadows(shadows: ThemeShadows): void {
  const root = document.documentElement;
  
  Object.entries(shadows).forEach(([key, value]) => {
    const cssVarName = key === 'default' ? 'shadow' : `shadow-${key}`;
    root.style.setProperty(`--${cssVarName}`, value);
  });
}

/**
 * Main function to apply a complete theme to the DOM
 * @param theme - The complete theme object to apply
 * @param mode - The color mode to apply ('light', 'dark', or 'auto')
 */
export function applyTheme(theme: CompleteTheme, mode: 'light' | 'dark' | 'auto' = 'auto'): void {
  try {
    // Determine which color scheme to apply
    let applyLight = true;
    let applyDark = false;
    
    if (mode === 'light') {
      applyLight = true;
      applyDark = false;
    } else if (mode === 'dark') {
      applyLight = false;
      applyDark = true;
    } else {
      // Auto mode - apply both
      applyLight = true;
      applyDark = true;
    }

    // Apply light theme colors
    if (applyLight) {
      applyThemeColors(theme.light, false);
    }

    // Apply dark theme colors
    if (applyDark) {
      applyThemeColors(theme.dark, true);
    }

    // Apply fonts, shadows, and config (these are mode-independent)
    applyThemeFonts(theme.fonts);
    applyThemeShadows(theme.shadows);
    applyThemeConfig(theme.config);

    // Store current theme info for reference
    document.documentElement.setAttribute('data-theme-id', theme.id);
    document.documentElement.setAttribute('data-theme-name', theme.name);
    
    // Dispatch custom event for theme change
    const themeChangeEvent = new CustomEvent('themeChanged', {
      detail: {
        theme,
        mode,
        timestamp: Date.now()
      }
    });
    document.dispatchEvent(themeChangeEvent);
    
  } catch (error) {
    console.error('Failed to apply theme:', error);
    throw new Error(`Theme application failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Applies only the color scheme (light or dark) from a theme
 * @param theme - The complete theme object
 * @param isDark - Whether to apply dark mode colors
 */
export function applyColorScheme(theme: CompleteTheme, isDark: boolean): void {
  try {
    const colors = isDark ? theme.dark : theme.light;
    applyThemeColors(colors, isDark);
    
    // Update theme mode attribute
    document.documentElement.setAttribute('data-theme-mode', isDark ? 'dark' : 'light');
    
    // Dispatch color scheme change event
    const colorSchemeEvent = new CustomEvent('colorSchemeChanged', {
      detail: {
        theme,
        isDark,
        colors,
        timestamp: Date.now()
      }
    });
    document.dispatchEvent(colorSchemeEvent);
    
  } catch (error) {
    console.error('Failed to apply color scheme:', error);
    throw new Error(`Color scheme application failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Removes all dynamically applied theme variables
 */
export function clearTheme(): void {
  try {
    // Remove dynamic style element
    const styleElement = document.getElementById('dynamic-theme-vars');
    if (styleElement) {
      styleElement.remove();
    }

    // Clear theme-related CSS custom properties from root
    const root = document.documentElement;
    const propertiesToClear = [
      '--font-sans', '--font-serif', '--font-mono',
      '--radius', '--tracking-normal', '--spacing',
      '--shadow', '--shadow-xs2', '--shadow-xs', '--shadow-sm',
      '--shadow-md', '--shadow-lg', '--shadow-xl', '--shadow-xl2'
    ];

    propertiesToClear.forEach(prop => {
      root.style.removeProperty(prop);
    });

    // Remove theme attributes
    root.removeAttribute('data-theme-id');
    root.removeAttribute('data-theme-name');
    root.removeAttribute('data-theme-mode');
    
    // Dispatch clear event
    const clearEvent = new CustomEvent('themeCleared', {
      detail: { timestamp: Date.now() }
    });
    document.dispatchEvent(clearEvent);
    
  } catch (error) {
    console.error('Failed to clear theme:', error);
  }
}

/**
 * Gets the currently applied theme information from DOM attributes
 * @returns Object with current theme info or null if no theme is applied
 */
export function getCurrentThemeInfo(): { id: string; name: string; mode?: string } | null {
  const root = document.documentElement;
  const id = root.getAttribute('data-theme-id');
  const name = root.getAttribute('data-theme-name');
  const mode = root.getAttribute('data-theme-mode');
  
  if (!id || !name) {
    return null;
  }
  
  return { id, name, mode: mode || undefined };
}

/**
 * Utility to batch apply multiple theme properties efficiently
 * @param updates - Object containing theme property updates
 */
export function batchUpdateThemeProperties(updates: {
  colors?: Partial<ThemeColors>;
  fonts?: Partial<{ sans: string; serif: string; mono: string }>;
  config?: Partial<{ radius: string; trackingNormal?: string; spacing?: string }>;
  shadows?: Partial<Record<string, string>>;
  isDark?: boolean;
}): void {
  try {
    const root = document.documentElement;
    
    // Batch DOM updates for better performance
    if (updates.colors) {
      Object.entries(updates.colors).forEach(([key, value]) => {
        if (value && typeof value === 'string') {
          const cssVarName = toKebabCase(key);
          root.style.setProperty(`--${cssVarName}`, value);
        }
      });
    }
    
    if (updates.fonts) {
      Object.entries(updates.fonts).forEach(([key, value]) => {
        if (value && typeof value === 'string') {
          root.style.setProperty(`--font-${key}`, value);
        }
      });
    }
    
    if (updates.config) {
      Object.entries(updates.config).forEach(([key, value]) => {
        if (value && typeof value === 'string') {
          const cssVarName = toKebabCase(key);
          root.style.setProperty(`--${cssVarName}`, value);
        }
      });
    }
    
    if (updates.shadows) {
      Object.entries(updates.shadows).forEach(([key, value]) => {
        if (value && typeof value === 'string') {
          const cssVarName = key === 'default' ? 'shadow' : `shadow-${key}`;
          root.style.setProperty(`--${cssVarName}`, value);
        }
      });
    }
    
    // Update mode attribute if specified
    if (updates.isDark !== undefined) {
      root.setAttribute('data-theme-mode', updates.isDark ? 'dark' : 'light');
    }
    
  } catch (error) {
    console.error('Failed to batch update theme properties:', error);
  }
}