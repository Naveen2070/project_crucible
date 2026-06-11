import path from 'path';
import ansis from 'ansis';
import { select, checkbox, confirm, search } from '@inquirer/prompts';
import { registry } from '../../registry/components';
import { pluginRegistry } from '../../plugins/registry';
import { Framework, StyleSystem } from '../../core/enums';
import { pathExists, readJson } from '../../utils/fs';
import { loadHashes } from '../../scaffold/writer';
import { trackedComponents } from '../utils/output-dir';
import { runInit } from './init';
import { runAdd } from './add';
import { runInfo } from './info';
import { runStatus } from './status';
import { runDiff } from './diff';
import { runUpdate } from './update';
import { runRemove } from './remove';

export interface UiOptions {
  cwd?: string;
}

interface UiContext {
  cwd: string; // resolved absolute
  cwdArg: string; // raw value to pass back to commands
}

/** Multi-select a subset of an existing component list (returns [] if none). */
async function pickComponents(names: string[], message: string): Promise<string[]> {
  if (names.length === 0) return [];
  return checkbox({
    message,
    pageSize: 15,
    choices: names.map((n) => ({ name: n, value: n })),
  });
}

/** Browse all components by fuzzy name, view metadata, then act on the chosen one. */
async function browse(ctx: UiContext) {
  const all = pluginRegistry.getAllComponentIds().sort();
  const comp = await search<string>({
    message: 'Search components (type to filter)',
    source: async (term) => {
      const t = (term || '').toLowerCase();
      return all
        .filter((n) => n.toLowerCase().includes(t))
        .map((n) => {
          const m = pluginRegistry.getComponentManifest(n);
          return { name: m?.description ? `${n}  ${ansis.gray('— ' + m.description)}` : n, value: n };
        });
    },
  });

  runInfo(comp); // prints the full metadata block

  const next = await select({
    message: `${comp} — what next?`,
    choices: [
      { name: 'Install it', value: 'install' },
      { name: 'Diff it vs on-disk', value: 'diff' },
      { name: 'Back to menu', value: 'back' },
    ],
  });

  if (next === 'install') {
    await runAdd([comp], { cwd: ctx.cwdArg, config: 'crucible.config.json' });
  } else if (next === 'diff') {
    await runDiff([comp], { cwd: ctx.cwdArg });
  }
}

/** Guided install: choose framework/style/theme/components/stories, then scaffold. */
async function install(ctx: UiContext, config: any) {
  const framework = await select({
    message: 'Framework',
    default: config.framework,
    choices: [
      { name: 'React', value: Framework.React },
      { name: 'Vue 3', value: Framework.Vue },
      { name: 'Angular', value: Framework.Angular },
    ],
  });

  const style = await select({
    message: 'Style system',
    default: config.styleSystem,
    choices: [
      { name: 'CSS Modules', value: StyleSystem.CSS },
      { name: 'SCSS Modules', value: StyleSystem.SCSS },
      { name: 'Tailwind CSS', value: StyleSystem.Tailwind },
    ],
  });

  const theme = await select({
    message: 'Theme',
    default: config.theme,
    choices: [
      { name: 'Minimal', value: 'minimal' },
      { name: 'Soft', value: 'soft' },
    ],
  });

  const available = Object.entries(registry)
    .filter(([, def]) => def.frameworks.includes(framework))
    .map(([name]) => name)
    .sort();

  if (available.length === 0) {
    console.log(ansis.yellow(`No components are available for ${framework}.`));
    return;
  }

  const selected = await checkbox({
    message: 'Select components (space to toggle, enter to confirm)',
    pageSize: 15,
    choices: available.map((name) => {
      const m = pluginRegistry.getComponentManifest(name);
      return { name: m?.description ? `${name}  ${ansis.gray('— ' + m.description)}` : name, value: name };
    }),
  });

  if (selected.length === 0) {
    console.log(ansis.gray('No components selected.'));
    return;
  }

  const stories = await confirm({
    message: 'Generate Storybook stories?',
    default: !!config.flags?.stories,
  });

  const outputDir = config.flags?.outputDir ?? 'src/components';
  console.log(ansis.cyan(`\n  Plan: ${selected.join(', ')}`));
  console.log(
    ansis.gray(
      `  Target: ${framework} / ${style} / ${theme}${stories ? ' + stories' : ''} → ${outputDir}\n`,
    ),
  );
  const proceed = await confirm({ message: 'Generate these components now?', default: true });
  if (!proceed) {
    console.log(ansis.gray('Cancelled.'));
    return;
  }

  await runAdd(selected, {
    framework,
    style,
    theme,
    stories,
    cwd: ctx.cwdArg,
    config: 'crucible.config.json',
  });
}

/**
 * Opt-in interactive console (`crucible ui` / `wizard` / `tui`). A menu-driven loop to explore
 * components and their metadata, install (guided), and run diff / status / update / remove —
 * all reusing the same commands. Bare `crucible` still shows help; this only runs when invoked.
 */
export async function runUi(opts: UiOptions = {}) {
  const cwdArg = opts.cwd || '.';
  const cwd = path.resolve(process.cwd(), cwdArg);
  const ctx: UiContext = { cwd, cwdArg };
  const configPath = path.join(cwd, 'crucible.config.json');

  console.log(ansis.cyan('\n⚗  Crucible — interactive console\n'));

  try {
    // Ensure a config exists (offer to create one).
    if (!(await pathExists(configPath))) {
      const create = await confirm({
        message: 'No crucible.config.json found here. Create one now?',
        default: true,
      });
      if (!create) {
        console.log(ansis.gray('Run `crucible init` first.'));
        return;
      }
      await runInit({ cwd, skipComponentPrompt: true });
      if (!(await pathExists(configPath))) return; // init cancelled
    }

    let running = true;
    while (running) {
      const config = await readJson(configPath);
      const tracked = trackedComponents((await loadHashes(cwd)).files);
      const none = tracked.length === 0;
      const disabledIfNone = none ? '(nothing generated yet)' : false;

      const action = await select({
        message: 'What would you like to do?',
        choices: [
          { name: 'Browse / explore components', value: 'browse' },
          { name: 'Install components (guided)', value: 'install' },
          {
            name: `Status — drift report${none ? '' : ` (${tracked.length} tracked)`}`,
            value: 'status',
            disabled: disabledIfNone,
          },
          { name: 'Diff — preview regeneration', value: 'diff', disabled: disabledIfNone },
          { name: 'Update — regenerate tracked', value: 'update', disabled: disabledIfNone },
          { name: 'Remove — delete a component', value: 'remove', disabled: disabledIfNone },
          { name: 'Quit', value: 'quit' },
        ],
      });

      switch (action) {
        case 'browse':
          await browse(ctx);
          break;
        case 'install':
          await install(ctx, config);
          break;
        case 'status':
          await runStatus({ cwd: cwdArg });
          process.exitCode = 0; // don't let an in-session drift report taint the wizard's exit
          break;
        case 'diff': {
          const picks = await pickComponents(tracked, 'Diff which components?');
          if (picks.length) await runDiff(picks, { cwd: cwdArg });
          break;
        }
        case 'update': {
          const all = await confirm({ message: `Update all ${tracked.length} tracked components?`, default: true });
          const picks = all ? [] : await pickComponents(tracked, 'Update which components?');
          await runUpdate(picks, { cwd: cwdArg, yes: true });
          break;
        }
        case 'remove': {
          const picks = await pickComponents(tracked, 'Remove which components?');
          if (picks.length) await runRemove(picks, { cwd: cwdArg });
          break;
        }
        case 'quit':
          running = false;
          break;
      }

      if (running && action !== 'quit') {
        running = await confirm({ message: 'Back to the menu?', default: true });
      }
    }

    console.log(ansis.gray('\nDone.\n'));
  } catch (err: any) {
    // Ctrl-C / Esc inside a prompt: exit cleanly rather than as a command failure.
    if (err?.name === 'ExitPromptError') {
      console.log(ansis.gray('\nExited.\n'));
      return;
    }
    throw err;
  }
}
