import { Command } from 'commander';
import path from 'path';
import chalk from 'chalk';
import fs from 'fs-extra';
import { checkbox, confirm } from '@inquirer/prompts';
import { readConfig } from '../config/reader';
import { resolveTokens } from '../tokens/resolver';
import { buildComponentModel } from '../components/model';
import { renderComponent } from '../templates/engine';
import { writeFiles } from '../scaffold/writer';
import { registry } from '../registry/components';
import { runInit } from './init';
import { checkAndSetupTailwind } from './tailwind';
import { loadPreset } from '../themes';

const program = new Command();

program
  .name('crucible')
  .description('Design system engine — generates owned React components')
  .version('0.1.0');

program
  .command('init')
  .description('Scaffold a default crucible.config.json')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .action((opts) => runInit({ yes: opts.yes }));

program
  .command('eject')
  .description('Eject the built-in theme into your local crucible.config.json')
  .option('--config <path>', 'Path to config file', 'crucible.config.json')
  .action(async (opts) => {
    try {
      const configPath = path.join(process.cwd(), opts.config);
      if (!await fs.pathExists(configPath)) {
        console.error(chalk.red('✗ Config file not found. Run "crucible init" first.'));
        process.exit(1);
      }
      const raw = await fs.readJson(configPath);
      const theme = raw.theme || 'minimal';
      const presetTokens = loadPreset(theme);
      
      raw.tokens = { ...presetTokens, ...raw.tokens };
      raw.theme = 'custom'; // optional, maybe keep it but tokens override
      
      await fs.writeJson(configPath, raw, { spaces: 2 });
      console.log(chalk.green(`✔ Ejected ${theme} theme into ${opts.config}`));
    } catch (e: any) {
      console.error(chalk.red(`✗ Error: ${e.message}`));
    }
  });

program
  .command('add [component...]')
  .description('Scaffold a component into your project')
  .option('--framework <fw>', 'Target framework', 'react')
  .option('--dev', 'Output to playground/__generated__')
  .option('--force', 'Overwrite even if file has been edited')
  .option('--config <path>', 'Path to config file', 'crucible.config.json')
  .option('-y, --yes', 'Skip interactive prompts and accept missing dependencies')
  .option('--stories', 'Generate Storybook story file')
  .option('--no-stories', 'Skip story generation (overrides config default)')
  .action(async (components: string[], opts: any) => {
    let componentsToAdd: string[] = components || [];

    if (componentsToAdd.length > 0) {
      for (const comp of componentsToAdd) {
        if (!registry[comp]) {
          console.error(chalk.red(`✗ Unknown component: ${comp}`));
          console.log(`Available: ${Object.keys(registry).join(', ')}`);
          process.exit(1);
        }
      }
    } else {
      if (opts.yes) {
        console.error(chalk.red(`✗ Cannot use --yes without specifying components to add.`));
        process.exit(1);
      }
      const answers = await checkbox({
        message: 'Select components to scaffold:',
        choices: Object.keys(registry).map((name) => ({ name, value: name })),
      });
      if (answers.length === 0) {
        console.log(chalk.gray('No components selected.'));
        return;
      }
      componentsToAdd = answers;
    }

    try {
      const config = await readConfig(opts.config);
      
      const framework = opts.framework !== 'react' ? opts.framework : (config.framework || 'react');
      if (config.features.compoundComponents && framework === 'angular') {
        console.warn(chalk.yellow('\n⚠ compoundComponents is not supported for Angular.'));
        console.warn(chalk.yellow('  Ignored — generating idiomatic Angular output with @Input() and ng-content.\n'));
      }

      // Pre-generation token validation (Linting pass)
      const tokens = resolveTokens(config);
      if (!tokens.cssVars['--color-primary']) {
        console.warn(chalk.yellow('⚠ Warning: --color-primary is missing from tokens.'));
      }

      if (config.styleSystem === 'tailwind') {
        await checkAndSetupTailwind({ yes: opts.yes });
      }

      const outDir = opts.dev
        ? path.join(process.cwd(), 'playground/react/src/__generated__')
        : path.join(process.cwd(), config.flags?.outputDir ?? 'src/components');

      // Dependency resolution
      const resolvedComponents = new Set<string>(componentsToAdd);
      for (const comp of componentsToAdd) {
        if (comp === 'Select' || comp === 'Modal') {
          const btnDir = path.join(outDir, 'Button');
          const btnFile = path.join(btnDir, 'Button.tsx');
          if (!resolvedComponents.has('Button') && !(await fs.pathExists(btnFile))) {
            let addDep = true;
            if (!opts.yes) {
              addDep = await confirm({
                message: `${comp} usually depends on Button. Scaffold Button as well?`,
                default: true,
              });
            }
            if (addDep) resolvedComponents.add('Button');
          }
        }
      }

      const generateStories =
        opts.stories !== undefined ? opts.stories : (config.flags?.stories ?? false);

      for (const comp of Array.from(resolvedComponents)) {
        const model = buildComponentModel(comp, tokens, config, generateStories);
        const files = await renderComponent(model);

        await writeFiles(files, outDir, comp, { force: opts.force });
        const storiesNote = generateStories ? ' + story' : '';
        console.log(
          chalk.cyan(`\n⚗  ${comp}/ [${config.styleSystem}/${config.theme}${storiesNote}] → ${outDir}`),
        );
      }
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
