import { CrucibleConfig } from '../config/reader';
import { ResolvedTokens } from '../tokens/resolver';

export interface ComponentModel {
  name: string;
  framework: string;
  variants: string[];
  sizes: string[];
  states: string[];
  tokens: ResolvedTokens;
  a11y: {
    focusRing: boolean;
    focusRingColor: string;
    focusRingWidth: string;
    focusRingOffset: string;
    reduceMotion: boolean;
    role?: string;
    focusTrap?: boolean;
    keyboardNav?: boolean;
  };
  features: {
    hover: boolean;
  };
}

const COMPONENT_DEFAULTS: Record<string, Pick<ComponentModel, 'variants' | 'sizes' | 'states'>> = {
  Button: {
    variants: ['primary', 'secondary', 'ghost', 'danger'],
    sizes: ['sm', 'md', 'lg'],
    states: ['disabled', 'loading'],
  },
  Input: {
    variants: ['default', 'error'],
    sizes: ['sm', 'md', 'lg'],
    states: ['disabled', 'error'],
  },
  Card: {
    variants: ['default', 'hoverable', 'clickable'],
    sizes: ['sm', 'md', 'lg'],
    states: [],
  },
  Modal: {
    variants: ['default', 'confirm'],
    sizes: ['sm', 'md', 'lg'],
    states: ['open', 'closed'],
  },
  Select: {
    variants: ['default', 'error'],
    sizes: ['sm', 'md', 'lg'],
    states: ['disabled', 'error', 'open'],
  },
};

export function buildComponentModel(
  name: string,
  tokens: ResolvedTokens,
  config: CrucibleConfig,
): ComponentModel {
  const defaults = COMPONENT_DEFAULTS[name];
  if (!defaults) throw new Error(`Unknown component: ${name}. Run: crucible list`);

  return {
    name,
    framework: config.framework ?? 'react',
    ...defaults,
    tokens,
    a11y: {
      focusRing: config.features.focusRing ?? true,
      focusRingColor: config.a11y.focusRingColor ?? 'var(--color-primary)',
      focusRingWidth: config.a11y.focusRingWidth ?? '2px',
      focusRingOffset: config.a11y.focusRingOffset ?? '3px',
      reduceMotion: config.a11y.reduceMotion ?? true,
      role: name === 'Modal' ? 'dialog' : undefined,
      focusTrap: name === 'Modal' ? true : undefined,
      keyboardNav: name === 'Select' ? true : undefined,
    },
    features: {
      hover: config.features.hover ?? true,
    },
  };
}
