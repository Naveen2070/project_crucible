import path from 'node:path';
import { readJson } from '../../utils/fs';
import { compareVersions } from '../../utils/semver';

let cachedEngineVersion: string | null = null;

/** The running engine version, read once from the package manifest and cached. */
export async function getEngineVersion(): Promise<string> {
  if (cachedEngineVersion) return cachedEngineVersion;
  try {
    const pkg = await readJson(path.join(__dirname, '../../../package.json'));
    cachedEngineVersion = pkg.version || '0.0.0';
  } catch {
    cachedEngineVersion = '0.0.0';
  }
  return cachedEngineVersion!;
}

/**
 * Advisory hint when a project's `crucible.config.json` version predates the running engine.
 * Returns the hint string, or null when the config is current/newer/unset. Never mutates anything —
 * the migration is the user's call.
 */
export function configVersionHint(
  configVersion: string | undefined,
  engineVersion: string,
): string | null {
  if (!configVersion) return null;
  if (compareVersions(configVersion, engineVersion) < 0) {
    return (
      `config v${configVersion} is older than Crucible v${engineVersion} — ` +
      `review the CHANGELOG and re-run \`crucible init\` to refresh defaults.`
    );
  }
  return null;
}
