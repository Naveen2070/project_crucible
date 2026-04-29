import path from 'path';
import { readdir } from 'node:fs/promises';
import ansis from 'ansis';
import { pathExists, readJson } from '../utils/fs';
import { PluginManifest, ComponentManifest, LoadedPlugin } from './types';
import { pluginRegistry } from './registry';
import '../registry/frameworks'; // Ensure built-in frameworks are registered

export async function initRegistry(cwd: string) {
  const plugins = await loadPlugins(cwd);
  for (const plugin of plugins) {
    pluginRegistry.registerPlugin(plugin);
  }
}

export async function loadPlugins(cwd: string): Promise<LoadedPlugin[]> {
  const plugins: LoadedPlugin[] = [];
  
  let engineVersion = '1.0.0';
  try {
    const pkg = await readJson(path.join(__dirname, '../../../package.json'));
    engineVersion = pkg.version || '1.0.0';
  } catch {}

  // 1. Built-in "core" plugin
  const coreManifestPath = path.join(__dirname, '../registry/manifests/plugin.json');
  if (await pathExists(coreManifestPath)) {
    const manifest = await readJson(coreManifestPath);
    if (isCompatible(manifest.engineVersion, engineVersion)) {
      const components = await loadPluginComponents(path.dirname(coreManifestPath), manifest.components);
      const frameworks = manifest.frameworks ? await loadPluginFrameworks(path.dirname(coreManifestPath), manifest.frameworks) : undefined;
      plugins.push({
        manifest,
        components,
        frameworks,
        root: path.dirname(coreManifestPath),
      });
    } else {
      console.warn(ansis.yellow(`⚠ Skipping core plugin: incompatible engine version (needs ${manifest.engineVersion}, engine is ${engineVersion})`));
    }
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
            
            if (!isCompatible(manifest.engineVersion, engineVersion)) {
              console.warn(ansis.yellow(`⚠ Skipping plugin "${manifest.id}": incompatible engine version (needs ${manifest.engineVersion}, engine is ${engineVersion})`));
              continue;
            }

            const components = await loadPluginComponents(pluginRoot, manifest.components);
            const frameworks = manifest.frameworks ? await loadPluginFrameworks(pluginRoot, manifest.frameworks) : undefined;
            plugins.push({
              manifest,
              components,
              frameworks,
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

function isCompatible(required: string | undefined, current: string): boolean {
  if (!required) return true;
  
  // Basic semver check for >= versions
  if (required.startsWith('>=')) {
    const reqVersion = required.replace('>=', '').trim();
    return compareVersions(current, reqVersion) >= 0;
  }
  
  // Exact match
  return current === required;
}

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
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

async function loadPluginFrameworks(pluginRoot: string, frameworkPaths: string[]): Promise<any[]> {
  const frameworks: any[] = [];
  for (const fwPath of frameworkPaths) {
    const fullPath = path.resolve(pluginRoot, fwPath);
    if (await pathExists(fullPath)) {
      const framework = await readJson(fullPath);
      frameworks.push(framework);
    }
  }
  return frameworks;
}
