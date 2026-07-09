import path from 'path';
import ansis from 'ansis';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { checkbox, confirm } from '@inquirer/prompts';
import { readConfig } from '../../config/reader';
import { resolveTokens } from '../../tokens/resolver';
import { getTokensOutDir } from '../../tokens/output-path';
import { getEngineVersion } from '../../components/model';
import { cleanupWatchers } from '../../templates/engine';
import { generate } from '../../api/generate';
import { writeFiles, loadHashes, saveHashes, hashContent } from '../../scaffold/writer';
import { registry } from '../../registry/components';
import { pluginRegistry } from '../../plugins/registry';
import { checkAndSetupTailwind } from '../utils/tailwind';
import { checkReactNativeSetup } from '../utils/react-native';
import { Framework, StyleSystem } from '../../core/enums';
import { FRAMEWORK_STYLE_SYSTEMS } from '../../registry/frameworks';
import { installPeerDependenciesSmart } from '../utils/deps';
import { importTokensInIndexHtml } from '../../scaffold/html';
import { pathExists } from '../../utils/fs';
import { detectVueVersion, supportsVueUseId } from '../../utils/semver';
import { configVersionHint } from '../utils/config-version';

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function copyUtilsFiles(utils: string[], outDir: string, componentName: string) {
  if (!utils || utils.length === 0) return;

  const utilsDir = path.join(outDir, componentName, 'utils');
  await mkdir(utilsDir, { recursive: true });

  const templateUtilsDir = path.join(__dirname, '../../../templates/shared/utils');

  for (const util of utils) {
    const src = path.join(templateUtilsDir, `${util}.ts`);
    const dest = path.join(utilsDir, `${util}.ts`);

    if (existsSync(src)) {
      await copyFile(src, dest);
    }
  }
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
      choices: Object.keys(registry).map((name) => {
        const pluginId = pluginRegistry.getComponentPluginId(name) || 'core';
        return { name: `${ansis.gray(pluginId + '/')}${name}`, value: name };
      }),
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

    if (!opts.quiet) {
      const hint = configVersionHint(config.version, getEngineVersion());
      if (hint) console.warn(ansis.yellow(`⚠ ${hint}`));
    }

    // Override style system from CLI flag (accept any known style here; per-framework
    // validity is enforced below once the framework is resolved).
    if (opts.style) {
      if (Object.values(StyleSystem).includes(opts.style as StyleSystem)) {
        config.styleSystem = opts.style as StyleSystem;
        if (!opts.quiet)
          console.log(ansis.gray(`  Style system: ${config.styleSystem} (CLI override)`));
      } else {
        console.error(
          ansis.red(
            `✗ Invalid style system: ${opts.style}. Known: ${Object.values(StyleSystem).join(', ')}.`,
          ),
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
    // Honour the `--framework` override in the generated output (not just dependency checks):
    // `buildComponentModel` reads `config.framework`, so the resolved framework is applied here.
    config.framework = framework;

    // Per-framework style validity: web frameworks use css/tailwind/scss; react-native uses
    // nativewind/stylesheet. Reject a style that doesn't belong to the resolved framework.
    const validStyles = FRAMEWORK_STYLE_SYSTEMS[framework] ?? [];
    if (validStyles.length && !validStyles.includes(config.styleSystem as StyleSystem)) {
      console.error(
        ansis.red(
          `✗ Style "${config.styleSystem}" is not valid for framework "${framework}". ` +
            `Valid: ${validStyles.join(', ')}.`,
        ),
      );
      process.exit(1);
    }

    if (framework === Framework.Angular && !opts.quiet) {
      console.log(ansis.cyan('\nℹ Angular uses an idiomatic unified pattern.'));
      console.log(
        ansis.cyan('  Generating output that relies on native content projection (ng-content).\n'),
      );
    }

    // Vue ID strategy: useId() (Vue 3.5+) by default; deprecated fallback for older Vue.
    let vueUseId = true;
    if (config.framework === Framework.Vue) {
      const vueVersion = await detectVueVersion(cwd);
      vueUseId = supportsVueUseId(vueVersion);
      if (!vueUseId && !opts.quiet) {
        console.warn(
          ansis.yellow(
            `⚠ Detected Vue ${vueVersion} (<3.5). Generated components use a deprecated ID fallback.`,
          ),
        );
        console.warn(
          ansis.gray(`   useId() is the default — upgrade to Vue 3.5+ to use it.`),
        );
      }
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

    if (framework === Framework.ReactNative) {
      if (opts.verbose) console.log(ansis.blue(`Checking React Native setup...`));
      await checkReactNativeSetup(config.styleSystem, { yes: opts.yes, cwd });
    }

    const outDir = opts.dev
      ? path.join(cwd, 'src/__generated__')
      : path.join(cwd, config.flags?.outputDir ?? 'src/components');

    const generateStories =
      opts.stories !== undefined ? opts.stories : (config.flags?.stories ?? false);

    // Render everything in memory via the pure core: transitive dependency resolution,
    // component sources, and the global tokens.css source. No files are written here.
    const result = await generate({
      components: normalizedComponents,
      cwd,
      outDir,
      config,
      framework,
      generateStories,
      vueUseId,
    });

    if (result.peerDependencies.length > 0) {
      const installList = result.peerDependencies.join(' ');
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

    // Populate manifest metadata once (engineVersion + current configHash). The shared
    // `hashes` object is passed to every writeFiles call, so this avoids re-reading
    // package.json and crucible.config.json once per component.
    hashes.engineVersion = getEngineVersion();
    hashes.configHash = currentConfigHash;

    await mkdir(outDir, { recursive: true });

    const tokensOutDir = getTokensOutDir(cwd, framework);
    await mkdir(tokensOutDir, { recursive: true });
    const tokensFilename = result.tokens.filename;
    const tokensPath = path.join(tokensOutDir, tokensFilename);

    if (!(await pathExists(tokensPath)) || configChanged) {
      await writeFile(tokensPath, result.tokens.content);
      if (!opts.quiet) {
        console.log(
          ansis.gray(
            configChanged
              ? `  Updated ${tokensFilename} (config changed)`
              : `  Created ${tokensFilename}`,
          ),
        );
      }
    }

    // Import tokens.css into index.html
    await importTokensInIndexHtml(framework, cwd);

    const writeResults = await Promise.all(
      result.components.map(async ({ name: comp, files, usedUtils }) => {
        if (opts.verbose) console.log(ansis.blue(`Generating ${comp}...`));

        const writeResult = await writeFiles(files, outDir, comp, {
          force: opts.force,
          dryRun: opts.dryRun,
          quiet: opts.quiet,
          cwd,
          hashes,
        });

        if (usedUtils.length > 0) {
          await copyUtilsFiles(usedUtils, outDir, comp);
        }

        const storiesNote = generateStories ? ' + story' : '';
        const dryRunNote = opts.dryRun ? ansis.yellow(' (dry-run)') : '';
        const pluginId = pluginRegistry.getComponentPluginId(comp) || 'core';

        if (!opts.quiet) {
          console.log(
            ansis.cyan(
              `\n⚗  ${pluginId}/${comp}/ [${config.styleSystem}/${config.theme}${storiesNote}] → ${outDir}`,
            ) + dryRunNote,
          );
        }

        return writeResult;
      }),
    );

    // Aggregated summary: consolidate the per-file "user edits preserved" warnings into one
    // actionable block at the end (instead of leaving them scattered through the run).
    if (!opts.quiet) {
      const preserved = writeResults.flatMap((r) => r.skipped);
      const writtenCount = writeResults.reduce((n, r) => n + r.written.length, 0);
      if (preserved.length > 0) {
        const verb = opts.dryRun ? 'would be preserved' : 'preserved';
        console.log(
          ansis.yellow(
            `\n⚠  ${preserved.length} file(s) ${verb} (user-edited, not overwritten):`,
          ),
        );
        for (const f of preserved) console.log(ansis.gray(`   - ${f}`));
        console.log(
          ansis.gray(
            `   ${writtenCount} file(s) ${opts.dryRun ? 'would be written' : 'written'}. Re-run with --force to overwrite the preserved ones.`,
          ),
        );
      }
    }

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
