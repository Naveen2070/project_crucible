import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import chalk from 'chalk';
import * as prettier from 'prettier';

const HASH_FILE = '.crucible-hashes.json';

function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 12);
}

async function loadHashes(hashFilePath: string): Promise<Record<string, string>> {
  try {
    const content = await fs.readFile(hashFilePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

async function saveHashes(hashes: Record<string, string>, hashFilePath: string): Promise<void> {
  await fs.writeFile(hashFilePath, JSON.stringify(hashes, null, 2), 'utf-8');
}

export async function writeFiles(
  files: Record<string, string>,
  outputDir: string,
  componentName: string,
  opts: { force?: boolean; dryRun?: boolean; quiet?: boolean; cwd?: string } = {},
): Promise<void> {
  const cwd = opts.cwd || process.cwd();
  const hashFilePath = path.join(cwd, HASH_FILE);
  const componentDir = path.join(outputDir, componentName);
  
  if (!opts.dryRun) {
    await fs.ensureDir(componentDir);
  }
  
  const hashes = await loadHashes(hashFilePath);
  const prettierConfig = await prettier.resolveConfig(cwd);

  for (const [filename, content] of Object.entries(files)) {
    const outPath = path.join(componentDir, filename);
    const hashKey = `${componentName}/${filename}`;

    // Format content with Prettier if possible
    let formattedContent = content;
    try {
      formattedContent = await prettier.format(content, {
        ...prettierConfig,
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
        continue;
      }
    }

    if (opts.dryRun) {
      if (!opts.quiet) console.log(chalk.green(`~  ${hashKey} (would be written)`));
      continue;
    }

    await fs.writeFile(outPath, formattedContent, 'utf-8');
    hashes[hashKey] = newHash;
    if (!opts.quiet) console.log(chalk.green(`✓  ${hashKey}`));
  }

  if (!opts.dryRun) {
    await saveHashes(hashes, hashFilePath);
  }
}
