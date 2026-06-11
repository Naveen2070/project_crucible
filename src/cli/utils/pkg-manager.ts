import { existsSync } from 'node:fs';
import path from 'path';

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

/**
 * Detect the package manager a project uses from its lockfile. Falls back to npm.
 */
export function detectPackageManager(cwd: string): PackageManager {
  if (existsSync(path.join(cwd, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(path.join(cwd, 'yarn.lock'))) return 'yarn';
  if (existsSync(path.join(cwd, 'bun.lockb')) || existsSync(path.join(cwd, 'bun.lock'))) {
    return 'bun';
  }
  return 'npm';
}

/**
 * Build an install command for the given package manager. `legacyPeerDeps` only
 * applies to npm (the other managers resolve peers differently).
 */
export function buildInstallCommand(
  pm: PackageManager,
  packages: string[],
  opts: { dev?: boolean; legacyPeerDeps?: boolean } = {},
): string {
  const pkgs = packages.join(' ');
  switch (pm) {
    case 'pnpm':
      return `pnpm add${opts.dev ? ' -D' : ''} ${pkgs}`;
    case 'yarn':
      return `yarn add${opts.dev ? ' -D' : ''} ${pkgs}`;
    case 'bun':
      return `bun add${opts.dev ? ' -d' : ''} ${pkgs}`;
    case 'npm':
    default:
      return `npm install ${pkgs}${opts.legacyPeerDeps ? ' --legacy-peer-deps' : ''}`;
  }
}
