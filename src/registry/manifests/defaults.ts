import { ComponentName } from '../../core/enums';

export const TAILWIND_VARIANT_DEFAULTS: Record<string, Record<string, string>> = {
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
  [ComponentName.Dialog]: {
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
  };
}

export const COMPONENT_DEFAULTS: Record<string, ComponentMeta> = {
  [ComponentName.Button]: {
    variants: ['primary', 'secondary', 'ghost', 'danger'],
    sizes: ['sm', 'md', 'lg'],
    states: ['disabled', 'loading'],
    props: [],
    prefix: 'btn',
  },
  [ComponentName.Input]: {
    variants: ['default', 'error'],
    sizes: ['sm', 'md', 'lg'],
    states: ['disabled', 'error'],
    props: ['required', 'hint', 'label', 'placeholder', 'id'],
    prefix: 'input',
    a11y: { role: 'input', passwordToggle: true },
  },
  [ComponentName.Card]: {
    variants: ['default', 'hoverable', 'clickable'],
    sizes: ['sm', 'md', 'lg'],
    states: [],
    props: ['title', 'onClick', 'href'],
    prefix: 'card',
    noClassName: true,
    a11y: { role: 'article' },
  },
  [ComponentName.Dialog]: {
    variants: ['default', 'confirm'],
    sizes: ['sm', 'md', 'lg'],
    states: ['open', 'closed'],
    props: ['title'],
    prefix: 'Dialog',
    noClassName: true,
    behaviours: ['closeable', 'focusTrap', 'scrollLock'],
    a11y: { role: 'dialog', focusTrap: true },
  },
  [ComponentName.Select]: {
    variants: ['default', 'error'],
    sizes: ['sm', 'md', 'lg'],
    states: ['disabled', 'error', 'open'],
    props: ['label', 'placeholder', 'id'],
    prefix: 'select',
    behaviours: ['closeable'],
    a11y: { role: 'combobox', keyboardNav: true },
  },
};
