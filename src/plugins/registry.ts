import path from 'path';
import { ComponentManifest, LoadedPlugin } from './types';
import { ComponentDef, generateComponentFiles } from '../registry/path-generator';

export class PluginRegistry {
  private static instance: PluginRegistry;
  private components: Map<string, ComponentManifest> = new Map();
  private registry: Map<string, ComponentDef> = new Map();
  private componentToTemplatesDir: Map<string, string> = new Map();
  private componentToPluginId: Map<string, string> = new Map();
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

    for (const comp of plugin.components) {
      this.components.set(comp.id, comp);
      this.registry.set(comp.id, generateComponentFiles(comp.name, comp.dependencies));
      this.componentToTemplatesDir.set(comp.id, templatesDir);
      this.componentToPluginId.set(comp.id, plugin.manifest.id);
    }
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
