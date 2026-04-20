import { Framework } from '../core/enums';
import { pluginRegistry } from '../plugins/registry';

export function getPeerDependencies(component: string, framework: Framework): string[] {
  const manifest = pluginRegistry.getComponentManifest(component);
  return manifest?.peerDependencies?.[framework] || [];
}
