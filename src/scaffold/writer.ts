import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import chalk from 'chalk';
import * as prettier from 'prettier';

const HASH_FILE = '.crucible-hashes.json';
let cachedPrettierConfig: prettier.Config | null = null;

function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 12);
}

export async function loadHashes(hashFilePath: string): Promise<Record<string, string>> {
  try {
    const content = await fs.readFile(hashFilePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

export async function saveHashes(hashes: Record<string, string>, hashFilePath: string): Promise<void> {
  await fs.writeFile(hashFilePath, JSON.stringify(hashes, null, 2), 'utf-8');
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
    hashes?: Record<string, string>;
  } = {},
): Promise<void> {
  const cwd = opts.cwd || process.cwd();
  const componentDir = path.join(outputDir, componentName);
  
  if (!opts.dryRun) {
    await fs.ensureDir(componentDir);
  }
  
  const hashes = opts.hashes || await loadHashes(path.join(cwd, HASH_FILE));
  
  if (!cachedPrettierConfig) {
    cachedPrettierConfig = await prettier.resolveConfig(cwd);
  }

  await Promise.all(Object.entries(files).map(async ([filename, content]) => {
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
      if (!opts.quiet) console.warn(chalk.yellow(`⚠  Could not format ${hashKey} with Prettier: ${errorMessage}`));
    }

    const newHash = hashContent(formattedContent);

    if ((await fs.pathExists(outPath)) && !opts.force) {
      const currentContent = await fs.readFile(outPath, 'utf-8');
      const currentHash = hashContent(currentContent);
      const storedHash = hashes[hashKey];

      if (storedHash && currentHash !== storedHash) {
        if (!opts.quiet) console.log(chalk.yellow(`⚠  ${hashKey} has been modified. Use --force to overwrite.`));
        return;
      }
    }

    if (opts.dryRun) {
      if (!opts.quiet) console.log(chalk.green(`~  ${hashKey} (would be written)`));
      return;
    }

    await fs.writeFile(outPath, formattedContent, 'utf-8');
    hashes[hashKey] = newHash;
    if (!opts.quiet) console.log(chalk.green(`✓  ${hashKey}`));
  }));

  // If hashes were NOT provided in opts, we are responsible for saving them
  if (!opts.hashes && !opts.dryRun) {
    await saveHashes(hashes, path.join(cwd, HASH_FILE));
  }
}
