import * as fs from 'node:fs';
import { readFile, writeFile, mkdir, rm, stat } from 'node:fs/promises';
import path from 'path';
import ansis from 'ansis';
import { readConfig } from '../../config/reader';
import { Framework } from '../../core/enums';
import { getPeerDependencies } from '../../registry/peer-deps';
import { pluginRegistry } from '../../plugins/registry';
import { loadHashes, hashContent } from '../../scaffold/writer';
import { pathExists, readJson } from '../../utils/fs';

interface DoctorResult {
  config: boolean;
  tailwind: boolean;
  outputDir: boolean;
  peerDeps: boolean;
  typescript: boolean;
  tokens: boolean;
  componentsSync: boolean;
  hashIntegrity: boolean;
}

interface CircularRef {
  token: string;
  path: string[];
}

export function extractVarRefs(value: string): string[] {
  const refs: string[] = [];
  const regex = /var\(--([\w-]+)\)/g;
  let match;
  while ((match = regex.exec(value)) !== null) {
    refs.push(match[1]);
  }
  return refs;
}

export function detectCircularRefs(
  tokens: Record<string, string>,
  visited: Set<string> = new Set(),
  path: string[] = [],
): CircularRef[] {
  const circularRefs: CircularRef[] = [];

  for (const [key, value] of Object.entries(tokens)) {
    if (visited.has(key)) continue;

    const refs = extractVarRefs(value);
    if (refs.length === 0) continue;

    const localVisited = new Set(visited);
    localVisited.add(key);
    const localPath = [...path, key];

    for (const ref of refs) {
      const refKey = ref.startsWith('color-') ? ref.replace('color-', '') : ref;

      if (localVisited.has(refKey)) {
        circularRefs.push({
          token: key,
          path: [...localPath, refKey],
        });
      } else if (tokens[refKey]) {
        const subRefs = detectCircularRefs(
          { [refKey]: tokens[refKey], ...tokens },
          localVisited,
          localPath,
        );
        circularRefs.push(...subRefs);
      }
    }
  }

  return circularRefs;
}

export async function runDoctor(opts: { cwd?: string } = {}) {
  const cwd = opts.cwd || process.cwd();
  console.log(ansis.cyan(`\n⚗  Crucible Doctor — Checking setup in ${cwd}\n`));

  const result: DoctorResult = {
    config: false,
    tailwind: false,
    outputDir: false,
    peerDeps: true,
    typescript: true,
    tokens: true,
    componentsSync: true,
    hashIntegrity: true,
  };

  const configPathRelative = path.relative(process.cwd(), path.join(cwd, 'crucible.config.json'));
  const configPathAbsolute = path.join(cwd, 'crucible.config.json');
  let config;
  let configContent = '';

  // 1. Check Config
  try {
    configContent = await readFile(configPathAbsolute, 'utf-8');
    config = await readConfig(configPathRelative);
    console.log(ansis.green('✔ Config file loaded and validated successfully.'));
    result.config = true;
  } catch (error: any) {
    console.log(ansis.red(`✗ Config Error: ${error.message}`));
    console.log(ansis.yellow('\nRun `crucible init` to create a valid configuration file.'));
    return;
  }

  // 2. Check Tailwind Setup (if applicable)
  if (config?.styleSystem === StyleSystem.Tailwind) {
    try {
      const packageJsonPath = path.join(cwd, 'package.json');
      if (await pathExists(packageJsonPath)) {
        const pkg = await readJson(packageJsonPath);
        const hasTailwindDeps = pkg.dependencies?.tailwindcss || pkg.devDependencies?.tailwindcss;

        let hasTailwindImport = false;
        const cssFiles = [
          'src/index.css',
          'src/App.css',
          'src/globals.css',
          'src/styles.css',
          'app/globals.css',
          'styles/globals.css',
        ];

        for (const file of cssFiles) {
          const fullPath = path.join(cwd, file);
          if (await pathExists(fullPath)) {
            const content = await readFile(fullPath, 'utf-8');
            if (content.includes('@import "tailwindcss"') || content.includes('@tailwind base')) {
              hasTailwindImport = true;
              break;
            }
          }
        }

        if (hasTailwindDeps && hasTailwindImport) {
          console.log(ansis.green('✔ Tailwind CSS configuration appears intact.'));
          result.tailwind = true;
        } else {
          console.log(ansis.red('✗ Tailwind CSS configuration is incomplete or missing.'));
          if (!hasTailwindDeps)
            console.log(ansis.gray('  - Missing tailwindcss dependency in package.json'));
          if (!hasTailwindImport)
            console.log(ansis.gray('  - Missing @import "tailwindcss" in global CSS'));
        }
      } else {
        console.log(ansis.yellow('⚠ Could not find package.json to verify Tailwind setup.'));
      }
    } catch (e: any) {
      console.log(ansis.red(`✗ Error checking Tailwind: ${e.message}`));
    }
  } else {
    console.log(ansis.gray('— Tailwind check skipped (not using Tailwind style system).'));
    result.tailwind = true;
  }

  // 3. Check Output Directory permissions
  try {
    const outDir = path.join(cwd, config?.flags?.outputDir ?? 'src/components');
    await mkdir(outDir, { recursive: true });
    const testFile = path.join(outDir, '.crucible-test-write');
    await writeFile(testFile, '');
    await rm(testFile, { force: true });
    console.log(
      ansis.green(
        `✔ Output directory (${config?.flags?.outputDir ?? 'src/components'}) is writable.`,
      ),
    );
    result.outputDir = true;
  } catch (e: any) {
    console.log(
      ansis.red(`✗ Output Directory Error: Cannot write to output directory. ${e.message}`),
    );
  }

  // 4. Check Peer Dependencies
  try {
    const packageJsonPath = path.join(cwd, 'package.json');
    if (await pathExists(packageJsonPath)) {
      const pkg = await readJson(packageJsonPath);
      const installedDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };

      const framework = config?.framework as Framework;
      const missingDeps: string[] = [];

      for (const component of pluginRegistry.getAllComponentIds()) {
        const frameworkDeps = getPeerDependencies(component, framework);
        for (const dep of frameworkDeps) {
          if (!installedDeps[dep]) {
            missingDeps.push(`${dep} (for ${component})`);
          }
        }
      }

      if (missingDeps.length === 0) {
        console.log(ansis.green('✔ All peer dependencies are installed.'));
      } else {
        console.log(ansis.yellow('⚠ Missing peer dependencies (needed for full functionality):'));
        for (const dep of missingDeps) {
          console.log(ansis.gray(`  - ${dep}`));
        }
        result.peerDeps = false;
      }
    }
  } catch (e: any) {
    console.log(ansis.yellow(`⚠ Could not check peer dependencies: ${e.message}`));
  }

  // 5. Check TypeScript Configuration
  try {
    const tsconfigPath = path.join(cwd, 'tsconfig.json');
    if (await pathExists(tsconfigPath)) {
      const tsconfig = await readJson(tsconfigPath);
      const issues: string[] = [];

      if (config?.framework === Framework.React) {
        const jsx = tsconfig.compilerOptions?.jsx;
        if (!jsx || (jsx !== 'react-jsx' && jsx !== 'react')) {
          issues.push('jsx should be "react-jsx" or "react" for React components');
        }
      }

      if (config?.framework === Framework.Angular) {
        if (!tsconfig.compilerOptions?.experimentalDecorators) {
          issues.push('experimentalDecorators should be true for Angular components');
        }
        if (!tsconfig.compilerOptions?.emitDecoratorMetadata) {
          issues.push('emitDecoratorMetadata should be true for Angular DI');
        }
      }

      if (issues.length === 0) {
        console.log(ansis.green('✔ TypeScript configuration looks compatible.'));
      } else {
        console.log(ansis.yellow('⚠ TypeScript configuration may cause issues:'));
        for (const issue of issues) {
          console.log(ansis.gray(`  - ${issue}`));
        }
        result.typescript = false;
      }
    } else {
      console.log(ansis.gray('— TypeScript config check skipped (no tsconfig.json found).'));
    }
  } catch (e: any) {
    console.log(ansis.yellow(`⚠ Could not check TypeScript configuration: ${e.message}`));
  }

  // 6. Check for Circular Token References
  try {
    if (config?.tokens?.color) {
      const circularRefs = detectCircularRefs(config.tokens.color);

      if (circularRefs.length === 0) {
        console.log(ansis.green('✔ No circular references detected in custom tokens.'));
      } else {
        console.log(
          ansis.yellow(
            '⚠ Circular references detected in custom tokens (will resolve to undefined):',
          ),
        );
        for (const ref of circularRefs) {
          console.log(ansis.gray(`  - ${ref.path.join(' → ')}`));
        }
        result.tokens = false;
      }
    } else {
      console.log(ansis.gray('— Token check skipped (using preset tokens only).'));
    }
  } catch (e: any) {
    console.log(ansis.yellow(`⚠ Could not check token references: ${e.message}`));
  }

  // 7. Check Components Sync State
  try {
    const manifest = await loadHashes(cwd);
    let pkgVersion = '1.0.0';
    try {
      const pkg = await readJson(path.join(__dirname, '../../../package.json'));
      pkgVersion = pkg.version || '1.0.0';
    } catch {}

    const currentConfigHash = hashContent(configContent);
    const configStale = manifest.configHash && currentConfigHash !== manifest.configHash;
    const engineStale = manifest.engineVersion && manifest.engineVersion !== pkgVersion;

    if (Object.keys(manifest.files).length === 0) {
      console.log(ansis.gray('— Sync state check skipped (no generated components found).'));
    } else {
      const outDir = path.join(cwd, config?.flags?.outputDir ?? 'src/components');
      const componentsOnDisk = new Set<string>();

      for (const [hashKey, fileMeta] of Object.entries(manifest.files)) {
        const compName = hashKey.split('/')[0];
        const filePath = path.join(outDir, hashKey);
        if (await pathExists(filePath)) {
          componentsOnDisk.add(compName);
        }
      }

      if (componentsOnDisk.size > 0) {
        if (configStale || engineStale) {
          result.componentsSync = false;
          console.log(ansis.yellow(`⚠ Some components are out of sync:`));
          const compArray = Array.from(componentsOnDisk);
          if (configStale) {
            console.log(
              ansis.gray(
                `  - Config drifted. Regenerate with: npx crucible add ${compArray.join(' ')} --force`,
              ),
            );
          }
          if (engineStale) {
            console.log(
              ansis.gray(
                `  - Engine updated (${manifest.engineVersion} -> ${pkgVersion}). Regenerate with: npx crucible add ${compArray.join(' ')} --force`,
              ),
            );
          }
        } else {
          console.log(
            ansis.green('✔ All generated components are up to date with config and engine.'),
          );
        }
      } else {
        console.log(ansis.gray('— Sync state check skipped (no generated files exist on disk).'));
      }
    }
  } catch (e: any) {
    console.log(ansis.yellow(`⚠ Could not verify component sync state: ${e.message}`));
  }

  // 8. Check Hash Integrity
  try {
    const manifest = await loadHashes(cwd);
    const outDir = path.join(cwd, config?.flags?.outputDir ?? 'src/components');

    if (Object.keys(manifest.files).length === 0) {
      console.log(ansis.gray('— Hash integrity check skipped (no generated components found).'));
    } else {
      const compromisedFiles: string[] = [];

      for (const [hashKey, fileMeta] of Object.entries(manifest.files)) {
        const filePath = path.join(outDir, hashKey);
        if (await pathExists(filePath)) {
          const currentContent = await readFile(filePath, 'utf-8');
          const currentHash = hashContent(currentContent);
          if (currentHash !== fileMeta.contentHash) {
            compromisedFiles.push(hashKey);
          }
        }
      }

      if (compromisedFiles.length > 0) {
        result.hashIntegrity = false;
        console.log(
          ansis.yellow(
            `⚠ Hash integrity compromised (${compromisedFiles.length} file(s) modified externally):`,
          ),
        );
        for (const file of compromisedFiles.slice(0, 10)) {
          console.log(ansis.gray(`  - ${file}`));
        }
        if (compromisedFiles.length > 10) {
          console.log(ansis.gray(`  ... and ${compromisedFiles.length - 10} more`));
        }
        const uniqueComps = [...new Set(compromisedFiles.map((f) => f.split('/')[0]))];
        console.log(
          ansis.gray(
            `  Run with --force to sync: npx crucible add ${uniqueComps.join(' ')} --force`,
          ),
        );
      } else {
        console.log(ansis.green('✔ All generated files have valid hash integrity.'));
      }
    }
  } catch (e: any) {
    console.log(ansis.yellow(`⚠ Could not verify hash integrity: ${e.message}`));
  }

  console.log('\n');
  const allPassed = Object.values(result).every(Boolean);
  if (allPassed) {
    console.log(ansis.green.bold('All checks passed! Your Crucible setup is ready to go. 🚀'));
  } else {
    console.log(ansis.yellow.bold('Some checks need attention. Review the warnings above.'));
  }
}
