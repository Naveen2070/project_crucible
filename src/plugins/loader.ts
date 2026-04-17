import path from 'path';
import { readdir } from 'node:fs/promises';
import { pathExists, readJson } from '../utils/fs';
import { PluginManifest, ComponentManifest } from './types';
import { pluginRegistry } from './registry';

export interface LoadedPlugin {
  manifest: PluginManifest;
  components: ComponentManifest[];
  root: string;
}

export async function initRegistry(cwd: string) {
  const plugins = await loadPlugins(cwd);
  for (const plugin of plugins) {
    pluginRegistry.registerPlugin(plugin);
  }
}

export async function loadPlugins(cwd: string): Promise<LoadedPlugin[]> {
  const plugins: LoadedPlugin[] = [];
  
  // 1. Built-in "core" plugin (can be hardcoded or loaded from a manifest)
  // For now, let's look for a manifest in src/registry/manifests/plugin.json
  const coreManifestPath = path.join(__dirname, '../registry/manifests/plugin.json');
  if (await pathExists(coreManifestPath)) {
    const manifest = await readJson(coreManifestPath);
    const components = await loadPluginComponents(path.dirname(coreManifestPath), manifest.components);
    plugins.push({
      manifest,
      components,
      root: path.dirname(coreManifestPath),
    });
  }

  // 2. Local project plugins: .crucible/plugins/*
  const localPluginsDir = path.join(cwd, '.crucible/plugins');
  if (await pathExists(localPluginsDir)) {
    const entries = await readdir(localPluginsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const pluginRoot = path.join(localPluginsDir, entry.name);
        const manifestPath = path.join(pluginRoot, 'plugin.json');
        
        if (await pathExists(manifestPath)) {
          try {
            const manifest = await readJson(manifestPath);
            const components = await loadPluginComponents(pluginRoot, manifest.components);
            plugins.push({
              manifest,
              components,
              root: pluginRoot,
            });
          } catch (err) {
            console.error(`Failed to load plugin from ${pluginRoot}:`, err);
          }
        }
      }
    }
  }

  return plugins;
}

async function loadPluginComponents(pluginRoot: string, componentPaths: string[]): Promise<ComponentManifest[]> {
  const components: ComponentManifest[] = [];
  for (const compPath of componentPaths) {
    const fullPath = path.resolve(pluginRoot, compPath);
    if (await pathExists(fullPath)) {
      const component = await readJson(fullPath);
      components.push(component);
    }
  }
  return components;
}
