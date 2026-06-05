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
  Toast: 'Toast',
  Form: 'Form',
  Tabs: 'Tabs',
  Tooltip: 'Tooltip',
  Label: 'Label',
  Separator: 'Separator',
  Badge: 'Badge',
  Skeleton: 'Skeleton',
  Avatar: 'Avatar',
  Textarea: 'Textarea',
  Checkbox: 'Checkbox',
  Switch: 'Switch',
  Alert: 'Alert',
  Progress: 'Progress',
  Breadcrumb: 'Breadcrumb',
  RadioGroup: 'RadioGroup',
  Accordion: 'Accordion',
} as const;

export type ComponentName = typeof ComponentName[keyof typeof ComponentName];

