import chalk from 'chalk';
import { registry } from '../../registry/components';

export function runList() {
  console.log(chalk.cyan('Available components:'));
  for (const [name, def] of Object.entries(registry)) {
    console.log(`  ${name}  [${def.frameworks.join(', ')}]  [${def.styleSystems.join(', ')}]`);
  }
}
