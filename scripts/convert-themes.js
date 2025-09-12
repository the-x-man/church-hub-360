import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const THEMES_DIR = path.join(__dirname, '..', 'custom-themes');
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'themes');
const TYPES_PATH = path.join(__dirname, '..', 'src', 'types', 'theme.ts');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Helper function to convert CSS variable name to camelCase
function toCamelCase(str) {
  return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
}

// Helper function to extract theme name from filename
function getThemeName(filename) {
  const name = path.basename(filename, '.css');
  return name.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

// Helper function to generate theme ID
function getThemeId(filename) {
  return path.basename(filename, '.css');
}

// Parse CSS file and extract variables
function parseCSSFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lightVars = {};
  const darkVars = {};
  const fonts = {};
  const shadows = {};
  const config = {};
  
  // Extract :root variables (light mode)
  const rootMatch = content.match(/:root\s*{([^}]+)}/s);
  if (rootMatch) {
    const rootContent = rootMatch[1];
    const varMatches = rootContent.matchAll(/--([\w-]+):\s*([^;]+);/g);
    
    for (const match of varMatches) {
      const varName = match[1];
      const varValue = match[2].trim();
      
      if (varName.startsWith('font-')) {
        const fontType = varName.replace('font-', '');
        fonts[fontType] = varValue;
      } else if (varName.startsWith('shadow')) {
        const shadowType = varName.replace('shadow-', '').replace('2xs', 'xs2').replace('2xl', 'xl2');
        shadows[shadowType === 'shadow' ? 'default' : shadowType] = varValue;
      } else if (['radius', 'tracking-normal', 'spacing'].includes(varName)) {
        config[toCamelCase(varName)] = varValue;
      } else {
        // Color variables
        const camelName = toCamelCase(varName);
        lightVars[camelName] = varValue;
      }
    }
  }
  
  // Extract .dark variables (dark mode)
  const darkMatch = content.match(/\.dark\s*{([^}]+)}/s);
  if (darkMatch) {
    const darkContent = darkMatch[1];
    const varMatches = darkContent.matchAll(/--([\w-]+):\s*([^;]+);/g);
    
    for (const match of varMatches) {
      const varName = match[1];
      const varValue = match[2].trim();
      
      if (varName.startsWith('font-')) {
        // Fonts are usually the same for light and dark
        continue;
      } else if (varName.startsWith('shadow')) {
        // Shadows are usually the same for light and dark
        continue;
      } else if (['radius', 'tracking-normal', 'spacing'].includes(varName)) {
        // Config is usually the same for light and dark
        continue;
      } else {
        // Color variables
        const camelName = toCamelCase(varName);
        darkVars[camelName] = varValue;
      }
    }
  }
  
  // If no dark mode variables found, use light mode variables
  if (Object.keys(darkVars).length === 0) {
    Object.assign(darkVars, lightVars);
  }
  
  return { lightVars, darkVars, fonts, shadows, config };
}

// Generate TypeScript theme object
function generateThemeObject(filename, parsedData) {
  const { lightVars, darkVars, fonts, shadows, config } = parsedData;
  const themeId = getThemeId(filename);
  const themeName = getThemeName(filename);
  
  // Create theme description based on theme name
  const description = `${themeName} theme with custom styling and color palette`;
  
  const themeObject = {
    id: themeId,
    name: themeName,
    description: description,
    light: {
      background: lightVars.background || 'oklch(1.0000 0 0)',
      foreground: lightVars.foreground || 'oklch(0.0902 0.0000 0)',
      card: lightVars.card || lightVars.background || 'oklch(1.0000 0 0)',
      cardForeground: lightVars.cardForeground || lightVars.foreground || 'oklch(0.0902 0.0000 0)',
      popover: lightVars.popover || lightVars.card || 'oklch(1.0000 0 0)',
      popoverForeground: lightVars.popoverForeground || lightVars.foreground || 'oklch(0.0902 0.0000 0)',
      primary: lightVars.primary || 'oklch(0.4069 0.1370 275.75)',
      primaryForeground: lightVars.primaryForeground || 'oklch(0.9804 0.0000 0)',
      secondary: lightVars.secondary || 'oklch(0.9608 0.0000 0)',
      secondaryForeground: lightVars.secondaryForeground || 'oklch(0.0902 0.0000 0)',
      muted: lightVars.muted || 'oklch(0.9608 0.0000 0)',
      mutedForeground: lightVars.mutedForeground || 'oklch(0.4510 0.0000 0)',
      accent: lightVars.accent || 'oklch(0.9608 0.0000 0)',
      accentForeground: lightVars.accentForeground || 'oklch(0.0902 0.0000 0)',
      destructive: lightVars.destructive || 'oklch(0.6279 0.2106 29.2336)',
      destructiveForeground: lightVars.destructiveForeground || 'oklch(0.9804 0.0000 0)',
      border: lightVars.border || 'oklch(0.8980 0.0000 0)',
      input: lightVars.input || 'oklch(0.8980 0.0000 0)',
      ring: lightVars.ring || lightVars.primary || 'oklch(0.4069 0.1370 275.75)',
      chart1: lightVars.chart1 || lightVars.primary || 'oklch(0.4069 0.1370 275.75)',
      chart2: lightVars.chart2 || 'oklch(0.6279 0.2106 29.2336)',
      chart3: lightVars.chart3 || 'oklch(0.7176 0.1686 142.4956)',
      chart4: lightVars.chart4 || 'oklch(0.6863 0.1686 221.2901)',
      chart5: lightVars.chart5 || 'oklch(0.7647 0.1686 53.2376)',
      sidebar: lightVars.sidebar || lightVars.background || 'oklch(1.0000 0 0)',
      sidebarForeground: lightVars.sidebarForeground || lightVars.foreground || 'oklch(0.0902 0.0000 0)',
      sidebarPrimary: lightVars.sidebarPrimary || lightVars.primary || 'oklch(0.4069 0.1370 275.75)',
      sidebarPrimaryForeground: lightVars.sidebarPrimaryForeground || lightVars.primaryForeground || 'oklch(0.9804 0.0000 0)',
      sidebarAccent: lightVars.sidebarAccent || lightVars.accent || 'oklch(0.9608 0.0000 0)',
      sidebarAccentForeground: lightVars.sidebarAccentForeground || lightVars.accentForeground || 'oklch(0.0902 0.0000 0)',
      sidebarBorder: lightVars.sidebarBorder || lightVars.border || 'oklch(0.8980 0.0000 0)',
      sidebarRing: lightVars.sidebarRing || lightVars.ring || 'oklch(0.4069 0.1370 275.75)'
    },
    dark: {
      background: darkVars.background || 'oklch(0.0902 0.0000 0)',
      foreground: darkVars.foreground || 'oklch(0.9804 0.0000 0)',
      card: darkVars.card || darkVars.background || 'oklch(0.0902 0.0000 0)',
      cardForeground: darkVars.cardForeground || darkVars.foreground || 'oklch(0.9804 0.0000 0)',
      popover: darkVars.popover || darkVars.card || 'oklch(0.0902 0.0000 0)',
      popoverForeground: darkVars.popoverForeground || darkVars.foreground || 'oklch(0.9804 0.0000 0)',
      primary: darkVars.primary || 'oklch(0.7020 0.1370 275.75)',
      primaryForeground: darkVars.primaryForeground || 'oklch(0.0902 0.0000 0)',
      secondary: darkVars.secondary || 'oklch(0.1569 0.0000 0)',
      secondaryForeground: darkVars.secondaryForeground || 'oklch(0.9804 0.0000 0)',
      muted: darkVars.muted || 'oklch(0.1569 0.0000 0)',
      mutedForeground: darkVars.mutedForeground || 'oklch(0.6510 0.0000 0)',
      accent: darkVars.accent || 'oklch(0.1569 0.0000 0)',
      accentForeground: darkVars.accentForeground || 'oklch(0.9804 0.0000 0)',
      destructive: darkVars.destructive || 'oklch(0.7647 0.2106 29.2336)',
      destructiveForeground: darkVars.destructiveForeground || 'oklch(0.0902 0.0000 0)',
      border: darkVars.border || 'oklch(0.2706 0.0000 0)',
      input: darkVars.input || 'oklch(0.2706 0.0000 0)',
      ring: darkVars.ring || darkVars.primary || 'oklch(0.7020 0.1370 275.75)',
      chart1: darkVars.chart1 || darkVars.primary || 'oklch(0.7020 0.1370 275.75)',
      chart2: darkVars.chart2 || 'oklch(0.7647 0.2106 29.2336)',
      chart3: darkVars.chart3 || 'oklch(0.8176 0.1686 142.4956)',
      chart4: darkVars.chart4 || 'oklch(0.7863 0.1686 221.2901)',
      chart5: darkVars.chart5 || 'oklch(0.8647 0.1686 53.2376)',
      sidebar: darkVars.sidebar || darkVars.background || 'oklch(0.0902 0.0000 0)',
      sidebarForeground: darkVars.sidebarForeground || darkVars.foreground || 'oklch(0.9804 0.0000 0)',
      sidebarPrimary: darkVars.sidebarPrimary || darkVars.primary || 'oklch(0.7020 0.1370 275.75)',
      sidebarPrimaryForeground: darkVars.sidebarPrimaryForeground || darkVars.primaryForeground || 'oklch(0.0902 0.0000 0)',
      sidebarAccent: darkVars.sidebarAccent || darkVars.accent || 'oklch(0.1569 0.0000 0)',
      sidebarAccentForeground: darkVars.sidebarAccentForeground || darkVars.accentForeground || 'oklch(0.9804 0.0000 0)',
      sidebarBorder: darkVars.sidebarBorder || darkVars.border || 'oklch(0.2706 0.0000 0)',
      sidebarRing: darkVars.sidebarRing || darkVars.ring || 'oklch(0.7020 0.1370 275.75)'
    },
    fonts: {
      sans: fonts.sans || 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
      serif: fonts.serif || 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
      mono: fonts.mono || 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
    },
    shadows: {
      xs2: shadows.xs2 || '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      xs: shadows.xs || '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      sm: shadows.sm || '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      default: shadows.default || shadows.shadow || '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      md: shadows.md || '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: shadows.lg || '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      xl: shadows.xl || '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      xl2: shadows.xl2 || '0 25px 50px -12px rgb(0 0 0 / 0.25)'
    },
    config: {
      radius: config.radius || '0.5rem',
      trackingNormal: config.trackingNormal || '0em',
      spacing: config.spacing || '0.25rem'
    }
  };
  
  return themeObject;
}

// Main conversion function
function convertThemes() {
  try {
    console.log('🎨 Converting CSS themes to TypeScript objects...');
    console.log('Input directory:', THEMES_DIR);
    console.log('Output directory:', OUTPUT_DIR);
    
    // Get all CSS files from themes directory
    const cssFiles = fs.readdirSync(THEMES_DIR)
      .filter(file => file.endsWith('.css'))
      .sort();
    
    console.log(`Found ${cssFiles.length} CSS files:`, cssFiles);
    
    if (cssFiles.length === 0) {
      console.log('❌ No CSS files found in themes directory');
      return;
    }
    
    console.log(`📁 Found ${cssFiles.length} theme files:`);
    cssFiles.forEach(file => console.log(`   - ${file}`));
  
  const themes = [];
  const themeExports = [];
  
  // Process each CSS file
  for (const cssFile of cssFiles) {
    try {
      console.log(`\n🔄 Processing ${cssFile}...`);
      
      const cssPath = path.join(THEMES_DIR, cssFile);
      const parsedData = parseCSSFile(cssPath);
      const themeObject = generateThemeObject(cssFile, parsedData);
      
      // Generate TypeScript file
      const themeId = getThemeId(cssFile);
      const exportName = toCamelCase(themeId) + 'Theme';
      const tsFileName = `${themeId}.ts`;
      const tsFilePath = path.join(OUTPUT_DIR, tsFileName);
      
      const tsContent = `import type { CompleteTheme } from '../types/theme';

export const ${exportName}: CompleteTheme = ${JSON.stringify(themeObject, null, 2)} as const;
`;
      
      fs.writeFileSync(tsFilePath, tsContent);
      
      themes.push(themeObject);
      themeExports.push({ exportName, fileName: tsFileName.replace('.ts', ''), themeId });
      
      console.log(`   ✅ Generated ${tsFileName}`);
      
    } catch (error) {
      console.error(`   ❌ Error processing ${cssFile}:`, error.message);
    }
  }
  
  // Generate index file
  console.log('\n📝 Generating index file...');
  
  const indexContent = `// Auto-generated theme exports
// This file is automatically generated by scripts/convert-themes.js
// Do not edit manually - run 'bun run convert-themes' to regenerate

import type { CompleteTheme } from '../types/theme';

${themeExports.map(({ exportName, fileName }) => 
    `import { ${exportName} } from './${fileName}';`
  ).join('\n')}

export const themes: CompleteTheme[] = [
${themeExports.map(({ exportName }) => `  ${exportName}`).join(',\n')}
] as const;

export const themeMap = new Map<string, CompleteTheme>([
${themeExports.map(({ exportName, themeId }) => 
    `  ['${themeId}', ${exportName}]`
  ).join(',\n')}
]);

// Individual theme exports
${themeExports.map(({ exportName }) => 
    `export { ${exportName} };`
  ).join('\n')}

// Helper functions
export function getThemeById(id: string): CompleteTheme | undefined {
  return themeMap.get(id);
}

export function getAllThemeIds(): string[] {
  return Array.from(themeMap.keys());
}

export function getAllThemes(): CompleteTheme[] {
  return themes;
}
`;
  
  const indexPath = path.join(OUTPUT_DIR, 'index.ts');
  fs.writeFileSync(indexPath, indexContent);
  
  console.log(`   ✅ Generated index.ts with ${themes.length} themes`);
  
  // Generate summary
  console.log('\n📊 Conversion Summary:');
  console.log(`   • Processed: ${cssFiles.length} CSS files`);
  console.log(`   • Generated: ${themes.length} TypeScript theme files`);
  console.log(`   • Output directory: ${OUTPUT_DIR}`);
  console.log(`   • Index file: ${indexPath}`);
  
  console.log('\n🎉 Theme conversion completed successfully!');
  
  } catch (error) {
    console.error('Error during conversion:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the conversion
convertThemes();

export { convertThemes };