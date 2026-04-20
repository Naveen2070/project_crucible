import ansis from 'ansis';
import { registry } from '../../registry/components';
import { pluginRegistry } from '../../plugins/registry';

export function runList() {
  console.log(ansis.cyan('Available components:'));
  for (const [name, def] of Object.entries(registry)) {
    const pluginId = pluginRegistry.getComponentPluginId(name) || 'core';
    console.log(`  ${ansis.gray(pluginId + '/')}${ansis.bold(name)}  [${def.frameworks.join(', ')}]  [${def.styleSystems.join(', ')}]`);
  }
}
