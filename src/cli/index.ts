import { Command } from 'commander';
import path from 'path';
import chalk from 'chalk';
import fs from 'fs-extra';
import { registry } from '../registry/components';
import { runInit } from './init';
import { loadPreset } from '../themes';
import { Framework, ThemePreset } from '../core/enums';
import { runDoctor } from './doctor';
import { runTokens } from './tokens';
import { runAdd } from './add';
import { runPlaygroundGenerate, runPlaygroundOpen, runPlaygroundDev } from './playground';

const program = new Command();

function warnForce(cmd: string): void {
  console.log(chalk.yellow(`\n⚠  --force flag is active for: ${cmd}`));
  console.log(chalk.gray('   This will overwrite user-edited files and bypass hash protection.\n'));
}

program
  .name('crucible')
  .description(
    'Design system engine — scaffolds native, fully-owned components directly into your project',
  )
  .version('1.0.0');

program.addHelpText(
  'after',
  `
Examples:
  $ npx crucible init
  $ npx crucible add Button
  $ npx crucible add Input Card --framework react --cwd ./packages/ui
  $ npx crucible doctor
  $ npx crucible list
  $ npx crucible tokens          # Regenerate tokens.css
  $ npx crucible tokens --force  # Force overwrite existing
  $ npx crucible pg:gen         # Generate playground
  $ npx crucible pg:gen --force # Clean and regenerate

For more details, visit: https://github.com/Naveen2070/project_crucible
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
  .command('tokens')
  .description('Regenerate the global tokens.css file')
  .option('--force', 'Overwrite existing tokens.css')
  .option('--dry-run', 'Show what would be generated without writing')
  .option('--cwd <path>', 'Current working directory', '.')
  .action((opts) => {
    if (opts.force) warnForce('crucible tokens');
    runTokens({
      force: opts.force,
      dryRun: opts.dryRun,
      cwd: path.resolve(process.cwd(), opts.cwd || '.'),
    });
  });

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
  .action((components: string[], opts: any) => {
    if (opts.force) warnForce('crucible add');
    runAdd(components, opts);
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

program
  .command('pg:gen [framework]')
  .alias('pg')
  .description('Generate playground components for frameworks')
  .option('--stories', 'Include story files', true)
  .option('--no-stories', 'Exclude story files')
  .option('-f, --force', 'Clean up existing generated files before generating')
  .action(async (framework: string | undefined, opts: any) => {
    if (opts.force) warnForce('crucible pg:gen');
    await runPlaygroundGenerate({ framework, stories: opts.stories, force: opts.force });
  });

program
  .command('pg:open [framework]')
  .alias('po')
  .description('Open Storybook for a framework playground')
  .action(async (framework: string | undefined, opts: any) => {
    await runPlaygroundOpen({ framework });
  });

program
  .command('pg:dev [framework]')
  .alias('pd')
  .description('Start dev server for a framework playground')
  .action(async (framework: string | undefined, opts: any) => {
    await runPlaygroundDev({ framework });
  });

program.parse();
