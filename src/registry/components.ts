import { ComponentDef } from './path-generator';
import { pluginRegistry } from '../plugins/registry';

// Re-export ComponentDef for backward compatibility
export type { ComponentDef };

/**
 * The component registry.
 * In v1.1, this is a proxy to the pluginRegistry to support dynamic loading.
 */
export const registry: Record<string, ComponentDef> = new Proxy({}, {
  get(_, prop: string) {
    return pluginRegistry.getComponentDef(prop);
  },
  ownKeys() {
    return pluginRegistry.getAllComponentIds();
  },
  getOwnPropertyDescriptor() {
    return {
      enumerable: true,
      configurable: true,
    };
  }
});
