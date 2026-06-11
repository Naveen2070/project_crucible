import ansis from 'ansis';
import { pluginRegistry } from '../../plugins/registry';

export interface InfoOptions {
  json?: boolean;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function runInfo(componentName: string, opts: InfoOptions = {}) {
  const id = capitalizeFirst(componentName);
  const manifest = pluginRegistry.getComponentManifest(id);

  if (!manifest) {
    const all = pluginRegistry.getAllComponentIds();
    const needle = id.toLowerCase();
    const suggestions = all.filter((c) => c.toLowerCase().includes(needle)).slice(0, 5);
    const hint = suggestions.length
      ? `Did you mean: ${suggestions.join(', ')}?`
      : `Run 'crucible list' to see all components.`;
    throw new Error(`Unknown component: ${componentName}. ${hint}`);
  }

  if (opts.json) {
    console.log(JSON.stringify(manifest, null, 2));
    return;
  }

  const pluginId = pluginRegistry.getComponentPluginId(id) || 'core';
  const row = (label: string, value?: string) =>
    value ? console.log(`  ${ansis.gray(label.padEnd(16))}${value}`) : undefined;

  console.log(ansis.cyan(`\n⚗  ${ansis.bold(manifest.name)}  ${ansis.gray(`(${pluginId})`)}`));
  if (manifest.description) console.log(ansis.gray(`   ${manifest.description}`));
  console.log('');

  row('Frameworks', manifest.frameworks.join(', '));
  row('Style systems', manifest.styleSystems.join(', '));
  row('Variants', manifest.variants.length ? manifest.variants.join(', ') : undefined);
  row('Sizes', manifest.sizes.length ? manifest.sizes.join(', ') : undefined);
  row('States', manifest.states.length ? manifest.states.join(', ') : undefined);
  row('Props', manifest.props.length ? manifest.props.join(', ') : undefined);
  row('Depends on', manifest.dependencies?.length ? manifest.dependencies.join(', ') : undefined);
  row('Utils', manifest.utils?.length ? manifest.utils.join(', ') : undefined);
  if (manifest.a11y?.role) row('ARIA role', manifest.a11y.role);

  if (manifest.peerDependencies && Object.keys(manifest.peerDependencies).length > 0) {
    console.log(`  ${ansis.gray('Peer deps')}`);
    for (const [fw, deps] of Object.entries(manifest.peerDependencies)) {
      if (deps.length) console.log(`    ${ansis.gray(fw.padEnd(14))}${deps.join(', ')}`);
    }
  }

  console.log('');
  console.log(ansis.gray(`  Add it:  npx crucible add ${manifest.name}`));
  console.log('');
}
