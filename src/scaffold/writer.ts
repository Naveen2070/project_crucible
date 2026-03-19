import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import chalk from 'chalk';
import * as prettier from 'prettier';

const HASH_FILE = '.crucible-hashes.json';

function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 12);
}

async function loadHashes(): Promise<Record<string, string>> {
  try {
    const content = await fs.readFile(HASH_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

async function saveHashes(hashes: Record<string, string>): Promise<void> {
  await fs.writeFile(HASH_FILE, JSON.stringify(hashes, null, 2), 'utf-8');
}

export async function writeFiles(
  files: Record<string, string>,
  outputDir: string,
  opts: { force?: boolean } = {},
): Promise<void> {
  await fs.ensureDir(outputDir);
  const hashes = await loadHashes();
  const prettierConfig = await prettier.resolveConfig(process.cwd());

  for (const [filename, content] of Object.entries(files)) {
    const outPath = path.join(outputDir, filename);

    // Format content with Prettier if possible
    let formattedContent = content;
    try {
      formattedContent = await prettier.format(content, {
        ...prettierConfig,
        filepath: outPath,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.warn(chalk.yellow(`⚠  Could not format ${filename} with Prettier: ${errorMessage}`));
    }

    const newHash = hashContent(formattedContent);

    if ((await fs.pathExists(outPath)) && !opts.force) {
      const currentContent = await fs.readFile(outPath, 'utf-8');
      const currentHash = hashContent(currentContent);
      const storedHash = hashes[filename];

      if (storedHash && currentHash !== storedHash) {
        console.log(chalk.yellow(`⚠  ${filename} has been modified. Use --force to overwrite.`));
        continue;
      }
    }

    await fs.writeFile(outPath, formattedContent, 'utf-8');
    hashes[filename] = newHash;
    console.log(chalk.green(`✓  ${filename}`));
  }

  await saveHashes(hashes);
}
