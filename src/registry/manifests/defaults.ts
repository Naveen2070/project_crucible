import { pluginRegistry } from '../../plugins/registry';

export interface ComponentMeta {
  /** Visual variants (e.g., primary, secondary, ghost) */
  variants: string[];

  /** Size options (e.g., sm, md, lg) */
  sizes: string[];

  /** Behavioral states (e.g., disabled, loading, open) */
  states: string[];

  /** Props this component accepts (controls has* flag derivation) */
  props: string[];

  /** CSS class prefix (e.g., 'btn', 'input', 'card') */
  prefix: string;

  /** Components that don't accept className prop (Card, Dialog) */
  noClassName?: boolean;

  /** Component behaviors (explicit, not inferred) */
  behaviours?: ('closeable' | 'focusTrap' | 'scrollLock')[];

  /** Component-specific a11y overrides */
  a11y?: {
    role?: string;
    focusTrap?: boolean;
    keyboardNav?: boolean;
    passwordToggle?: boolean;
    dynamicRowCount?: boolean;
  };

  /** Utils files to copy to generated output (e.g., ['virtualizer', 'table-sorter']) */
  utils?: string[];
}

/**
 * Component defaults.
 * In v1.1, these are proxied to the pluginRegistry.
 */
export const COMPONENT_DEFAULTS: Record<string, ComponentMeta> = new Proxy({}, {
  get(_, prop: string) {
    const manifest = pluginRegistry.getComponentManifest(prop);
    if (!manifest) return undefined;
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { tailwindDefaults, ...meta } = manifest;
    return meta as ComponentMeta;
  },
  ownKeys() {
    return pluginRegistry.getAllComponentIds();
  },
  getOwnPropertyDescriptor() {
    return {
      enumerable: true,
      configurable: true,
    };
  }
});

export const TAILWIND_VARIANT_DEFAULTS: Record<string, Record<string, string>> = new Proxy({}, {
  get(_, prop: string) {
    const manifest = pluginRegistry.getComponentManifest(prop);
    return manifest?.tailwindDefaults || {};
  },
  ownKeys() {
    return pluginRegistry.getAllComponentIds();
  },
  getOwnPropertyDescriptor() {
    return {
      enumerable: true,
      configurable: true,
    };
  }
});
