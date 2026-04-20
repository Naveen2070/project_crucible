export enum Framework {
  React = 'react',
  Vue = 'vue',
  Angular = 'angular',
}

export enum StyleSystem {
  CSS = 'css',
  Tailwind = 'tailwind',
  SCSS = 'scss',
}

export enum ThemePreset {
  Minimal = 'minimal',
  Soft = 'soft',
  Custom = 'custom',
}

export enum DarkModeStrategy {
  Auto = 'auto',
  Manual = 'manual',
}

export const ComponentName = {
  Button: 'Button',
  Input: 'Input',
  Card: 'Card',
  Dialog: 'Dialog',
  Select: 'Select',
  Table: 'Table',
  Popover: 'Popover',
} as const;

export type ComponentName = typeof ComponentName[keyof typeof ComponentName];

