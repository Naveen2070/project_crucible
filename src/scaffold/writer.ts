import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import chalk from 'chalk';
import * as prettier from 'prettier';

export const HASH_FILE = '.crucible/manifest.json';
export const LEGACY_HASH_FILE = '.crucible-hashes.json';

let cachedPrettierConfig: prettier.Config | null = null;

export interface FileHashMeta {
  contentHash: string;
  templateHash?: string;
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

export async function loadHashes(cwd: string): Promise<Manifest> {
  const manifestPath = path.join(cwd, HASH_FILE);
  const legacyPath = path.join(cwd, LEGACY_HASH_FILE);

  try {
    if (await fs.pathExists(manifestPath)) {
      const content = await fs.readFile(manifestPath, 'utf-8');
      return JSON.parse(content);
    } else if (await fs.pathExists(legacyPath)) {
      // Migrate legacy hashes to manifest
      const legacyContent = await fs.readFile(legacyPath, 'utf-8');
      const legacyHashes: Record<string, string> = JSON.parse(legacyContent);

      const files: Record<string, FileHashMeta> = {};
      const now = new Date().toISOString();
      for (const [key, hash] of Object.entries(legacyHashes)) {
        files[key] = {
          contentHash: hash,
          generatedAt: now,
        };
      }

      let pkgVersion = '1.0.0';
      try {
        const pkg = await fs.readJson(path.join(__dirname, '../../package.json'));
        pkgVersion = pkg.version || '1.0.0';
      } catch {}

      return {
        engineVersion: pkgVersion,
        configHash: '',
        generatedAt: now,
        files,
      };
    }
  } catch {
    // Ignore and return default
  }

  let pkgVersion = '1.0.0';
  try {
    const pkg = await fs.readJson(path.join(__dirname, '../../package.json'));
    pkgVersion = pkg.version || '1.0.0';
  } catch {}

  return {
    engineVersion: pkgVersion,
    configHash: '',
    generatedAt: new Date().toISOString(),
    files: {},
  };
}

export async function saveHashes(manifest: Manifest, cwd: string): Promise<void> {
  const manifestPath = path.join(cwd, HASH_FILE);
  await fs.ensureDir(path.dirname(manifestPath));
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
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
): Promise<void> {
  const cwd = opts.cwd || process.cwd();
  const componentDir = path.join(outputDir, componentName);

  if (!opts.dryRun) {
    await fs.ensureDir(componentDir);
  }

  const manifest = opts.hashes || (await loadHashes(cwd));

  if (!cachedPrettierConfig) {
    cachedPrettierConfig = await prettier.resolveConfig(cwd);
  }

  const now = new Date().toISOString();
  manifest.generatedAt = now;

  let pkgVersion = '1.0.0';
  try {
    const pkg = await fs.readJson(path.join(__dirname, '../../package.json'));
    pkgVersion = pkg.version || '1.0.0';
  } catch {
    // ignore
  }
  manifest.engineVersion = pkgVersion;

  // Try to get config hash
  try {
    const configPath = path.join(cwd, 'crucible.config.json');
    if (await fs.pathExists(configPath)) {
      const configContent = await fs.readFile(configPath, 'utf-8');
      manifest.configHash = hashContent(configContent);
    }
  } catch {
    // ignore
  }

  await Promise.all(
    Object.entries(files).map(async ([filename, content]) => {
      const outPath = path.resolve(componentDir, filename);
      const hashKey = `${componentName}/${filename}`;

      // Security: Path Traversal Protection
      if (!outPath.startsWith(path.resolve(componentDir))) {
        throw new Error(`Security breach: Attempted path traversal to ${outPath}`);
      }

      // Format content with Prettier if possible
      let formattedContent = content;
      try {
        formattedContent = await prettier.format(content, {
          ...cachedPrettierConfig,
          filepath: outPath,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (!opts.quiet)
          console.warn(
            chalk.yellow(`⚠  Could not format ${hashKey} with Prettier: ${errorMessage}`),
          );
      }

      const newHash = hashContent(formattedContent);

      if ((await fs.pathExists(outPath)) && !opts.force) {
        const currentContent = await fs.readFile(outPath, 'utf-8');
        const currentHash = hashContent(currentContent);
        const storedFileMeta = manifest.files[hashKey];

        if (storedFileMeta && currentHash !== storedFileMeta.contentHash) {
          if (!opts.quiet) {
            console.log(
              chalk.yellow(`⚠  User edits detected in ${hashKey}. Your changes are preserved.`),
            );
            console.log(
              chalk.yellow(`   Use --force to overwrite, or manually merge your changes.`),
            );
          }
          return;
        }
      }

      if (opts.dryRun) {
        if (!opts.quiet) console.log(chalk.green(`~  ${hashKey} (would be written)`));
        return;
      }

      await fs.writeFile(outPath, formattedContent, 'utf-8');
      manifest.files[hashKey] = {
        contentHash: newHash,
        generatedAt: now,
      };
      if (!opts.quiet) console.log(chalk.green(`✓  ${hashKey}`));
    }),
  );

  // If hashes were NOT provided in opts, we are responsible for saving them
  if (!opts.hashes && !opts.dryRun) {
    await saveHashes(manifest, cwd);
  }
}
