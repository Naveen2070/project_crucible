import { Command } from 'commander';
import path from 'path';
import chalk from 'chalk';
import { readConfig } from '../config/reader';
import { resolveTokens } from '../tokens/resolver';
import { buildComponentModel } from '../components/model';
import { renderComponent } from '../templates/engine';
import { writeFiles } from '../scaffold/writer';
import { registry } from '../registry/components';

const program = new Command();

program
  .name('crucible')
  .description('Design system engine — generates owned React components')
  .version('0.1.0');

program
  .command('add <component>')
  .description('Scaffold a component into your project')
  .option('--framework <fw>', 'Target framework', 'react')
  .option('--dev', 'Output to playground/__generated__')
  .option('--force', 'Overwrite even if file has been edited')
  .option('--config <path>', 'Path to config file', 'crucible.config.json')
  .action(async (componentName: string, opts: any) => {
    if (!registry[componentName]) {
      console.error(chalk.red(`✗ Unknown component: ${componentName}`));
      console.log(`Available: ${Object.keys(registry).join(', ')}`);
      process.exit(1);
    }

    try {
      const config = await readConfig(opts.config);
      const tokens = resolveTokens(config);
      const model = buildComponentModel(componentName, tokens, config);
      const files = await renderComponent(model);

      const outDir = opts.dev
        ? path.join(process.cwd(), 'playground/react/src/__generated__')
        : path.join(process.cwd(), config.flags?.outputDir ?? 'src/components');

      await writeFiles(files, outDir, { force: opts.force });
      console.log(
        chalk.cyan(`\n⚗  ${componentName} [${config.styleSystem}/${config.theme}] → ${outDir}`),
      );
    } catch (err: any) {
      console.error(chalk.red(`✗ Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('list')
  .description('Show all available components')
  .action(() => {
    console.log(chalk.cyan('Available components:'));
    for (const [name, def] of Object.entries(registry)) {
      console.log(`  ${name}  [${def.frameworks.join(', ')}]  [${def.styleSystems.join(', ')}]`);
    }
  });

program.parse();
