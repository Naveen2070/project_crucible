import path from 'path';
import ansis from 'ansis';
import { confirm } from '@inquirer/prompts';
import { execSync } from 'child_process';
import { pathExists, readJson } from '../../utils/fs';
import { detectPackageManager, buildInstallCommand } from './pkg-manager';
import { StyleSystem } from '../../core/enums';

/**
 * Before generating React Native output, make sure the consumer project actually has the
 * runtime it targets. `react-native` is always required; the `nativewind` style additionally
 * needs `nativewind` + `tailwindcss` (NativeWind's own peer). Expo is common but not required —
 * bare RN CLI projects are just as valid, so it isn't checked for.
 *
 * Unlike `checkAndSetupTailwind` (which also rewrites a CSS file), this only offers to install
 * packages — babel/metro/tailwind.config.js wiring is too project-shape-specific (Expo vs bare RN,
 * existing babel plugins, …) to safely auto-edit, so we print the doc link instead.
 */
export async function checkReactNativeSetup(
  styleSystem: string,
  opts: { yes?: boolean; cwd?: string } = {},
): Promise<void> {
  const cwd = opts.cwd || process.cwd();
  const packageJsonPath = path.join(cwd, 'package.json');
  if (!(await pathExists(packageJsonPath))) return;

  const pkg = await readJson(packageJsonPath);
  const installed = { ...pkg.dependencies, ...pkg.devDependencies };

  const required = ['react-native'];
  if (styleSystem === StyleSystem.NativeWind) required.push('nativewind', 'tailwindcss');
  const missing = required.filter((dep) => !installed[dep]);
  if (missing.length === 0) return;

  console.log(
    ansis.yellow(
      `\n⚠ Missing React Native dependenc${missing.length > 1 ? 'ies' : 'y'}: ${missing.join(', ')}.`,
    ),
  );

  let proceed = !!opts.yes;
  if (!opts.yes) {
    proceed = await confirm({ message: `Install ${missing.join(', ')} now?`, default: true });
  }

  if (!proceed) {
    console.log(
      ansis.gray('Continuing without installing — generated components may not run until these are added.'),
    );
    return;
  }

  console.log(ansis.cyan(`Installing ${missing.join(', ')}...`));
  try {
    const pm = detectPackageManager(cwd);
    execSync(buildInstallCommand(pm, missing), { cwd, stdio: 'inherit' });
    console.log(ansis.green(`✔ Installed ${missing.join(', ')}.`));
  } catch (error: any) {
    console.error(ansis.red('✗ Failed to install automatically: ' + error.message));
  }

  if (missing.includes('nativewind')) {
    console.log(
      ansis.gray(
        '  NativeWind also needs a babel/metro config change and a tailwind.config.js that\n' +
          '  includes the generated preset — see https://www.nativewind.dev/getting-started/installation',
      ),
    );
  }
}
