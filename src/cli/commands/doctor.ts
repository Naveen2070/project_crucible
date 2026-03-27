import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { readConfig } from '../../config/reader';
import { StyleSystem, Framework } from '../../core/enums';
import { PEER_DEPENDENCIES } from '../../registry/peer-deps';
import { loadHashes, hashContent } from '../../scaffold/writer';

interface DoctorResult {
  config: boolean;
  tailwind: boolean;
  outputDir: boolean;
  peerDeps: boolean;
  typescript: boolean;
  tokens: boolean;
  componentsSync: boolean;
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
  console.log(chalk.cyan(`\n⚗  Crucible Doctor — Checking setup in ${cwd}\n`));

  const result: DoctorResult = {
    config: false,
    tailwind: false,
    outputDir: false,
    peerDeps: true,
    typescript: true,
    tokens: true,
    componentsSync: true,
  };

  const configPathRelative = path.relative(process.cwd(), path.join(cwd, 'crucible.config.json'));
  const configPathAbsolute = path.join(cwd, 'crucible.config.json');
  let config;
  let configContent = '';

  // 1. Check Config
  try {
    configContent = await fs.readFile(configPathAbsolute, 'utf-8');
    config = await readConfig(configPathRelative);
    console.log(chalk.green('✔ Config file loaded and validated successfully.'));
    result.config = true;
  } catch (error: any) {
    console.log(chalk.red(`✗ Config Error: ${error.message}`));
    console.log(chalk.yellow('\nRun `crucible init` to create a valid configuration file.'));
    return;
  }

  // 2. Check Tailwind Setup (if applicable)
  if (config?.styleSystem === StyleSystem.Tailwind) {
    try {
      const packageJsonPath = path.join(cwd, 'package.json');
      if (await fs.pathExists(packageJsonPath)) {
        const pkg = await fs.readJson(packageJsonPath);
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
          if (await fs.pathExists(fullPath)) {
            const content = await fs.readFile(fullPath, 'utf-8');
            if (content.includes('@import "tailwindcss"') || content.includes('@tailwind base')) {
              hasTailwindImport = true;
              break;
            }
          }
        }

        if (hasTailwindDeps && hasTailwindImport) {
          console.log(chalk.green('✔ Tailwind CSS configuration appears intact.'));
          result.tailwind = true;
        } else {
          console.log(chalk.red('✗ Tailwind CSS configuration is incomplete or missing.'));
          if (!hasTailwindDeps)
            console.log(chalk.gray('  - Missing tailwindcss dependency in package.json'));
          if (!hasTailwindImport)
            console.log(chalk.gray('  - Missing @import "tailwindcss" in global CSS'));
        }
      } else {
        console.log(chalk.yellow('⚠ Could not find package.json to verify Tailwind setup.'));
      }
    } catch (e: any) {
      console.log(chalk.red(`✗ Error checking Tailwind: ${e.message}`));
    }
  } else {
    console.log(chalk.gray('— Tailwind check skipped (not using Tailwind style system).'));
    result.tailwind = true;
  }

  // 3. Check Output Directory permissions
  try {
    const outDir = path.join(cwd, config?.flags?.outputDir ?? 'src/components');
    await fs.ensureDir(outDir);
    const testFile = path.join(outDir, '.crucible-test-write');
    await fs.writeFile(testFile, '');
    await fs.remove(testFile);
    console.log(
      chalk.green(
        `✔ Output directory (${config?.flags?.outputDir ?? 'src/components'}) is writable.`,
      ),
    );
    result.outputDir = true;
  } catch (e: any) {
    console.log(
      chalk.red(`✗ Output Directory Error: Cannot write to output directory. ${e.message}`),
    );
  }

  // 4. Check Peer Dependencies
  try {
    const packageJsonPath = path.join(cwd, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const pkg = await fs.readJson(packageJsonPath);
      const installedDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };

      const framework = config?.framework as Framework;
      const missingDeps: string[] = [];

      for (const [component, deps] of Object.entries(PEER_DEPENDENCIES)) {
        const frameworkDeps = (deps as any)[framework] || [];
        for (const dep of frameworkDeps) {
          if (!installedDeps[dep]) {
            missingDeps.push(`${dep} (for ${component})`);
          }
        }
      }

      if (missingDeps.length === 0) {
        console.log(chalk.green('✔ All peer dependencies are installed.'));
      } else {
        console.log(chalk.yellow('⚠ Missing peer dependencies (needed for full functionality):'));
        for (const dep of missingDeps) {
          console.log(chalk.gray(`  - ${dep}`));
        }
        result.peerDeps = false;
      }
    }
  } catch (e: any) {
    console.log(chalk.yellow(`⚠ Could not check peer dependencies: ${e.message}`));
  }

  // 5. Check TypeScript Configuration
  try {
    const tsconfigPath = path.join(cwd, 'tsconfig.json');
    if (await fs.pathExists(tsconfigPath)) {
      const tsconfig = await fs.readJson(tsconfigPath);
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
        console.log(chalk.green('✔ TypeScript configuration looks compatible.'));
      } else {
        console.log(chalk.yellow('⚠ TypeScript configuration may cause issues:'));
        for (const issue of issues) {
          console.log(chalk.gray(`  - ${issue}`));
        }
        result.typescript = false;
      }
    } else {
      console.log(chalk.gray('— TypeScript config check skipped (no tsconfig.json found).'));
    }
  } catch (e: any) {
    console.log(chalk.yellow(`⚠ Could not check TypeScript configuration: ${e.message}`));
  }

  // 6. Check for Circular Token References
  try {
    if (config?.tokens?.color) {
      const circularRefs = detectCircularRefs(config.tokens.color);

      if (circularRefs.length === 0) {
        console.log(chalk.green('✔ No circular references detected in custom tokens.'));
      } else {
        console.log(
          chalk.yellow(
            '⚠ Circular references detected in custom tokens (will resolve to undefined):',
          ),
        );
        for (const ref of circularRefs) {
          console.log(chalk.gray(`  - ${ref.path.join(' → ')}`));
        }
        result.tokens = false;
      }
    } else {
      console.log(chalk.gray('— Token check skipped (using preset tokens only).'));
    }
  } catch (e: any) {
    console.log(chalk.yellow(`⚠ Could not check token references: ${e.message}`));
  }

  // 7. Check Components Sync State
  try {
    const manifest = await loadHashes(cwd);
    let pkgVersion = '1.0.0';
    try {
      const pkg = await fs.readJson(path.join(__dirname, '../../../package.json'));
      pkgVersion = pkg.version || '1.0.0';
    } catch {}

    const currentConfigHash = hashContent(configContent);
    const configStale = manifest.configHash && currentConfigHash !== manifest.configHash;
    const engineStale = manifest.engineVersion && manifest.engineVersion !== pkgVersion;

    if (Object.keys(manifest.files).length === 0) {
      console.log(chalk.gray('— Sync state check skipped (no generated components found).'));
    } else {
      const outDir = path.join(cwd, config?.flags?.outputDir ?? 'src/components');
      const componentsOnDisk = new Set<string>();

      for (const [hashKey, fileMeta] of Object.entries(manifest.files)) {
        const compName = hashKey.split('/')[0];
        const filePath = path.join(outDir, hashKey);
        if (await fs.pathExists(filePath)) {
          componentsOnDisk.add(compName);
        }
      }

      if (componentsOnDisk.size > 0) {
        if (configStale || engineStale) {
          result.componentsSync = false;
          console.log(chalk.yellow(`⚠ Some components are out of sync:`));
          const compArray = Array.from(componentsOnDisk);
          if (configStale) {
            console.log(chalk.gray(`  - Config drifted. Regenerate with: npx crucible add ${compArray.join(' ')} --force`));
          }
          if (engineStale) {
            console.log(chalk.gray(`  - Engine updated (${manifest.engineVersion} -> ${pkgVersion}). Regenerate with: npx crucible add ${compArray.join(' ')} --force`));
          }
        } else {
          console.log(chalk.green('✔ All generated components are up to date with config and engine.'));
        }
      } else {
        console.log(chalk.gray('— Sync state check skipped (no generated files exist on disk).'));
      }
    }
  } catch (e: any) {
    console.log(chalk.yellow(`⚠ Could not verify component sync state: ${e.message}`));
  }

  console.log('\n');
  const allPassed = Object.values(result).every(Boolean);
  if (allPassed) {
    console.log(chalk.green.bold('All checks passed! Your Crucible setup is ready to go. 🚀'));
  } else {
    console.log(chalk.yellow.bold('Some checks need attention. Review the warnings above.'));
  }
}
