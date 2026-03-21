import { Command } from 'commander';
import path from 'path';
import chalk from 'chalk';
import fs from 'fs-extra';
import { checkbox, confirm } from '@inquirer/prompts';
import { readConfig } from '../config/reader';
import { resolveTokens } from '../tokens/resolver';
import { buildComponentModel } from '../components/model';
import { renderComponent } from '../templates/engine';
import { writeFiles, loadHashes, saveHashes } from '../scaffold/writer';
import { registry } from '../registry/components';
import { runInit } from './init';
import { checkAndSetupTailwind } from './tailwind';
import { loadPreset } from '../themes';
import { Framework, StyleSystem, ThemePreset } from '../core/enums';
import { runDoctor } from './doctor';

const program = new Command();

program
  .name('crucible')
  .description('Design system engine — scaffolds native, fully-owned components directly into your project')
  .version('0.1.0');

program.addHelpText(
  'after',
  `
Examples:
  $ npx crucible init
  $ npx crucible add Button
  $ npx crucible add Input Card --framework react --cwd ./packages/ui
  $ npx crucible doctor
  $ npx crucible list

For more details, visit: https://github.com/crucible-ui/crucible
`,
);

program
  .command('init')
  .description('Scaffold a default crucible.config.json')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .option('--cwd <path>', 'Current working directory', '.')
  .action((opts) => runInit({ yes: opts.yes, cwd: path.resolve(process.cwd(), opts.cwd) }));

program
  .command('doctor')
  .description('Proactively validate your Crucible configuration and environment setup')
  .option('--cwd <path>', 'Current working directory', '.')
  .action((opts) => runDoctor({ cwd: path.resolve(process.cwd(), opts.cwd) }));

program
  .command('eject')
  .description('Eject the built-in theme into your local crucible.config.json')
  .option('--config <path>', 'Path to config file', 'crucible.config.json')
  .option('--cwd <path>', 'Current working directory', '.')
  .action(async (opts) => {
    try {
      const cwd = path.resolve(process.cwd(), opts.cwd);
      const configPath = path.resolve(cwd, opts.config);
      if (!(await fs.pathExists(configPath))) {
        console.error(chalk.red('✗ Config file not found. Run "crucible init" first.'));
        process.exit(1);
      }
      const raw = await fs.readJson(configPath);
      const theme = raw.theme || ThemePreset.Minimal;
      const presetTokens = loadPreset(theme);

      raw.tokens = { ...presetTokens, ...raw.tokens };
      raw.theme = ThemePreset.Custom;

      await fs.writeJson(configPath, raw, { spaces: 2 });
      console.log(chalk.green(`✔ Ejected ${theme} theme into ${opts.config}`));
    } catch (e: any) {
      console.error(chalk.red(`✗ Error: ${e.message}`));
    }
  });

program
  .command('add [component...]')
  .description('Scaffold a component into your project')
  .option('--framework <fw>', 'Target framework', Framework.React)
  .option('--dev', 'Output to playground/__generated__')
  .option('--force', 'Overwrite even if file has been edited')
  .option('--config <path>', 'Path to config file', 'crucible.config.json')
  .option('-y, --yes', 'Skip interactive prompts and accept missing dependencies')
  .option('--stories', 'Generate Storybook story file')
  .option('--no-stories', 'Skip story generation (overrides config default)')
  .option('--dry-run', 'Simulate generation without writing files')
  .option('--cwd <path>', 'Current working directory', '.')
  .option('--verbose', 'Enable verbose logging')
  .option('--quiet', 'Disable all logging except errors')
  .action(async (components: string[], opts: any) => {
    const cwd = path.resolve(process.cwd(), opts.cwd);
    let componentsToAdd: string[] = components || [];

    if (componentsToAdd.length > 0) {
      for (const comp of componentsToAdd) {
        if (!registry[comp as keyof typeof registry]) {
          console.error(chalk.red(`✗ Unknown component: ${comp}`));
          if (!opts.quiet) console.log(`Available: ${Object.keys(registry).join(', ')}`);
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
        if (!opts.quiet) console.log(chalk.gray('No components selected.'));
        return;
      }
      componentsToAdd = answers;
    }

    try {
      if (opts.verbose) console.log(chalk.blue(`Reading config from ${opts.config} in ${cwd}...`));

      const configPathRelative = path.relative(process.cwd(), path.resolve(cwd, opts.config));
      const config = await readConfig(configPathRelative);

      const framework =
        opts.framework !== Framework.React ? opts.framework : config.framework || Framework.React;
      if (framework === Framework.Angular && !opts.quiet) {
        console.log(chalk.cyan('\nℹ Angular uses an idiomatic unified pattern.'));
        console.log(
          chalk.cyan(
            '  Generating output that relies on native content projection (ng-content).\n',
          ),
        );
      }

      // Pre-generation token validation (Linting pass)
      const tokens = resolveTokens(config);
      if (!tokens.cssVars['--color-primary'] && !opts.quiet) {
        console.warn(chalk.yellow('⚠ Warning: --color-primary is missing from tokens.'));
      }

      if (config.styleSystem === StyleSystem.Tailwind) {
        if (opts.verbose) console.log(chalk.blue(`Checking Tailwind setup...`));
        await checkAndSetupTailwind({ yes: opts.yes, cwd });
      }

      const outDir = opts.dev
        ? path.join(cwd, 'playground/react/src/__generated__')
        : path.join(cwd, config.flags?.outputDir ?? 'src/components');

      // Dependency resolution
      const resolvedComponents = new Set<string>(componentsToAdd);
      for (const comp of componentsToAdd) {
        if (comp === 'Select' || comp === 'Modal') {
          const btnDir = path.join(outDir, 'Button');
          const extensions =
            framework === Framework.React
              ? ['.tsx']
              : framework === Framework.Vue
                ? ['.vue']
                : ['.component.ts'];

          let btnExists = false;
          for (const ext of extensions) {
            if (
              (await fs.pathExists(path.join(btnDir, `Button${ext}`))) ||
              (await fs.pathExists(path.join(btnDir, `button${ext}`)))
            ) {
              btnExists = true;
              break;
            }
          }

          if (!resolvedComponents.has('Button') && !btnExists) {
            let addDep = true;
            if (!opts.yes) {
              addDep = await confirm({
                message: `${comp} usually depends on Button. Scaffold Button as well?`,
                default: true,
              });
            }
            if (addDep) {
              resolvedComponents.add('Button');
              if (opts.verbose) console.log(chalk.blue(`Added Button as dependency for ${comp}`));
            }
          }
        }
      }

      const generateStories =
        opts.stories !== undefined ? opts.stories : (config.flags?.stories ?? false);

      const hashes = await loadHashes(path.join(cwd, '.crucible-hashes.json'));

      await Promise.all(Array.from(resolvedComponents).map(async (comp) => {
        if (opts.verbose) console.log(chalk.blue(`Generating ${comp}...`));
        const model = buildComponentModel(comp, tokens, config, generateStories);
        const files = await renderComponent(model);

        await writeFiles(files, outDir, comp, {
          force: opts.force,
          dryRun: opts.dryRun,
          quiet: opts.quiet,
          cwd,
          hashes,
        });

        const storiesNote = generateStories ? ' + story' : '';
        const dryRunNote = opts.dryRun ? chalk.yellow(' (dry-run)') : '';

        if (!opts.quiet) {
          console.log(
            chalk.cyan(
              `\n⚗  ${comp}/ [${config.styleSystem}/${config.theme}${storiesNote}] → ${outDir}`,
            ) + dryRunNote,
          );
        }
      }));

      if (!opts.dryRun) {
        await saveHashes(hashes, path.join(cwd, '.crucible-hashes.json'));
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
