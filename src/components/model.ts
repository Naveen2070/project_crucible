import { CrucibleConfig } from '../config/reader';
import { ResolvedTokens } from '../tokens/resolver';

export interface ComponentModel {
  name: string;
  framework: string;
  styleSystem: 'css' | 'tailwind';
  variants: string[];
  sizes: string[];
  states: string[];
  tokens: ResolvedTokens;
  tailwindVariants?: Record<string, string>;
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
    compoundComponents?: boolean;
  };
  generateStories: boolean;
}

const TAILWIND_VARIANT_DEFAULTS: Record<string, Record<string, string>> = {
  Button: {
    primary:
      'bg-[var(--color-primary)] text-[var(--color-surface)] border-[var(--color-primary)] hover:brightness-110',
    secondary:
      'bg-[var(--color-secondary)] text-[var(--color-primary)] border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:text-[var(--color-surface)]',
    ghost:
      'bg-transparent text-[var(--color-text)] border-[var(--color-border)] hover:bg-[var(--color-secondary)]',
    danger:
      'bg-[var(--color-danger)] text-[var(--color-surface)] border-[var(--color-danger)] hover:brightness-110',
  },
  Input: {
    default: 'bg-[var(--color-surface)] border-[var(--color-border)] focus:border-[var(--color-primary)]',
    error: 'bg-[var(--color-surface)] border-[var(--color-danger)] focus:border-[var(--color-danger)]',
  },
  Card: {
    default: 'bg-[var(--color-surface)] border-[var(--color-border)]',
    hoverable: 'bg-[var(--color-surface)] border-[var(--color-border)] hover:shadow-lg',
    clickable: 'bg-[var(--color-surface)] border-[var(--color-border)] cursor-pointer hover:shadow-lg',
  },
  Modal: {
    default: 'bg-[var(--color-surface)]',
    confirm: 'bg-[var(--color-surface)] border-t-4 border-[var(--color-primary)]',
  },
  Select: {
    default: 'bg-[var(--color-surface)] border-[var(--color-border)] focus:border-[var(--color-primary)]',
    error: 'bg-[var(--color-surface)] border-[var(--color-danger)] focus:border-[var(--color-danger)]',
  },
};

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
  generateStories: boolean,
): ComponentModel {
  const defaults = COMPONENT_DEFAULTS[name];
  if (!defaults) throw new Error(`Unknown component: ${name}. Run: crucible list`);

  return {
    name,
    framework: config.framework ?? 'react',
    styleSystem: config.styleSystem ?? 'css',
    ...defaults,
    tokens,
    tailwindVariants: TAILWIND_VARIANT_DEFAULTS[name],
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
      compoundComponents: config.features.compoundComponents !== false && config.framework !== 'angular',
    },
    generateStories,
  };
}
