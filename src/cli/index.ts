import { Command } from 'commander';
import path from 'path';
import ansis from 'ansis';
import { runInit } from './commands/init';
import { runDoctor } from './commands/doctor';
import { runTokens } from './commands/tokens';
import { runAdd } from './commands/add';
import { runEject } from './commands/eject';
import { runList } from './commands/list';
import { runInfo } from './commands/info';
import { runStatus } from './commands/status';
import { runDiff } from './commands/diff';
import { runUpdate } from './commands/update';
import { runRemove } from './commands/remove';
import { runUi } from './commands/ui';
import { runClean, runPgClean } from './commands/clean';
import { runConfigShow } from './commands/config-show';
import { runCompletion } from './commands/completion';
import { runPlaygroundGenerate, runPlaygroundOpen, runPlaygroundDev } from './commands/playground';
import { maybeNotifyUpdate } from './utils/version-check';
import { Framework } from '../core/enums';
import { assertDevMode } from '../config/dev-mode';
import { initRegistry } from '../plugins/loader';
import { readJson } from '../utils/fs';
import { cleanupWatchers } from '../templates/engine';

/**
 * Single error boundary for command actions: awaits the handler, and on any thrown error prints
 * a consistent message, tears down template watchers, and exits non-zero. Returning the promise
 * lets commander's `parseAsync` await it (block-body actions previously did not).
 */
async function runCommand(name: string, fn: () => Promise<void> | void): Promise<void> {
  try {
    await fn();
  } catch (err: any) {
    console.error(ansis.red(`✗ ${name} failed: ${err?.message ?? err}`));
    await cleanupWatchers();
    process.exit(1);
  }
  // Always tear down any template watchers the engine may have started (dev mode), so commands
  // that render in-memory (e.g. diff) don't hang the process waiting on chokidar.
  await cleanupWatchers();
}

const program = new Command();

async function bootstrap() {
  // Initialize registry with core and local plugins
  const cwdArgIndex = process.argv.indexOf('--cwd');
  const cwd = cwdArgIndex !== -1 ? path.resolve(process.cwd(), process.argv[cwdArgIndex + 1]) : process.cwd();

  // `--strict` is read from argv here (bootstrap runs before commander parses flags),
  // and can also be set persistently via `plugins.strict` in crucible.config.json.
  let strict = process.argv.includes('--strict');
  if (!strict) {
    try {
      const cfg = await readJson(path.join(cwd, 'crucible.config.json'));
      strict = !!cfg?.plugins?.strict;
    } catch {
      /* no config / not readable — argv flag only */
    }
  }

  try {
    await initRegistry(cwd, { strict });
  } catch (err: any) {
    console.error(ansis.red(`✗ Plugin registry error: ${err.message}`));
    process.exit(1);
  }

  // Single source of truth for the CLI version: the package manifest.
  let version = '0.0.0';
  try {
    const pkg = await readJson(path.join(__dirname, '../../package.json'));
    version = pkg.version || version;
  } catch {}

  function warnForce(cmd: string): void {
    console.log(ansis.yellow(`\n⚠  --force flag is active for: ${cmd}`));
    console.log(ansis.gray('   This will overwrite user-edited files and bypass hash protection.\n'));
  }

  program
    .name('crucible')
    .description(
      'Design system engine — scaffolds native, fully-owned components directly into your project',
    )
    .version(version)
    .option('--no-update-check', 'Skip the npm update-availability check');

  program.addHelpText(
    'after',
    `
Examples:
  $ npx crucible init
  $ npx crucible ui              # Interactive console (explore, install, diff, update…)
  $ npx crucible add Button
  $ npx crucible add Input Card --framework react --cwd ./packages/ui
  $ npx crucible doctor
  $ npx crucible list
  $ npx crucible info Button     # Show a component's metadata
  $ npx crucible status          # Drift report for generated components
  $ npx crucible diff Button     # Preview what regeneration would change
  $ npx crucible update          # Regenerate tracked components (preserves edits)
  $ npx crucible remove Button   # Delete a component and untrack it
  $ npx crucible tokens          # Regenerate tokens.css
  $ npx crucible tokens --force  # Force overwrite existing
  $ npx crucible pg:gen         # Generate playground
  $ npx crucible pg:gen --force # Clean and regenerate

For more details, visit: https://github.com/Naveen2070/project_crucible
`,
  );

  program
    .command('init')
    .alias('i')
    .description('Scaffold a default crucible.config.json')
    .option('-y, --yes', 'Skip prompts and use defaults')
    .option('--quiet', 'Disable all logging except errors')
    .option('--cwd <path>', 'Current working directory', '.')
    .action((opts) =>
      runCommand('init', () =>
        runInit({ yes: opts.yes, quiet: opts.quiet, cwd: path.resolve(process.cwd(), opts.cwd) }),
      ),
    );

  program
    .command('doctor')
    .alias('d')
    .description('Proactively validate your Crucible configuration and environment setup')
    .option('--json', 'Output results as JSON')
    .option('--cwd <path>', 'Current working directory', '.')
    .action((opts) =>
      runCommand('doctor', () =>
        runDoctor({ json: opts.json, cwd: path.resolve(process.cwd(), opts.cwd) }),
      ),
    );

  program
    .command('tokens')
    .alias('t')
    .description('Regenerate the global tokens.css file')
    .option('-f, --force', 'Overwrite existing tokens.css')
    .option('--dry-run', 'Show what would be generated without writing')
    .option('--quiet', 'Disable all logging except errors')
    .option('--cwd <path>', 'Current working directory', '.')
    .action((opts) =>
      runCommand('tokens', () => {
        if (opts.force) warnForce('crucible tokens');
        return runTokens({
          force: opts.force,
          dryRun: opts.dryRun,
          quiet: opts.quiet,
          cwd: path.resolve(process.cwd(), opts.cwd || '.'),
        });
      }),
    );

  program
    .command('eject')
    .alias('e')
    .description('Eject the built-in theme into your local crucible.config.json')
    .option('--config <path>', 'Path to config file', 'crucible.config.json')
    .option('--quiet', 'Disable all logging except errors')
    .option('--cwd <path>', 'Current working directory', '.')
    .action((opts) =>
      runCommand('eject', () =>
        runEject({
          config: opts.config,
          quiet: opts.quiet,
          cwd: opts.cwd,
        }),
      ),
    );

  program
    .command('add [component...]')
    .alias('a')
    .description('Scaffold a component into your project')
    .option('--framework <fw>', 'Target framework', Framework.React)
    .option('-s, --style <system>', 'Override style system (css|tailwind|scss)')
    .option('-t, --theme <name>', 'Override theme (minimal|soft)')
    .option('-a, --all', 'Add all available components')
    .option('--dev', 'Output to playground/__generated__')
    .option('-f, --force', 'Overwrite even if file has been edited')
    .option('--config <path>', 'Path to config file', 'crucible.config.json')
    .option('-y, --yes', 'Skip interactive prompts and accept missing dependencies')
    .option('--stories', 'Generate Storybook story file')
    .option('--no-stories', 'Skip story generation (overrides config default)')
    .option('--dry-run', 'Simulate generation without writing files')
    .option('--cwd <path>', 'Current working directory', '.')
    .option('--strict', 'Error on plugin collisions / incompatible plugins')
    .option('--verbose', 'Enable verbose logging')
    .option('--quiet', 'Disable all logging except errors')
    .action((components: string[], opts: any) =>
      runCommand('add', () => {
        if (opts.force) warnForce('crucible add');
        return runAdd(components, opts);
      }),
    );

  program
    .command('list')
    .alias('l')
    .description('Show all available components')
    .option('--json', 'Output the component list as JSON')
    .option('--strict', 'Error on plugin collisions / incompatible plugins')
    .action((opts) => runCommand('list', () => runList({ json: opts.json })));

  program
    .command('ui')
    .aliases(['wizard', 'tui'])
    .description('Interactive console — explore components & metadata, install, diff, update, remove')
    .option('--cwd <path>', 'Current working directory', '.')
    .action((opts: any) => runCommand('ui', () => runUi({ cwd: opts.cwd })));

  program
    .command('info <component>')
    .description('Show a component’s metadata (variants, props, dependencies, peer deps)')
    .option('--json', 'Output the manifest as JSON')
    .option('--deps-tree', 'Show the component dependency tree instead of the full manifest')
    .action((component: string, opts: any) =>
      runCommand('info', () => runInfo(component, { json: opts.json, depsTree: opts.depsTree })),
    );

  program
    .command('status')
    .alias('st')
    .description('Report drift of generated components vs the manifest (ok / modified / missing)')
    .option('--json', 'Output the status report as JSON')
    .option('--cwd <path>', 'Current working directory', '.')
    .action((opts: any) =>
      runCommand('status', () =>
        runStatus({ json: opts.json, cwd: path.resolve(process.cwd(), opts.cwd) }),
      ),
    );

  program
    .command('diff [component...]')
    .description('Show what would change if components were regenerated (defaults to all tracked)')
    .option('--framework <fw>', 'Target framework')
    .option('-s, --style <system>', 'Override style system (css|tailwind|scss)')
    .option('--stories', 'Include story files in the diff')
    .option('--json', 'Output the changed-file list as JSON')
    .option('--config <path>', 'Path to config file', 'crucible.config.json')
    .option('--cwd <path>', 'Current working directory', '.')
    .action((components: string[], opts: any) => runCommand('diff', () => runDiff(components, opts)));

  program
    .command('update [component...]')
    .alias('up')
    .description('Regenerate tracked components (defaults to all; preserves edits unless --force)')
    .option('--framework <fw>', 'Target framework', Framework.React)
    .option('-s, --style <system>', 'Override style system (css|tailwind|scss)')
    .option('-t, --theme <name>', 'Override theme (minimal|soft)')
    .option('-f, --force', 'Overwrite even if a file has been edited')
    .option('--config <path>', 'Path to config file', 'crucible.config.json')
    .option('-y, --yes', 'Skip interactive prompts and accept missing dependencies')
    .option('--stories', 'Generate Storybook story file')
    .option('--no-stories', 'Skip story generation (overrides config default)')
    .option('--dry-run', 'Simulate regeneration without writing files')
    .option('--cwd <path>', 'Current working directory', '.')
    .option('--verbose', 'Enable verbose logging')
    .option('--quiet', 'Disable all logging except errors')
    .action((components: string[], opts: any) =>
      runCommand('update', () => {
        if (opts.force) warnForce('crucible update');
        return runUpdate(components, opts);
      }),
    );

  program
    .command('remove <component...>')
    .alias('rm')
    .description('Delete generated components and untrack them from the manifest')
    .option('-y, --yes', 'Skip the confirmation prompt')
    .option('--dry-run', 'Show what would be removed without deleting')
    .option('--quiet', 'Disable all logging except errors')
    .option('--cwd <path>', 'Current working directory', '.')
    .action((components: string[], opts: any) =>
      runCommand('remove', () => runRemove(components, opts)),
    );

  program
    .command('pg:gen [framework]')
    .alias('pg')
    .description('Generate playground components for frameworks (dev only)')
    .option('--stories', 'Include story files', true)
    .option('--no-stories', 'Exclude story files')
    .option('-f, --force', 'Clean up existing generated files before generating')
    .action((framework: string | undefined, opts: any) =>
      runCommand('pg:gen', () => {
        assertDevMode('crucible pg:gen');
        if (opts.force) warnForce('crucible pg:gen');
        return runPlaygroundGenerate({ framework, stories: opts.stories, force: opts.force });
      }),
    );

  program
    .command('pg:open [framework]')
    .alias('po')
    .description('Open Storybook for a framework playground (dev only)')
    .action((framework: string | undefined) =>
      runCommand('pg:open', () => {
        assertDevMode('crucible pg:open');
        return runPlaygroundOpen({ framework });
      }),
    );

  program
    .command('pg:dev [framework]')
    .alias('pd')
    .description('Start dev server for a framework playground (dev only)')
    .action((framework: string | undefined) =>
      runCommand('pg:dev', () => {
        assertDevMode('crucible pg:dev');
        return runPlaygroundDev({ framework });
      }),
    );

  // clean command - remove generated files
  program
    .command('clean')
    .alias('c')
    .description('Remove generated files from current directory')
    .option('-a, --all', 'Also remove crucible.config.json')
    .option('--quiet', 'Disable all logging except errors')
    .option('--cwd <path>', 'Current working directory', '.')
    .action((opts: any) => runCommand('clean', () => runClean(opts)));

  // pg:clean command - clean all playground folders
  program
    .command('pg:clean')
    .alias('pcl')
    .description('Clean all playground folders (dev only)')
    .action(() =>
      runCommand('pg:clean', () => {
        assertDevMode('crucible pg:clean');
        return runPgClean();
      }),
    );

  // config command - show current crucible.config.json
  program
    .command('config')
    .alias('cfg')
    .description('Show current crucible.config.json')
    .option('--json', 'Output raw JSON')
    .option('--cwd <path>', 'Current working directory', '.')
    .action((opts: any) => runCommand('config', () => runConfigShow(opts)));

  // completion command - print a shell completion script (or component ids in --components mode)
  program
    .command('completion [shell]')
    .description('Print a shell completion script (bash|zsh|fish)')
    .option('--components', 'Print the component ids used for dynamic completion (internal)')
    .action((shell: string | undefined, opts: any) =>
      runCommand('completion', () => runCompletion(shell, { components: opts.components })),
    );

  // Best-effort update notifier — skipped for `completion` (its stdout is sourced/eval'd).
  if (!process.argv.includes('completion')) {
    await maybeNotifyUpdate(version);
  }

  await program.parseAsync();
}

bootstrap();
