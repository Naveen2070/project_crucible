import ansis from 'ansis';
import { registry } from '../../registry/components';

export function runList() {
  console.log(ansis.cyan('Available components:'));
  for (const [name, def] of Object.entries(registry)) {
    console.log(`  ${name}  [${def.frameworks.join(', ')}]  [${def.styleSystems.join(', ')}]`);
  }
}
