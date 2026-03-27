import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { writeFiles, loadHashes } from '../scaffold/writer';

const TEST_DIR = path.join(__dirname, '../../.filesystem-test-temp');

describe('8. File-System Edge Cases', () => {
  beforeEach(async () => {
    await fs.ensureDir(TEST_DIR);
  });

  afterEach(async () => {
    await fs.remove(TEST_DIR);
  });

  it('8.4: does not delete unrelated files in output directory', async () => {
    const outputDir = path.join(TEST_DIR, 'components');
    await fs.ensureDir(outputDir);
    await fs.writeFile(path.join(outputDir, 'unrelated.txt'), 'unrelated content');
    await fs.ensureDir(path.join(outputDir, 'Button'));

    const files = { 'Button.tsx': 'export const Button = () => {};' };
    await writeFiles(files, outputDir, 'Button', { cwd: TEST_DIR, quiet: true });

    const unrelatedExists = await fs.pathExists(path.join(outputDir, 'unrelated.txt'));
    expect(unrelatedExists).toBe(true);
  });

  it('8.5: regenerates deleted file', async () => {
    const outputDir = path.join(TEST_DIR, 'components');
    const componentName = 'Button';

    const files = { 'Button.tsx': 'export const Button = () => {};' };
    await writeFiles(files, outputDir, componentName, { cwd: TEST_DIR, quiet: true });

    await fs.remove(path.join(outputDir, componentName, 'Button.tsx'));

    await writeFiles(files, outputDir, componentName, { cwd: TEST_DIR, quiet: true });

    const fileExists = await fs.pathExists(path.join(outputDir, componentName, 'Button.tsx'));
    expect(fileExists).toBe(true);
  });

  it('8.6: recovers when manifest is deleted', async () => {
    const outputDir = path.join(TEST_DIR, 'components');
    const componentName = 'Button';

    const files = { 'Button.tsx': 'export const Button = () => {};' };
    await writeFiles(files, outputDir, componentName, { cwd: TEST_DIR, quiet: true });

    const manifestPath = path.join(TEST_DIR, '.crucible/manifest.json');
    await fs.remove(manifestPath);

    const hashes = await loadHashes(TEST_DIR);
    expect(hashes.files).toEqual({});

    await writeFiles(files, outputDir, componentName, { cwd: TEST_DIR, quiet: true, hashes });

    const fileExists = await fs.pathExists(path.join(outputDir, componentName, 'Button.tsx'));
    expect(fileExists).toBe(true);
  });
});
