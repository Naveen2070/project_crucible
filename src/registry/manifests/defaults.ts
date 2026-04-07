import { ComponentName } from '../../core/enums';

export const TAILWIND_VARIANT_DEFAULTS: Record<string, Record<string, string>> = {
  [ComponentName.Button]: {
    default:
      'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] border-transparent hover:opacity-90',
    primary:
      'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] border-transparent hover:opacity-90',
    secondary:
      'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] border-transparent hover:opacity-80',
    outline:
      'bg-transparent text-[var(--color-foreground)] border-[var(--color-border)] hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]',
    ghost:
      'bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]',
    link: 'bg-transparent text-[var(--color-primary)] underline-offset-4 hover:underline border-transparent',
    destructive:
      'bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)] border-transparent hover:opacity-90',
  },
  [ComponentName.Input]: {
    default:
      'bg-[var(--color-surface)] border-[var(--color-border)] focus:border-[var(--color-primary)]',
    error:
      'bg-[var(--color-surface)] border-[var(--color-destructive)] focus:border-[var(--color-destructive)]',
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
      'bg-[var(--color-surface)] border-[var(--color-destructive)] focus:border-[var(--color-destructive)]',
  },
  [ComponentName.Table]: {
    default: 'bg-[var(--color-surface)] border-[var(--color-border)]',
    striped: 'bg-[var(--color-surface)] border-[var(--color-border)]',
    bordered: 'bg-[var(--color-surface)] border-[var(--color-border)]',
    compact: 'bg-[var(--color-surface)] border-[var(--color-border)]',
  },
  [ComponentName.Popover]: {
    default: 'bg-[var(--color-surface)] border-[var(--color-border)] shadow-lg',
    minimal: 'bg-[var(--color-surface)] shadow-md',
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
    dynamicRowCount?: boolean;
  };

  /** Utils files to copy to generated output (e.g., ['virtualizer', 'table-sorter']) */
  utils?: string[];
}

export const COMPONENT_DEFAULTS: Record<string, ComponentMeta> = {
  [ComponentName.Button]: {
    variants: ['default', 'primary', 'secondary', 'outline', 'ghost', 'link', 'destructive'],
    sizes: ['xs', 'sm', 'md', 'lg', 'icon'],
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
  [ComponentName.Table]: {
    variants: ['default', 'striped', 'bordered', 'compact'],
    sizes: ['sm', 'md', 'lg'],
    states: ['loading', 'empty', 'selectable', 'sortable', 'virtualizable', 'pagable'],
    props: [
      'columns',
      'data',
      'rowKey',
      'pageSize',
      'page',
      'onSort',
      'onSelect',
      'onPageChange',
      'virtualize',
      'itemHeight',
    ],
    prefix: 'table',
    noClassName: true,
    behaviours: [],
    a11y: { role: 'table', keyboardNav: true, dynamicRowCount: true },
    utils: ['virtualizer', 'table-sorter', 'table-paginator'],
  },
  [ComponentName.Popover]: {
    variants: ['default', 'minimal'],
    sizes: ['sm', 'md', 'lg'],
    states: ['open', 'closed'],
    props: ['isOpen', 'onOpenChange', 'placement', 'alignment', 'trigger', 'closeOnClickOutside', 'closeOnEscape'],
    prefix: 'popover',
    behaviours: ['closeable'],
    a11y: { role: 'dialog' },
  },
};
