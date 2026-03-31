import path from 'path';
import ansis from 'ansis';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { checkbox, confirm } from '@inquirer/prompts';
import { readConfig } from '../../config/reader';
import { resolveTokens } from '../../tokens/resolver';
import { buildComponentModel } from '../../components/model';
import { renderComponent, renderGlobalTokens, cleanupWatchers } from '../../templates/engine';
import { writeFiles, loadHashes, saveHashes, hashContent } from '../../scaffold/writer';
import { registry } from '../../registry/components';
import { checkAndSetupTailwind } from '../utils/tailwind';
import { Framework, StyleSystem } from '../../core/enums';
import {
  checkComponentDependencies,
  formatDependencyMessage,
  getComponentDefinition,
  installPeerDependenciesSmart,
} from '../utils/deps';
import { importTokensInIndexHtml } from '../../scaffold/html';
import { pathExists } from '../../utils/fs';

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export async function runAdd(components: string[], opts: any) {
  const cwd = path.resolve(process.cwd(), opts.cwd);
  const inputComponents = components || [];
  let normalizedComponents = inputComponents.map((c) => capitalizeFirst(c));

  // Handle --all flag
  if (opts.all) {
    normalizedComponents = Object.keys(registry);
  }

  if (normalizedComponents.length > 0) {
    for (const comp of normalizedComponents) {
      if (!registry[comp as keyof typeof registry]) {
        console.error(ansis.red(`✗ Unknown component: ${comp}`));
        if (!opts.quiet) console.log(`Available: ${Object.keys(registry).join(', ')}`);
        process.exit(1);
      }
    }
  } else {
    if (opts.yes) {
      console.error(ansis.red(`✗ Cannot use --yes without specifying components to add.`));
      process.exit(1);
    }
    const answers = await checkbox({
      message: 'Select components to scaffold:',
      choices: Object.keys(registry).map((name) => ({ name, value: name })),
    });
    if (answers.length === 0) {
      if (!opts.quiet) console.log(ansis.gray('No components selected.'));
      return;
    }
    normalizedComponents = answers;
  }

  try {
    if (opts.verbose) console.log(ansis.blue(`Reading config from ${opts.config} in ${cwd}...`));

    const configPathRelative = path.relative(process.cwd(), path.resolve(cwd, opts.config));
    const config = await readConfig(configPathRelative);

    // Override style system from CLI flag
    if (opts.style) {
      const validStyles: StyleSystem[] = [StyleSystem.CSS, StyleSystem.Tailwind, StyleSystem.SCSS];
      if (validStyles.includes(opts.style as StyleSystem)) {
        config.styleSystem = opts.style as StyleSystem;
        if (!opts.quiet)
          console.log(ansis.gray(`  Style system: ${config.styleSystem} (CLI override)`));
      } else {
        console.error(
          ansis.red(`✗ Invalid style system: ${opts.style}. Use css, tailwind, or scss.`),
        );
        process.exit(1);
      }
    }

    // Override theme from CLI flag
    if (opts.theme) {
      const validThemes = ['minimal', 'soft'];
      if (validThemes.includes(opts.theme)) {
        config.theme = opts.theme;
        if (!opts.quiet) console.log(ansis.gray(`  Theme: ${config.theme} (CLI override)`));
      } else {
        console.error(ansis.red(`✗ Invalid theme: ${opts.theme}. Use minimal or soft.`));
        process.exit(1);
      }
    }

    const framework =
      opts.framework !== Framework.React ? opts.framework : config.framework || Framework.React;
    if (framework === Framework.Angular && !opts.quiet) {
      console.log(ansis.cyan('\nℹ Angular uses an idiomatic unified pattern.'));
      console.log(
        ansis.cyan('  Generating output that relies on native content projection (ng-content).\n'),
      );
    }

    // Pre-generation token validation (Linting pass)
    const tokens = resolveTokens(config);
    if (!tokens.cssVars['--color-primary'] && !opts.quiet) {
      console.warn(ansis.yellow('⚠ Warning: --color-primary is missing from tokens.'));
    }

    if (config.styleSystem === StyleSystem.Tailwind) {
      if (opts.verbose) console.log(ansis.blue(`Checking Tailwind setup...`));
      await checkAndSetupTailwind({ yes: opts.yes, cwd });
    }

    const outDir = opts.dev
      ? path.join(cwd, 'src/__generated__')
      : path.join(cwd, config.flags?.outputDir ?? 'src/components');

    // Dependency resolution using registry
    const resolvedComponents = new Set<string>(normalizedComponents);
    const allPeerDeps: string[] = [];

    for (const comp of normalizedComponents) {
      const def = getComponentDefinition(comp);

      // Check component dependencies (e.g., Dialog needs Button)
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

      // Check peer dependencies (e.g., Dialog needs focus-trap-react)
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
        await installPeerDependenciesSmart(framework, normalizedComponents, cwd);
      }
    }

    const generateStories =
      opts.stories !== undefined ? opts.stories : (config.flags?.stories ?? false);

    const hashes = await loadHashes(cwd);

    const configPath = path.join(cwd, 'crucible.config.json');
    const currentConfigHash = (await pathExists(configPath))
      ? hashContent(await readFile(configPath, 'utf-8'))
      : '';
    const configChanged = hashes.configHash && currentConfigHash !== hashes.configHash;

    if (configChanged && !opts.quiet) {
      console.warn(ansis.yellow(`⚠ Config file has changed since last generation.`));
      console.warn(
        ansis.yellow(`   Run with --force to regenerate all components with new config.`),
      );
    }

    await mkdir(outDir, { recursive: true });

    const tokensOutDir = path.join(cwd, 'public/__generated__');
    await mkdir(tokensOutDir, { recursive: true });
    const tokensPath = path.join(tokensOutDir, 'tokens.css');

    if (!(await pathExists(tokensPath)) || configChanged) {
      const model = buildComponentModel('Button', tokens, config, generateStories);
      const tokensContent = await renderGlobalTokens(model);
      await writeFile(tokensPath, tokensContent);
      if (!opts.quiet) {
        console.log(
          ansis.gray(
            configChanged ? `  Updated tokens.css (config changed)` : `  Created tokens.css`,
          ),
        );
      }
    }

    // Import tokens.css into index.html
    await importTokensInIndexHtml(framework, cwd);

    await Promise.all(
      Array.from(resolvedComponents).map(async (comp) => {
        if (opts.verbose) console.log(ansis.blue(`Generating ${comp}...`));
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
        const dryRunNote = opts.dryRun ? ansis.yellow(' (dry-run)') : '';

        if (!opts.quiet) {
          console.log(
            ansis.cyan(
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
    console.error(ansis.red(`✗ Error: ${err.message}`));
    await cleanupWatchers();
    process.exit(1);
  }
}
