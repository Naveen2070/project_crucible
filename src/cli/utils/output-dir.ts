import { readFile } from 'node:fs/promises';
import path from 'path';
import { pathExists } from '../../utils/fs';

/**
 * Best-effort resolution of the configured component output directory (relative to cwd).
 * Defaults to `src/components` when there is no readable config — never throws, so read-only
 * commands (status/diff/remove) work even in a half-set-up project.
 */
export async function resolveOutputDir(cwd: string): Promise<string> {
  try {
    const configPath = path.join(cwd, 'crucible.config.json');
    if (await pathExists(configPath)) {
      const cfg = JSON.parse(await readFile(configPath, 'utf-8'));
      return cfg?.flags?.outputDir ?? 'src/components';
    }
  } catch {
    /* fall through to default */
  }
  return 'src/components';
}

/** Unique component names tracked in a manifest's `files` map (the segment before the first `/`). */
export function trackedComponents(files: Record<string, unknown>): string[] {
  return [...new Set(Object.keys(files).map((k) => k.split('/')[0]))];
}
