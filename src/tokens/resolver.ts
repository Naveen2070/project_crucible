import { CrucibleConfig } from '../config/reader';

export interface ResolvedTokens {
  cssVars: Record<string, string>;
  js: Record<string, string>;
}

export function resolveTokens(config: CrucibleConfig): ResolvedTokens {
  const cssVars: Record<string, string> = {};
  const js: Record<string, string> = {};

  // Colors
  for (const [key, value] of Object.entries(config.tokens.color)) {
    cssVars[`--color-${kebab(key)}`] = value;
    js[`color${pascal(key)}`] = value;
  }

  // Radius
  for (const [key, value] of Object.entries(config.tokens.radius)) {
    cssVars[`--radius-${key}`] = value;
    js[`radius${pascal(key)}`] = value;
  }

  // Spacing
  cssVars['--spacing-unit'] = config.tokens.spacing.unit;
  js['spacingUnit'] = config.tokens.spacing.unit;

  // Typography
  cssVars['--font-family'] = config.tokens.typography.fontFamily;
  cssVars['--font-size-base'] = config.tokens.typography.scaleBase;

  return { cssVars, js };
}

function kebab(str: string): string {
  return str.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`);
}

function pascal(str: string): string {
  return str[0].toUpperCase() + str.slice(1);
}
