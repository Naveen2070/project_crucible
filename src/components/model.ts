import { CrucibleConfig } from '../config/reader';
import { ResolvedTokens } from '../tokens/resolver';
import { Framework, StyleSystem, ComponentName } from '../core/enums';
import { COMPONENT_DEFAULTS, TAILWIND_VARIANT_DEFAULTS } from '../registry/manifests/defaults';

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
