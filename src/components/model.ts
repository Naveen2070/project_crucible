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
  prefix: string;
  hasVariant: boolean;
  hasSize: boolean;
  hasLoading: boolean;
  hasDisabled: boolean;
  hasRequired: boolean;
  hasError: boolean;
  hasHint: boolean;
  hasLabel: boolean;
  hasTitle: boolean;
  hasIsOpen: boolean;
  hasClassName: boolean;
  hasId: boolean;
  hasOutputClose: boolean;
  hasClassesGetter: boolean;
  hasPlaceholder: boolean;
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

  const hasVariant = defaults.variants.length > 0;
  const hasSize = defaults.sizes.length > 0;
  const hasLoading = defaults.states.includes('loading');
  const hasDisabled = defaults.states.includes('disabled');
  const hasRequired = defaults.props.includes('required');
  const hasError = defaults.states.includes('error');
  const hasHint = defaults.props.includes('hint');
  const hasLabel = defaults.props.includes('label');
  const hasTitle = defaults.props.includes('title');
  const hasIsOpen = defaults.states.includes('open') || defaults.states.includes('closed');
  const hasClassName = !defaults.noClassName;
  const hasId = defaults.props.includes('id');
  const hasOutputClose = defaults.behaviours?.includes('closeable') ?? false;
  const hasClassesGetter = hasVariant || hasSize || hasLoading || hasDisabled || hasError;
  const hasPlaceholder = defaults.props.includes('placeholder');

  return {
    name,
    framework,
    isReact: framework === Framework.React,
    isAngular: framework === Framework.Angular,
    isVue: framework === Framework.Vue,
    styleSystem: config.styleSystem ?? StyleSystem.CSS,
    variants: defaults.variants,
    sizes: defaults.sizes,
    states: defaults.states,
    tokens,
    tailwindVariants: TAILWIND_VARIANT_DEFAULTS[name],
    a11y: {
      focusRing: config.features.focusRing ?? true,
      focusRingColor: config.a11y.focusRingColor ?? 'var(--color-primary)',
      focusRingWidth: config.a11y.focusRingWidth ?? '2px',
      focusRingOffset: config.a11y.focusRingOffset ?? '3px',
      reduceMotion: config.a11y.reduceMotion ?? true,
      role: defaults.a11y?.role,
      focusTrap: defaults.a11y?.focusTrap,
      keyboardNav: defaults.a11y?.keyboardNav,
    },
    features: {
      hover: config.features.hover ?? true,
      compoundComponents:
        config.features.compoundComponents !== false && framework !== Framework.Angular,
    },
    generateStories,
    prefix: defaults.prefix,
    hasVariant,
    hasSize,
    hasLoading,
    hasDisabled,
    hasRequired,
    hasError,
    hasHint,
    hasLabel,
    hasTitle,
    hasIsOpen,
    hasClassName,
    hasId,
    hasOutputClose,
    hasClassesGetter,
    hasPlaceholder,
  };
}
