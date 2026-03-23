import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { loadHashes, saveHashes, writeFiles, HASH_FILE, LEGACY_HASH_FILE } from '../scaffold/writer';

const TEST_DIR = path.join(__dirname, '../../.writer-test-temp');

describe('loadHashes', () => {
  beforeEach(async () => {
    await fs.ensureDir(TEST_DIR);
  });

  afterEach(async () => {
    await fs.remove(TEST_DIR);
  });

  it('returns default manifest when file does not exist', async () => {
    const result = await loadHashes(TEST_DIR);
    expect(result.files).toEqual({});
    expect(result.engineVersion).toBeDefined();
    expect(result.generatedAt).toBeDefined();
  });

  it('returns parsed manifest when file exists', async () => {
    const manifestPath = path.join(TEST_DIR, HASH_FILE);
    await fs.ensureDir(path.dirname(manifestPath));
    const mockManifest = {
      engineVersion: '1.0.0',
      configHash: 'abc',
      generatedAt: '2023-01-01',
      files: {
        'Button/Button.tsx': { contentHash: 'hash123', generatedAt: '2023-01-01' }
      }
    };
    await fs.writeJson(manifestPath, mockManifest);
    const result = await loadHashes(TEST_DIR);
    expect(result).toEqual(mockManifest);
  });

  it('migrates legacy hash file when manifest does not exist', async () => {
    const legacyPath = path.join(TEST_DIR, LEGACY_HASH_FILE);
    await fs.writeJson(legacyPath, { 'Button/Button.tsx': 'legacyHash123' });
    
    const result = await loadHashes(TEST_DIR);
    expect(result.files['Button/Button.tsx'].contentHash).toBe('legacyHash123');
  });
});

describe('saveHashes', () => {
  beforeEach(async () => {
    await fs.ensureDir(TEST_DIR);
  });

  afterEach(async () => {
    await fs.remove(TEST_DIR);
  });

  it('writes manifest to file', async () => {
    const manifestPath = path.join(TEST_DIR, HASH_FILE);
    const manifest = {
      engineVersion: '1.0.0',
      configHash: 'abc',
      generatedAt: '2023-01-01',
      files: {
        'Button/Button.tsx': { contentHash: 'hash123', generatedAt: '2023-01-01' }
      }
    };
    await saveHashes(manifest, TEST_DIR);
    const result = await fs.readJson(manifestPath);
    expect(result).toEqual(manifest);
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

    const hashes = await loadHashes(TEST_DIR);
    const originalHash = hashes.files['Button/Button.tsx'].contentHash;

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
    const hashes = await loadHashes(TEST_DIR);

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

    const hashes = await loadHashes(TEST_DIR);
    expect(hashes.files['Button/Button.tsx']).toBeDefined();
  });
});
