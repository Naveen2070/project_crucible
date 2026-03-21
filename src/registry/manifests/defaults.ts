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

export const COMPONENT_DEFAULTS: Record<string, { variants: string[]; sizes: string[]; states: string[] }> = {
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
