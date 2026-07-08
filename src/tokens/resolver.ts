import { CrucibleConfig } from '../config/reader';
import { loadPreset } from '../themes';
import { normalizeDarkMode, deriveDarkTokens } from './dark-resolver';
import { COMPONENT_TOKEN_DEFAULTS } from './component-deriver';
import { DarkModeStrategy } from '../core/enums';

export interface ResolvedTokens {
  cssVars: Record<string, string>;
  darkCssVars: Record<string, string> | null;
  darkModeStrategy: 'auto' | 'manual';
  js: Record<string, string>;
  componentTokens: Record<string, Record<string, string>>;
  // RN NativeWind Tailwind preset shape (shadcn-style DEFAULT/foreground pairs).
  nativewind: {
    colors: Record<string, string | { DEFAULT: string; foreground: string }>;
    borderRadius: Record<string, string>;
  };
}

export function resolveTokens(config: CrucibleConfig): ResolvedTokens {
  const preset = loadPreset(config.theme);
  const merged = deepMerge(preset, config.tokens ?? {}) as typeof preset;

  const cssVars: Record<string, string> = {};
  const js: Record<string, string> = {};
  const componentTokens: Record<string, Record<string, string>> = {};

  // Component Tokens
  for (const [compName, defaultTokens] of Object.entries(COMPONENT_TOKEN_DEFAULTS)) {
    componentTokens[compName] = { ...defaultTokens };
    const userOverrides = config.tokens?.components?.[compName];
    if (userOverrides) {
      for (const [tokenName, tokenValue] of Object.entries(userOverrides)) {
        componentTokens[compName][tokenName] = tokenValue;
      }
    }
    // Flatten into cssVars
    for (const [tokenName, tokenValue] of Object.entries(componentTokens[compName])) {
      cssVars[`--${compName}-${kebab(tokenName)}`] = tokenValue;
    }
  }

  const nativewindColors: Record<string, string | { DEFAULT: string; foreground: string }> = {};

  // Colors
  for (const [key, value] of Object.entries(merged.color)) {
    cssVars[`--color-${kebab(key)}`] = value;
    js[`color${pascal(key)}`] = value;
    nativewindColors[key] = value;
  }

  // Semantic foreground colors (standard pattern)
  const foregroundMap: Record<string, string> = {
    primary: merged.color.surface ?? '#FFFFFF',
    secondary: merged.color.text ?? '#1A1A2E',
    destructive: merged.color.surface ?? '#FFFFFF',
    accent: merged.color.text ?? '#1A1A2E',
  };

  for (const [key, value] of Object.entries(foregroundMap)) {
    cssVars[`--color-${key}-foreground`] = value;
    js[`color${pascal(key)}Foreground`] = value;
    nativewindColors[key] = { DEFAULT: merged.color[key as keyof typeof merged.color], foreground: value };
  }

  // Base foreground variable
  cssVars['--foreground'] = merged.color.text ?? '#1A1A2E';
  js['foreground'] = merged.color.text ?? '#1A1A2E';
  nativewindColors['foreground'] = merged.color.text ?? '#1A1A2E';

  const nativewindBorderRadius: Record<string, string> = {};

  // Radius
  for (const [key, value] of Object.entries(merged.radius)) {
    cssVars[`--radius-${key}`] = value;
    js[`radius${pascal(key)}`] = value;
    nativewindBorderRadius[key] = value;
  }

  // Spacing
  cssVars['--spacing-unit'] = merged.spacing.unit;
  js['spacingUnit'] = merged.spacing.unit;

  // Typography
  cssVars['--font-family'] = merged.typography.fontFamily;
  cssVars['--font-size-base'] = merged.typography.scaleBase;

  const darkConfig = normalizeDarkMode(config.darkMode);
  let darkCssVars: Record<string, string> | null = null;
  let darkModeStrategy: 'auto' | 'manual' = DarkModeStrategy.Auto;

  if (darkConfig) {
    darkModeStrategy = darkConfig.strategy;
    const darkColors = deriveDarkTokens(merged.color, darkConfig, config.theme);
    darkCssVars = {};
    for (const [key, value] of Object.entries(darkColors)) {
      darkCssVars[`--color-${kebab(key)}`] = value;
    }
    // Dark mode foreground colors
    const darkForegroundMap: Record<string, string> = {
      primary: darkColors.surface ?? '#1a1a2e',
      secondary: darkColors.text ?? '#f1f5f9',
      destructive: darkColors.surface ?? '#1a1a2e',
      accent: darkColors.text ?? '#f1f5f9',
    };
    for (const [key, value] of Object.entries(darkForegroundMap)) {
      darkCssVars[`--color-${key}-foreground`] = value;
    }
    // Base dark foreground
    darkCssVars['--foreground'] = darkColors.text ?? '#f1f5f9';
  }

  return {
    cssVars,
    darkCssVars,
    darkModeStrategy,
    js,
    componentTokens,
    nativewind: { colors: nativewindColors, borderRadius: nativewindBorderRadius },
  };
}

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function deepMerge(base: any, override: any): any {
  const result = { ...base };
  for (const key of Object.keys(override ?? {})) {
    // Guard against prototype pollution from user-supplied config keys.
    if (FORBIDDEN_KEYS.has(key)) continue;
    if (typeof override[key] === 'object' && !Array.isArray(override[key])) {
      result[key] = deepMerge(base[key] ?? {}, override[key]);
    } else {
      result[key] = override[key];
    }
  }
  return result;
}

function kebab(str: string): string {
  return str.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`);
}

function pascal(str: string): string {
  return str ? str[0].toUpperCase() + str.slice(1) : str;
}
