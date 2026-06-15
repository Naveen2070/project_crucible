export enum Framework {
  React = 'react',
  Vue = 'vue',
  Angular = 'angular',
  ReactNative = 'react-native',
}

export enum StyleSystem {
  CSS = 'css',
  Tailwind = 'tailwind',
  SCSS = 'scss',
  // React Native styling. NativeWind = Tailwind classNames for RN; StyleSheet = RN's
  // built-in StyleSheet.create. Valid only for the react-native framework (see
  // FRAMEWORK_STYLE_SYSTEMS in src/registry/frameworks.ts).
  NativeWind = 'nativewind',
  StyleSheet = 'stylesheet',
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
  DropdownMenu: 'DropdownMenu',
} as const;

export type ComponentName = typeof ComponentName[keyof typeof ComponentName];

