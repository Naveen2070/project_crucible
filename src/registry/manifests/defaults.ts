import { ComponentName } from '../../core/enums';
import buttonManifest from './components/button.json';
import inputManifest from './components/input.json';
import cardManifest from './components/card.json';
import dialogManifest from './components/dialog.json';
import selectManifest from './components/select.json';
import tableManifest from './components/table.json';
import popoverManifest from './components/popover.json';

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

const manifests: Record<string, any> = {
  [ComponentName.Button]: buttonManifest,
  [ComponentName.Input]: inputManifest,
  [ComponentName.Card]: cardManifest,
  [ComponentName.Dialog]: dialogManifest,
  [ComponentName.Select]: selectManifest,
  [ComponentName.Table]: tableManifest,
  [ComponentName.Popover]: popoverManifest,
};

export const TAILWIND_VARIANT_DEFAULTS: Record<string, Record<string, string>> = {};
export const COMPONENT_DEFAULTS: Record<string, ComponentMeta> = {};

for (const [name, manifest] of Object.entries(manifests)) {
  TAILWIND_VARIANT_DEFAULTS[name] = manifest.tailwindDefaults || {};
  
  const { tailwindDefaults, ...meta } = manifest;
  COMPONENT_DEFAULTS[name] = meta as ComponentMeta;
}

