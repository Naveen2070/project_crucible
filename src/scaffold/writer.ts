import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import chalk from 'chalk';

const HASH_FILE = '.crucible-hashes.json';

function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 12);
}

async function loadHashes(): Promise<Record<string, string>> {
  try {
    return await fs.readJson(HASH_FILE);
  } catch {
    return {};
  }
}

async function saveHashes(hashes: Record<string, string>): Promise<void> {
  await fs.writeJson(HASH_FILE, hashes, { spaces: 2 });
}

export async function writeFiles(
  files: Record<string, string>,
  outputDir: string,
  opts: { force?: boolean } = {},
): Promise<void> {
  await fs.ensureDir(outputDir);
  const hashes = await loadHashes();

  for (const [filename, content] of Object.entries(files)) {
    const outPath = path.join(outputDir, filename);
    const newHash = hashContent(content);

    if ((await fs.pathExists(outPath)) && !opts.force) {
      const currentContent = await fs.readFile(outPath, 'utf-8');
      const currentHash = hashContent(currentContent);
      const storedHash = hashes[filename];

      if (storedHash && currentHash !== storedHash) {
        console.log(chalk.yellow(`⚠  ${filename} has been modified. Use --force to overwrite.`));
        continue;
      }
    }

    await fs.writeFile(outPath, content, 'utf-8');
    hashes[filename] = newHash;
    console.log(chalk.green(`✓  ${filename}`));
  }

  await saveHashes(hashes);
}
