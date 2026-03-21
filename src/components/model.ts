import { CrucibleConfig } from '../config/reader';
import { ResolvedTokens } from '../tokens/resolver';
import { Framework, StyleSystem, ComponentName } from '../core/enums';

export interface ComponentModel {
  name: string;
  framework: `${Framework}`;
  isReact: boolean;
  isAngular: boolean;
  isVue: boolean;
  styleSystem: `${StyleSystem}`;
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
  [ComponentName.Button]: {
    primary:
      'bg-[var(--color-primary)] text-[var(--color-surface)] border-[var(--color-primary)] hover:brightness-110',
    secondary:
      'bg-[var(--color-secondary)] text-[var(--color-primary)] border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:text-[var(--color-surface)]',
    ghost:
      'bg-transparent text-[var(--color-text)] border-[var(--color-border)] hover:bg-[var(--color-secondary)]',
    danger:
      'bg-[var(--color-danger)] text-[var(--color-surface)] border-[var(--color-danger)] hover:brightness-110',
  },
  [ComponentName.Input]: {
    default:
      'bg-[var(--color-surface)] border-[var(--color-border)] focus:border-[var(--color-primary)]',
    error:
      'bg-[var(--color-surface)] border-[var(--color-danger)] focus:border-[var(--color-danger)]',
  },
  [ComponentName.Card]: {
    default: 'bg-[var(--color-surface)] border-[var(--color-border)]',
    hoverable: 'bg-[var(--color-surface)] border-[var(--color-border)] hover:shadow-lg',
    clickable:
      'bg-[var(--color-surface)] border-[var(--color-border)] cursor-pointer hover:shadow-lg',
  },
  [ComponentName.Modal]: {
    default: 'bg-[var(--color-surface)]',
    confirm: 'bg-[var(--color-surface)] border-t-4 border-[var(--color-primary)]',
  },
  [ComponentName.Select]: {
    default:
      'bg-[var(--color-surface)] border-[var(--color-border)] focus:border-[var(--color-primary)]',
    error:
      'bg-[var(--color-surface)] border-[var(--color-danger)] focus:border-[var(--color-danger)]',
  },
};

const COMPONENT_DEFAULTS: Record<string, Pick<ComponentModel, 'variants' | 'sizes' | 'states'>> = {
  [ComponentName.Button]: {
    variants: ['primary', 'secondary', 'ghost', 'danger'],
    sizes: ['sm', 'md', 'lg'],
    states: ['disabled', 'loading'],
  },
  [ComponentName.Input]: {
    variants: ['default', 'error'],
    sizes: ['sm', 'md', 'lg'],
    states: ['disabled', 'error'],
  },
  [ComponentName.Card]: {
    variants: ['default', 'hoverable', 'clickable'],
    sizes: ['sm', 'md', 'lg'],
    states: [],
  },
  [ComponentName.Modal]: {
    variants: ['default', 'confirm'],
    sizes: ['sm', 'md', 'lg'],
    states: ['open', 'closed'],
  },
  [ComponentName.Select]: {
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

  const framework = config.framework ?? Framework.React;

  return {
    name,
    framework,
    isReact: framework === Framework.React,
    isAngular: framework === Framework.Angular,
    isVue: framework === Framework.Vue,
    styleSystem: config.styleSystem ?? StyleSystem.CSS,
    ...defaults,
    tokens,
    tailwindVariants: TAILWIND_VARIANT_DEFAULTS[name],
    a11y: {
      focusRing: config.features.focusRing ?? true,
      focusRingColor: config.a11y.focusRingColor ?? 'var(--color-primary)',
      focusRingWidth: config.a11y.focusRingWidth ?? '2px',
      focusRingOffset: config.a11y.focusRingOffset ?? '3px',
      reduceMotion: config.a11y.reduceMotion ?? true,
      role: name === ComponentName.Modal ? 'dialog' : undefined,
      focusTrap: name === ComponentName.Modal ? true : undefined,
      keyboardNav: name === ComponentName.Select ? true : undefined,
    },
    features: {
      hover: config.features.hover ?? true,
      compoundComponents: config.features.compoundComponents !== false && framework !== Framework.Angular,
    },
    generateStories,
  };
}
