import { Framework, StyleSystem } from '../core/enums';

export interface ComponentManifest {
  id: string;
  name: string;
  description?: string;
  frameworks: Framework[];
  styleSystems: StyleSystem[];
  variants: string[];
  sizes: string[];
  states: string[];
  props: string[];
  prefix: string;
  noClassName?: boolean;
  behaviours?: string[];
  a11y?: {
    role?: string;
    focusTrap?: boolean;
    keyboardNav?: boolean;
    passwordToggle?: boolean;
    dynamicRowCount?: boolean;
  };
  utils?: string[];
  dependencies?: string[];
  tailwindDefaults?: Record<string, string>;
}

export interface FrameworkManifest {
  id: Framework;
  name: string;
  extension: string;
  storiesExtension: string;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  components: string[]; // IDs of components provided by this plugin
  templatesDir?: string; // Optional: relative path to templates, defaults to './templates'
}
