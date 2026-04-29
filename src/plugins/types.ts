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
  peerDependencies?: Record<string, string[]>;
  tailwindDefaults?: Record<string, string>;
  extensions?: Record<string, any>;
}

export interface FrameworkManifest {
  id: string; // Changed from Framework to string for pluggability
  name: string;
  extension: string;
  storiesExtension: string;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  engineVersion?: string; // Optional: compatible engine version (semver range)
  description?: string;
  components: string[]; // IDs of components provided by this plugin
  templatesDir?: string; // Optional: relative path to templates, defaults to './templates'
  frameworks?: string[]; // Optional: relative paths to framework manifests
}

export interface LoadedPlugin {
  manifest: PluginManifest;
  components: ComponentManifest[];
  frameworks?: FrameworkManifest[]; // Added frameworks to LoadedPlugin
  root: string;
}
