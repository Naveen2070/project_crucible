import path from 'path';
import { pathExists, readJson } from './fs';

/**
 * Compare two `x.y.z` version strings.
 * Returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal. Missing parts are treated as 0.
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

/**
 * Coerce a semver range (e.g. `^3.5.0`, `>=3.4 || ^2.6.0`, `~3.2.47`) to a single
 * concrete `x.y.z` version, using the first comparator found. Returns null if no
 * numeric version can be extracted.
 */
export function coerceVersion(range: string | undefined | null): string | null {
  if (!range) return null;
  // Take the first alternative in an `||` union, then the first version-looking token.
  const first = range.split('||')[0];
  const match = first.match(/(\d+)\.(\d+)(?:\.(\d+))?/);
  if (!match) return null;
  const [, major, minor, patch] = match;
  return `${major}.${minor}.${patch ?? '0'}`;
}

/**
 * Detect the Vue version available in the consumer's project at generation time.
 * Prefers the actually-installed version (`node_modules/vue/package.json`), then
 * falls back to the declared range in the project's `package.json`. Returns null
 * if Vue cannot be located.
 */
export async function detectVueVersion(cwd: string): Promise<string | null> {
  // 1. Installed version (most accurate)
  const installed = path.join(cwd, 'node_modules', 'vue', 'package.json');
  if (await pathExists(installed)) {
    try {
      const pkg = await readJson(installed);
      const v = coerceVersion(pkg.version);
      if (v) return v;
    } catch {}
  }

  // 2. Declared range in the project's package.json
  const projectPkg = path.join(cwd, 'package.json');
  if (await pathExists(projectPkg)) {
    try {
      const pkg = await readJson(projectPkg);
      const range = pkg.dependencies?.vue ?? pkg.devDependencies?.vue ?? pkg.peerDependencies?.vue;
      const v = coerceVersion(range);
      if (v) return v;
    } catch {}
  }

  return null;
}

/**
 * Whether generated Vue code should use the native `useId()` composable (Vue 3.5+).
 * An undetectable version defaults to `true` (modern) — only a confirmed older Vue
 * opts into the deprecated `getCurrentInstance()` fallback.
 */
export function supportsVueUseId(version: string | null): boolean {
  return version == null || compareVersions(version, '3.5.0') >= 0;
}
