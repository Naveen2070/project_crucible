import { Command } from 'commander';
import path from 'path';
import chalk from 'chalk';
import fs from 'fs-extra';
import { execSync } from 'child_process';
import { checkbox, confirm } from '@inquirer/prompts';
import { readConfig } from '../config/reader';
import { resolveTokens } from '../tokens/resolver';
import { buildComponentModel } from '../components/model';
import { renderComponent, renderGlobalTokens } from '../templates/engine';
import { writeFiles, loadHashes, saveHashes } from '../scaffold/writer';
import { registry } from '../registry/components';
import { runInit } from './init';
import { checkAndSetupTailwind } from './tailwind';
import { loadPreset } from '../themes';
import { Framework, StyleSystem, ThemePreset } from '../core/enums';
import { runDoctor } from './doctor';
import {
  checkComponentDependencies,
  formatDependencyMessage,
  getComponentDefinition,
} from './deps';

async function importTokensInIndexHtml(framework: string, cwd: string): Promise<void> {
  const indexPaths: Record<string, { index: string; href: string }> = {
    [Framework.React]: { index: 'index.html', href: './public/__generated__/tokens.css' },
    [Framework.Vue]: { index: 'index.html', href: './public/__generated__/tokens.css' },
    [Framework.Angular]: { index: 'src/index.html', href: './public/__generated__/tokens.css' },
  };

  const config = indexPaths[framework];
  if (!config) return;

  const indexPath = path.join(cwd, config.index);
  if (!(await fs.pathExists(indexPath))) return;

  let content = await fs.readFile(indexPath, 'utf-8');

  if (content.includes('public/__generated__/tokens.css')) {
    return;
  }

  if (content.includes('tokens.css')) {
    content = content.replace(/href="\.\/[^"]*tokens\.css"/, `href="${config.href}"`);
    await fs.writeFile(indexPath, content);
    console.log(chalk.gray(`  Updated tokens.css path in index.html`));
    return;
  }

  const linkTag = `\n  <link rel="stylesheet" href="${config.href}">\n`;
  content = content.replace('</head>', `${linkTag}</head>`);
  await fs.writeFile(indexPath, content);
  console.log(chalk.gray(`  Added tokens.css to index.html`));
}

async function installPeerDependenciesSmart(
  framework: string,
  components: string[],
  cwd: string,
): Promise<void> {
  const pkgPath = path.join(cwd, 'package.json');
  if (!(await fs.pathExists(pkgPath))) return;

  const pkg = await fs.readJson(pkgPath);
  const installed = { ...pkg.dependencies, ...pkg.devDependencies };

  const toInstall: string[] = [];
  for (const comp of components) {
    const check = await checkComponentDependencies(comp, cwd, framework as Framework);
    for (const dep of check.missingPeerDeps) {
      if (!installed[dep]) {
        toInstall.push(dep);
      }
    }
  }

  if (toInstall.length > 0) {
    const unique = [...new Set(toInstall)];
    const legacyFlag = framework === Framework.Angular ? '--legacy-peer-deps' : '';
    console.log(chalk.cyan(`📦 Installing: ${unique.join(', ')}`));
    try {
      execSync(`npm install ${unique.join(' ')} ${legacyFlag}`.trim(), {
        cwd,
        stdio: 'inherit',
      });
    } catch {
      console.warn(chalk.yellow(`⚠ Failed to install: ${unique.join(', ')}`));
    }
  }
}

const program = new Command();

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
        ? path.join(cwd, 'src/__generated__')
        : path.join(cwd, config.flags?.outputDir ?? 'src/components');

      // Dependency resolution using registry
      const resolvedComponents = new Set<string>(componentsToAdd);
      const allPeerDeps: string[] = [];

      for (const comp of componentsToAdd) {
        const def = getComponentDefinition(comp);

        // Check component dependencies (e.g., Modal needs Button)
        if (def?.dependencies) {
          for (const dep of def.dependencies) {
            const exists = await checkComponentDependencies(dep, outDir, framework);
            if (exists.missingComponents.includes(dep) && !resolvedComponents.has(dep)) {
              resolvedComponents.add(dep);
              if (!opts.quiet) {
                console.log(formatDependencyMessage(comp, [dep]));
              }
            }
          }
        }

        // Check peer dependencies (e.g., Modal needs focus-trap-react)
        const check = await checkComponentDependencies(comp, outDir, framework);
        if (check.missingPeerDeps.length > 0) {
          for (const peerDep of check.missingPeerDeps) {
            if (!allPeerDeps.includes(peerDep)) {
              allPeerDeps.push(peerDep);
            }
          }
        }
      }

      if (allPeerDeps.length > 0) {
        const installList = allPeerDeps.join(' ');
        let shouldInstall = opts.yes;
        if (!shouldInstall) {
          shouldInstall = await confirm({
            message: `These peer dependencies are required: "${installList}". Install them?`,
            default: true,
          });
        }
        if (shouldInstall) {
          await installPeerDependenciesSmart(framework, componentsToAdd, cwd);
        }
      }

      const generateStories =
        opts.stories !== undefined ? opts.stories : (config.flags?.stories ?? false);

      const hashes = await loadHashes(path.join(cwd, '.crucible-hashes.json'));

      await fs.ensureDir(outDir);

      const tokensOutDir = path.join(cwd, 'public/__generated__');
      await fs.ensureDir(tokensOutDir);
      const tokensPath = path.join(tokensOutDir, 'tokens.css');

      if (!(await fs.pathExists(tokensPath))) {
        const model = buildComponentModel('Button', tokens, config, generateStories);
        const tokensContent = await renderGlobalTokens(model);
        await fs.writeFile(tokensPath, tokensContent);
        if (!opts.quiet) {
          console.log(chalk.gray(`  Created tokens.css`));
        }
      }

      // Import tokens.css into index.html
      await importTokensInIndexHtml(framework, cwd);

      await Promise.all(
        Array.from(resolvedComponents).map(async (comp) => {
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
        }),
      );

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

async function runPlaygroundGenerate(opts: { framework?: string; stories?: boolean }) {
  const { execSync } = await import('child_process');
  const framework = opts.framework || 'all';
  const storiesFlag = opts.stories !== false ? '--stories' : '--no-stories';
  execSync(`npx tsx scripts/generate-playground.ts ${framework} ${storiesFlag}`, {
    cwd: process.cwd(),
    stdio: 'inherit',
  });
}

async function runPlaygroundOpen(opts: { framework?: string }) {
  const { execSync } = await import('child_process');
  const framework = opts.framework || '';
  execSync(`npx tsx scripts/open-playground.ts open ${framework}`, {
    cwd: process.cwd(),
    stdio: 'inherit',
  });
}

async function runPlaygroundDev(opts: { framework?: string }) {
  const { execSync } = await import('child_process');
  const framework = opts.framework || '';
  execSync(`npx tsx scripts/open-playground.ts dev ${framework}`, {
    cwd: process.cwd(),
    stdio: 'inherit',
  });
}

program
  .command('pg:gen [framework]')
  .alias('pg')
  .description('Generate playground components for frameworks')
  .option('--stories', 'Include story files', true)
  .option('--no-stories', 'Exclude story files')
  .action(async (framework: string | undefined, opts: any) => {
    await runPlaygroundGenerate({ framework, stories: opts.stories });
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
