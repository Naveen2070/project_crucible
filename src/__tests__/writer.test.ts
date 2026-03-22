import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { loadHashes, saveHashes, writeFiles } from '../scaffold/writer';

const TEST_DIR = path.join(__dirname, '../../.writer-test-temp');

describe('loadHashes', () => {
  beforeEach(async () => {
    await fs.ensureDir(TEST_DIR);
  });

  afterEach(async () => {
    await fs.remove(TEST_DIR);
  });

  it('returns empty object when file does not exist', async () => {
    const result = await loadHashes(path.join(TEST_DIR, 'nonexistent.json'));
    expect(result).toEqual({});
  });

  it('returns parsed JSON when file exists', async () => {
    const filePath = path.join(TEST_DIR, 'hashes.json');
    await fs.writeJson(filePath, { key: 'hash123' });
    const result = await loadHashes(filePath);
    expect(result).toEqual({ key: 'hash123' });
  });

  it('returns empty object on parse error', async () => {
    const filePath = path.join(TEST_DIR, 'invalid.json');
    await fs.writeFile(filePath, 'invalid json');
    const result = await loadHashes(filePath);
    expect(result).toEqual({});
  });
});

describe('saveHashes', () => {
  beforeEach(async () => {
    await fs.ensureDir(TEST_DIR);
  });

  afterEach(async () => {
    await fs.remove(TEST_DIR);
  });

  it('writes JSON to file', async () => {
    const filePath = path.join(TEST_DIR, 'hashes.json');
    const hashes = { Button: 'abc123', Input: 'def456' };
    await saveHashes(hashes, filePath);
    const result = await fs.readJson(filePath);
    expect(result).toEqual(hashes);
  });
});

describe('writeFiles', () => {
  const outputDir = path.join(TEST_DIR, 'components');
  const componentName = 'Button';

  beforeEach(async () => {
    await fs.ensureDir(TEST_DIR);
  });

  afterEach(async () => {
    await fs.remove(TEST_DIR);
  });

  it('creates component directory', async () => {
    const files = { 'Button.tsx': 'export const Button = () => {};' };
    await writeFiles(files, outputDir, componentName, { cwd: TEST_DIR, quiet: true });
    const dirExists = await fs.pathExists(path.join(outputDir, componentName));
    expect(dirExists).toBe(true);
  });

  it('writes files with correct content', async () => {
    const content = 'export const Button = () => {};';
    const files = { 'Button.tsx': content };
    await writeFiles(files, outputDir, componentName, { cwd: TEST_DIR, quiet: true });
    const written = await fs.readFile(path.join(outputDir, 'Button', 'Button.tsx'), 'utf-8');
    expect(written).toContain(content);
  });

  it('does not write in dry-run mode', async () => {
    const files = { 'Button.tsx': 'export const Button = () => {};' };
    await writeFiles(files, outputDir, componentName, { cwd: TEST_DIR, dryRun: true, quiet: true });
    const fileExists = await fs.pathExists(path.join(outputDir, 'Button', 'Button.tsx'));
    expect(fileExists).toBe(false);
  });

  it('skips unmodified files when not forced', async () => {
    const content = 'export const Button = () => {};';
    const files = { 'Button.tsx': content };
    await writeFiles(files, outputDir, componentName, { cwd: TEST_DIR, quiet: true });

    const hashes = await loadHashes(path.join(TEST_DIR, '.crucible-hashes.json'));
    const originalHash = hashes['Button/Button.tsx'];

    await fs.writeFile(path.join(outputDir, 'Button', 'Button.tsx'), '// modified');
    await writeFiles(files, outputDir, componentName, { cwd: TEST_DIR, quiet: true });

    const currentContent = await fs.readFile(path.join(outputDir, 'Button', 'Button.tsx'), 'utf-8');
    expect(currentContent).toBe('// modified');
  });

  it('always writes when force is true', async () => {
    const content = 'export const Button = () => {};';
    const files = { 'Button.tsx': content };
    await writeFiles(files, outputDir, componentName, { cwd: TEST_DIR, quiet: true });

    await fs.writeFile(path.join(outputDir, 'Button', 'Button.tsx'), '// modified');
    const hashes = await loadHashes(path.join(TEST_DIR, '.crucible-hashes.json'));

    await writeFiles(files, outputDir, componentName, {
      cwd: TEST_DIR,
      force: true,
      quiet: true,
      hashes,
    });

    const currentContent = await fs.readFile(path.join(outputDir, 'Button', 'Button.tsx'), 'utf-8');
    expect(currentContent).toContain(content);
  });

  it('protects against path traversal', async () => {
    const files = { '../../../etc/passwd': 'malicious content' };
    await expect(
      writeFiles(files, outputDir, componentName, { cwd: TEST_DIR, quiet: true }),
    ).rejects.toThrow('path traversal');
  });

  it('writes multiple files', async () => {
    const files = {
      'Button.tsx': 'export const Button = () => {};',
      'Button.module.css': '.button { color: red; }',
    };
    await writeFiles(files, outputDir, componentName, { cwd: TEST_DIR, quiet: true });

    expect(await fs.pathExists(path.join(outputDir, 'Button', 'Button.tsx'))).toBe(true);
    expect(await fs.pathExists(path.join(outputDir, 'Button', 'Button.module.css'))).toBe(true);
  });

  it('saves hashes after writing', async () => {
    const files = { 'Button.tsx': 'export const Button = () => {};' };
    await writeFiles(files, outputDir, componentName, { cwd: TEST_DIR, quiet: true });

    const hashes = await loadHashes(path.join(TEST_DIR, '.crucible-hashes.json'));
    expect(hashes['Button/Button.tsx']).toBeDefined();
  });
});
