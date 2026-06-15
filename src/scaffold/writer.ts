import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import path from 'path';
import crypto from 'crypto';
import ansis from 'ansis';
import * as prettier from 'prettier';
import { pathExists } from '../utils/fs';
import { getEngineVersion } from '../components/model';

export const HASH_FILE = '.crucible/manifest.json';
export const LEGACY_HASH_FILE = '.crucible-hashes.json';

// Resolved Prettier config, cached per cwd. Keyed by cwd (rather than a single process-global)
// so callers that generate into different directories in one process — e.g. the TUI — don't
// reuse a stale config. `undefined` = not yet resolved; `null` = resolved, no config found.
const prettierConfigCache = new Map<string, prettier.Config | null>();

export interface FileHashMeta {
  contentHash: string;
  generatedAt: string;
}

export interface Manifest {
  engineVersion: string;
  configHash: string;
  generatedAt: string;
  files: Record<string, FileHashMeta>;
}

export function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 12);
}

/**
 * Format generated content with Prettier exactly as `writeFiles` does (config cached per cwd),
 * so callers like `diff` compare against the same bytes that would be written. Returns the input
 * unchanged if Prettier can't format it.
 */
export async function formatFile(content: string, filepath: string, cwd: string): Promise<string> {
  let prettierConfig = prettierConfigCache.get(cwd);
  if (prettierConfig === undefined) {
    prettierConfig = await prettier.resolveConfig(cwd);
    prettierConfigCache.set(cwd, prettierConfig);
  }
  try {
    return await prettier.format(content, { ...prettierConfig, filepath });
  } catch {
    return content;
  }
}

export async function loadHashes(cwd: string): Promise<Manifest> {
  const manifestPath = path.join(cwd, HASH_FILE);
  const legacyPath = path.join(cwd, LEGACY_HASH_FILE);

  try {
    if (await pathExists(manifestPath)) {
      const content = await readFile(manifestPath, 'utf-8');
      return JSON.parse(content);
    } else if (await pathExists(legacyPath)) {
      const legacyContent = await readFile(legacyPath, 'utf-8');
      const legacyHashes: Record<string, string> = JSON.parse(legacyContent);

      const files: Record<string, FileHashMeta> = {};
      const now = new Date().toISOString();
      for (const [key, hash] of Object.entries(legacyHashes)) {
        files[key] = {
          contentHash: hash,
          generatedAt: now,
        };
      }

      return {
        engineVersion: getEngineVersion(),
        configHash: '',
        generatedAt: now,
        files,
      };
    }
  } catch {
    // Ignore and return default
  }

  return {
    engineVersion: getEngineVersion(),
    configHash: '',
    generatedAt: new Date().toISOString(),
    files: {},
  };
}

export async function saveHashes(manifest: Manifest, cwd: string): Promise<void> {
  const manifestPath = path.join(cwd, HASH_FILE);
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
}

export interface WriteResult {
  component: string;
  /** hashKeys (`Component/file`) actually written (or, in dry-run, that would be written). */
  written: string[];
  /** hashKeys preserved because the file was user-edited and `--force` was not given. */
  skipped: string[];
}

export async function writeFiles(
  files: Record<string, string>,
  outputDir: string,
  componentName: string,
  opts: {
    force?: boolean;
    dryRun?: boolean;
    quiet?: boolean;
    cwd?: string;
    hashes?: Manifest;
  } = {},
): Promise<WriteResult> {
  const cwd = opts.cwd || process.cwd();
  const componentDir = path.join(outputDir, componentName);

  if (!opts.dryRun) {
    await mkdir(componentDir, { recursive: true });
  }

  const manifest = opts.hashes || (await loadHashes(cwd));

  let prettierConfig = prettierConfigCache.get(cwd);
  if (prettierConfig === undefined) {
    prettierConfig = await prettier.resolveConfig(cwd);
    prettierConfigCache.set(cwd, prettierConfig);
  }

  const now = new Date().toISOString();
  manifest.generatedAt = now;

  // When a shared manifest is passed in (multi-component generation), the caller has
  // already populated engineVersion + configHash once. Only compute them here on the
  // standalone path, to avoid re-reading package.json / config once per component.
  if (!opts.hashes) {
    manifest.engineVersion = getEngineVersion();

    // Try to get config hash
    try {
      const configPath = path.join(cwd, 'crucible.config.json');
      if (await pathExists(configPath)) {
        const configContent = await readFile(configPath, 'utf-8');
        manifest.configHash = hashContent(configContent);
      }
    } catch {
      // ignore
    }
  }

  const written: string[] = [];
  const skipped: string[] = [];

  await Promise.all(
    Object.entries(files).map(async ([filename, content]) => {
      const outPath = path.resolve(componentDir, filename);
      const hashKey = `${componentName}/${filename}`;

      // Security: Path Traversal Protection. Use path.relative so a sibling dir
      // sharing a string prefix (e.g. Card vs Card-evil) can't slip past a naive
      // startsWith check. Reject anything that escapes componentDir or is absolute.
      const rel = path.relative(path.resolve(componentDir), outPath);
      if (rel.startsWith('..') || path.isAbsolute(rel)) {
        throw new Error(`Security breach: Attempted path traversal to ${outPath}`);
      }

      // Format content with Prettier if possible
      let formattedContent = content;
      try {
        formattedContent = await prettier.format(content, {
          ...prettierConfig,
          filepath: outPath,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (!opts.quiet)
          console.warn(
            ansis.yellow(`⚠  Could not format ${hashKey} with Prettier: ${errorMessage}`),
          );
      }

      const newHash = hashContent(formattedContent);

      if ((await pathExists(outPath)) && !opts.force) {
        const currentContent = await readFile(outPath, 'utf-8');
        const currentHash = hashContent(currentContent);
        const storedFileMeta = manifest.files[hashKey];

        if (storedFileMeta && currentHash !== storedFileMeta.contentHash) {
          if (!opts.quiet) {
            console.log(
              ansis.yellow(`⚠  User edits detected in ${hashKey}. Your changes are preserved.`),
            );
            console.log(
              ansis.yellow(`   Use --force to overwrite, or manually merge your changes.`),
            );
          }
          skipped.push(hashKey);
          return;
        }
      }

      if (opts.dryRun) {
        if (!opts.quiet) console.log(ansis.green(`~  ${hashKey} (would be written)`));
        written.push(hashKey);
        return;
      }

      await writeFile(outPath, formattedContent, 'utf-8');
      manifest.files[hashKey] = {
        contentHash: newHash,
        generatedAt: now,
      };
      if (!opts.quiet) console.log(ansis.green(`✓  ${hashKey}`));
      written.push(hashKey);
    }),
  );

  // If hashes were NOT provided in opts, we are responsible for saving them
  if (!opts.hashes && !opts.dryRun) {
    await saveHashes(manifest, cwd);
  }

  return { component: componentName, written, skipped };
}
