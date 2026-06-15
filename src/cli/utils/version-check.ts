import os from 'node:os';
import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import ansis from 'ansis';
import { compareVersions, coerceVersion } from '../../utils/semver';

const PKG = '@cruciblelab/crucible';
const CACHE_FILE = path.join(os.tmpdir(), 'crucible-update-check.json');
const TTL_MS = 12 * 60 * 60 * 1000; // 12h — at most one network check per half-day
const FETCH_TIMEOUT_MS = 1200; // never let the check noticeably delay a command

interface UpdateCache {
  checkedAt: number;
  latest: string | null;
}

async function readCache(): Promise<UpdateCache | null> {
  try {
    return JSON.parse(await readFile(CACHE_FILE, 'utf-8')) as UpdateCache;
  } catch {
    return null;
  }
}

async function writeCache(cache: UpdateCache): Promise<void> {
  try {
    await writeFile(CACHE_FILE, JSON.stringify(cache));
  } catch {
    /* best-effort cache; ignore write failures */
  }
}

async function fetchLatest(): Promise<string | null> {
  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(`https://registry.npmjs.org/${PKG}/latest`, { signal: ac.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as { version?: string };
    return coerceVersion(data.version) ?? data.version ?? null;
  } catch {
    return null;
  }
}

/**
 * Print a one-line "update available" banner (to stderr) if a newer version is published on npm.
 *
 * Best-effort and non-blocking by design: skipped on non-TTY (CI/pipes/eval), when the user opts out
 * (`--no-update-check` / `CRUCIBLE_NO_UPDATE_CHECK`), and bounded by a short fetch timeout + a 12h
 * cache so interactive use pays the network cost at most twice a day. Any failure is swallowed — the
 * notifier must never break or delay a real command in a meaningful way.
 */
export async function maybeNotifyUpdate(currentVersion: string): Promise<void> {
  try {
    if (process.env.CRUCIBLE_NO_UPDATE_CHECK) return;
    if (process.argv.includes('--no-update-check')) return;
    if (!process.stdout.isTTY) return;

    const now = Date.now();
    let latest: string | null = null;

    const cache = await readCache();
    if (cache && now - cache.checkedAt < TTL_MS) {
      latest = cache.latest;
    } else {
      latest = await fetchLatest();
      await writeCache({ checkedAt: now, latest });
    }

    if (!latest) return;
    if (compareVersions(latest, currentVersion) > 0) {
      console.error(
        ansis.yellow(`\n⚠  Update available: ${currentVersion} → ${latest}`) +
          ansis.gray(
            `\n   Run: npm i -g ${PKG}@latest` +
              `  (silence with --no-update-check or CRUCIBLE_NO_UPDATE_CHECK=1)\n`,
          ),
      );
    }
  } catch {
    /* never let the update notifier surface an error to the user */
  }
}
