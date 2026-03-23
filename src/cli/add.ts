import path from 'path';
import chalk from 'chalk';
import fs from 'fs-extra';
import { checkbox, confirm } from '@inquirer/prompts';
import { readConfig } from '../config/reader';
import { resolveTokens } from '../tokens/resolver';
import { buildComponentModel } from '../components/model';
import { renderComponent, renderGlobalTokens, cleanupWatchers } from '../templates/engine';
import { writeFiles, loadHashes, saveHashes } from '../scaffold/writer';
import { registry } from '../registry/components';
import { checkAndSetupTailwind } from './tailwind';
import { Framework, StyleSystem } from '../core/enums';
import { checkComponentDependencies, formatDependencyMessage, getComponentDefinition, installPeerDependenciesSmart } from './deps';
import { importTokensInIndexHtml } from '../scaffold/html';

export async function runAdd(components: string[], opts: any) {
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

    const hashes = await loadHashes(cwd);

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
      await saveHashes(hashes, cwd);
    }
    await cleanupWatchers();
  } catch (err: any) {
    console.error(chalk.red(`✗ Error: ${err.message}`));
    await cleanupWatchers();
    process.exit(1);
  }
}