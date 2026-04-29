import path from 'path';
import ansis from 'ansis';
import { ComponentManifest, FrameworkManifest, LoadedPlugin } from './types';
import { ComponentDef, generateComponentFiles } from '../registry/path-generator';
import { Framework, StyleSystem } from '../core/enums';

export interface FileTarget {
  tpl: string;
  out: string;
  isStory?: boolean;
}

export type FrameworkResolver = (name: string, styleSystem: StyleSystem) => FileTarget[];

export class PluginRegistry {
  private static instance: PluginRegistry;
  private components: Map<string, ComponentManifest> = new Map();
  private registry: Map<string, ComponentDef> = new Map();
  private componentToTemplatesDir: Map<string, string> = new Map();
  private componentToPluginId: Map<string, string> = new Map();
  private frameworks: Map<string, FrameworkManifest> = new Map();
  private frameworkResolvers: Map<string, FrameworkResolver> = new Map();
  private plugins: LoadedPlugin[] = [];

  private constructor() {}

  public static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry();
    }
    return PluginRegistry.instance;
  }

  public registerPlugin(plugin: LoadedPlugin) {
    this.plugins.push(plugin);
    
    const templatesDir = path.resolve(plugin.root, plugin.manifest.templatesDir || './templates');

    // Register Components
    for (const comp of plugin.components) {
      if (this.components.has(comp.id)) {
        const existingPluginId = this.componentToPluginId.get(comp.id);
        console.warn(
          ansis.yellow(
            `⚠ Component collision: ID "${comp.id}" is already registered by plugin "${existingPluginId}". ` +
            `Plugin "${plugin.manifest.id}" will override it.`
          )
        );
      }
      this.components.set(comp.id, comp);
      this.registry.set(comp.id, generateComponentFiles(comp.name, comp.dependencies));
      this.componentToTemplatesDir.set(comp.id, templatesDir);
      this.componentToPluginId.set(comp.id, plugin.manifest.id);
    }

    // Register Frameworks
    if (plugin.frameworks) {
      for (const fw of plugin.frameworks) {
        this.frameworks.set(fw.id, fw);
      }
    }
  }

  public registerFrameworkResolver(id: string, resolver: FrameworkResolver) {
    this.frameworkResolvers.set(id, resolver);
  }

  public getFrameworkResolver(id: string): FrameworkResolver | undefined {
    return this.frameworkResolvers.get(id);
  }

  public getComponentManifest(id: string): ComponentManifest | undefined {
    return this.components.get(id);
  }

  public getComponentDef(id: string): ComponentDef | undefined {
    return this.registry.get(id);
  }

  public getComponentTemplatesDir(id: string): string | undefined {
    return this.componentToTemplatesDir.get(id);
  }

  public getComponentPluginId(id: string): string | undefined {
    return this.componentToPluginId.get(id);
  }

  public getAllComponentIds(): string[] {
    return Array.from(this.components.keys());
  }

  public getRegistry(): Record<string, ComponentDef> {
    const reg: Record<string, ComponentDef> = {};
    for (const [id, def] of this.registry.entries()) {
      reg[id] = def;
    }
    return reg;
  }
  
  public getTailwindDefaults(): Record<string, Record<string, string>> {
    const defaults: Record<string, Record<string, string>> = {};
    for (const [id, comp] of this.components.entries()) {
      defaults[id] = comp.tailwindDefaults || {};
    }
    return defaults;
  }
}

export const pluginRegistry = PluginRegistry.getInstance();
