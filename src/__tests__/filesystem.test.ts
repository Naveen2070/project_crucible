import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFile, writeFile, access, mkdir, rm } from 'node:fs/promises';
import path from 'path';

const pathExists = (p: string) =>
  access(p).then(
    () => true,
    () => false,
  );
const readJson = (p: string) => readFile(p, 'utf-8').then(JSON.parse);
const writeJson = (p: string, data: unknown, opts?: { spaces?: number }) =>
  writeFile(p, JSON.stringify(data, null, opts?.spaces ?? 2));
const ensureDir = (p: string) => mkdir(p, { recursive: true });
const remove = (p: string) => rm(p, { recursive: true, force: true });
import { writeFiles, loadHashes } from '../scaffold/writer';

const TEST_DIR = path.join(__dirname, '../../.filesystem-test-temp');

describe('8. File-System Edge Cases', () => {
  beforeEach(async () => {
    await ensureDir(TEST_DIR);
  });

  afterEach(async () => {
    await remove(TEST_DIR);
  });

  it('8.4: does not delete unrelated files in output directory', async () => {
    const outputDir = path.join(TEST_DIR, 'components');
    await ensureDir(outputDir);
    await writeFile(path.join(outputDir, 'unrelated.txt'), 'unrelated content');
    await ensureDir(path.join(outputDir, 'Button'));

    const files = { 'Button.tsx': 'export const Button = () => {};' };
    await writeFiles(files, outputDir, 'Button', { cwd: TEST_DIR, quiet: true });

    const unrelatedExists = await pathExists(path.join(outputDir, 'unrelated.txt'));
    expect(unrelatedExists).toBe(true);
  });

  it('8.5: regenerates deleted file', async () => {
    const outputDir = path.join(TEST_DIR, 'components');
    const componentName = 'Button';

    const files = { 'Button.tsx': 'export const Button = () => {};' };
    await writeFiles(files, outputDir, componentName, { cwd: TEST_DIR, quiet: true });

    await remove(path.join(outputDir, componentName, 'Button.tsx'));

    await writeFiles(files, outputDir, componentName, { cwd: TEST_DIR, quiet: true });

    const fileExists = await pathExists(path.join(outputDir, componentName, 'Button.tsx'));
    expect(fileExists).toBe(true);
  });

  it('8.6: recovers when manifest is deleted', async () => {
    const outputDir = path.join(TEST_DIR, 'components');
    const componentName = 'Button';

    const files = { 'Button.tsx': 'export const Button = () => {};' };
    await writeFiles(files, outputDir, componentName, { cwd: TEST_DIR, quiet: true });

    const manifestPath = path.join(TEST_DIR, '.crucible/manifest.json');
    await remove(manifestPath);

    const hashes = await loadHashes(TEST_DIR);
    expect(hashes.files).toEqual({});

    await writeFiles(files, outputDir, componentName, { cwd: TEST_DIR, quiet: true, hashes });

    const fileExists = await pathExists(path.join(outputDir, componentName, 'Button.tsx'));
    expect(fileExists).toBe(true);
  });
});
