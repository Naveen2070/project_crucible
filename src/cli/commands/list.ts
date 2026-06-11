import ansis from 'ansis';
import { registry } from '../../registry/components';
import { pluginRegistry } from '../../plugins/registry';

export interface ListOptions {
  json?: boolean;
}

export function runList(opts: ListOptions = {}) {
  const entries = Object.entries(registry).map(([name, def]) => ({
    id: name,
    pluginId: pluginRegistry.getComponentPluginId(name) || 'core',
    frameworks: def.frameworks,
    styleSystems: def.styleSystems,
  }));

  if (opts.json) {
    console.log(JSON.stringify(entries, null, 2));
    return;
  }

  console.log(ansis.cyan('Available components:'));
  for (const c of entries) {
    console.log(
      `  ${ansis.gray(c.pluginId + '/')}${ansis.bold(c.id)}  [${c.frameworks.join(', ')}]  [${c.styleSystems.join(', ')}]`,
    );
  }
}
