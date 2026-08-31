import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFile, writeFile, mkdir, rm, readdir } from 'node:fs/promises';
import path from 'path';

const readJson = (p: string) => readFile(p, 'utf-8').then(JSON.parse);
const writeJson = (p: string, data: unknown) => writeFile(p, JSON.stringify(data, null, 2));
const ensureDir = (p: string) => mkdir(p, { recursive: true });
const remove = (p: string) => rm(p, { recursive: true, force: true });

import { runAdd } from '../../cli/commands/add';
import { runUpgrade } from '../../cli/commands/upgrade';

vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
  throw new Error(`Process exited with code ${code}`);
});
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});

const TEST_DIR = path.resolve(__dirname, '../../../.upgrade-test-temp');
const OUT = 'src/components';

const fullTokens = {
  color: {
    primary: '#000',
    secondary: '#fff',
    surface: '#fff',
    background: '#fff',
    border: '#fff',
    text: '#000',
    textMuted: '#666',
    destructive: '#f00',
    success: '#0f0',
  },
  radius: { sm: '0', md: '0', lg: '0' },
  spacing: { unit: '1px' },
  typography: { fontFamily: 'serif', scaleBase: '1px' },
};

const writeConfig = (extra: Record<string, unknown> = {}) =>
  writeJson(path.join(TEST_DIR, 'crucible.config.json'), {
    version: '1',
    framework: 'react',
    styleSystem: 'css',
    theme: 'minimal',
    tokens: fullTokens,
    features: { hover: true, focusRing: true, motionSafe: true },
    a11y: {
      focusRingStyle: 'solid',
      focusRingColor: '#000',
      focusRingWidth: '1px',
      focusRingOffset: '0px',
      reduceMotion: true,
    },
    flags: { outputDir: OUT, stories: false },
    ...extra,
  });

const add = (components: string[], opts: Record<string, unknown> = {}) =>
  runAdd(components, { cwd: TEST_DIR, config: 'crucible.config.json', quiet: true, yes: true, ...opts });

const upgrade = (components: string[], opts: Record<string, unknown> = {}) =>
  runUpgrade(components, { cwd: TEST_DIR, config: 'crucible.config.json', yes: true, quiet: true, ...opts });

const manifestPath = () => path.join(TEST_DIR, '.crucible', 'manifest.json');
const buttonMain = () => path.join(TEST_DIR, OUT, 'Button', 'Button.tsx');

/** Appends `marker` to one line of `content`, leaving every other line (the merge anchors) intact. */
function withLineChanged(content: string, lineIndex: number, marker: string): string {
  const lines = content.split('\n');
  lines[lineIndex] = lines[lineIndex] + marker;
  return lines.join('\n');
}

async function seedDiverged(mode: 'non-overlapping' | 'conflicting') {
  await writeConfig();
  await add(['Button']);
  const real = await readFile(buttonMain(), 'utf-8');
  const lines = real.split('\n');
  expect(lines.length).toBeGreaterThan(5); // needs anchor lines between the two edits

  const idxA = 1;
  const idxB = lines.length - 2;

  const key = 'Button/Button.tsx';
  const manifest = await readJson(manifestPath());

  if (mode === 'non-overlapping') {
    // BASE differs from THEIRS(=real) only at idxA; OURS differs from BASE only at idxB.
    const staleBase = withLineChanged(real, idxA, ' /* was */');
    manifest.files[key].baseContent = staleBase;
    await writeJson(manifestPath(), manifest);
    await writeFile(buttonMain(), withLineChanged(staleBase, idxB, ' /* mine */'));
  } else {
    // BASE and OURS both differ from THEIRS(=real) at the SAME line idxA, with different edits.
    const staleBase = withLineChanged(real, idxA, ' /* was */');
    manifest.files[key].baseContent = staleBase;
    await writeJson(manifestPath(), manifest);
    await writeFile(buttonMain(), withLineChanged(real, idxA, ' /* mine, different */'));
  }
  return { real, idxA, idxB };
}

describe('runUpgrade', () => {
  beforeEach(async () => {
    await ensureDir(TEST_DIR);
    vi.clearAllMocks();
    process.exitCode = undefined;
  });

  afterEach(async () => {
    await remove(TEST_DIR);
    process.exitCode = undefined;
  });

  it('clean: leaves the file untouched, exit 0', async () => {
    await writeConfig();
    await add(['Button']);
    const before = await readFile(buttonMain(), 'utf-8');
    await upgrade(['Button']);
    expect(await readFile(buttonMain(), 'utf-8')).toBe(before);
    expect(process.exitCode).toBeUndefined();
  });

  it('user-edited: keeps OURS, does not touch disk or manifest baseContent', async () => {
    await writeConfig();
    await add(['Button']);
    const edited = (await readFile(buttonMain(), 'utf-8')) + '\n// my edit\n';
    await writeFile(buttonMain(), edited);
    const manifestBefore = await readJson(manifestPath());

    await upgrade(['Button']);

    expect(await readFile(buttonMain(), 'utf-8')).toBe(edited);
    const manifestAfter = await readJson(manifestPath());
    expect(manifestAfter.files['Button/Button.tsx'].baseContent).toBe(
      manifestBefore.files['Button/Button.tsx'].baseContent,
    );
  });

  it('upstream-updated: writes THEIRS and refreshes baseContent', async () => {
    await writeConfig();
    await add(['Button']);
    const real = await readFile(buttonMain(), 'utf-8');
    const key = 'Button/Button.tsx';
    const manifest = await readJson(manifestPath());
    const staleBase = '// stale\n' + manifest.files[key].baseContent;
    manifest.files[key].baseContent = staleBase;
    await writeJson(manifestPath(), manifest);
    await writeFile(buttonMain(), staleBase); // disk matches the (stale) base — untouched by user

    await upgrade(['Button']);

    expect(await readFile(buttonMain(), 'utf-8')).toBe(real);
    const after = await readJson(manifestPath());
    expect(after.files[key].baseContent).toBe(real);
  });

  it('diverged, non-overlapping edits: auto-merges cleanly, exit 0', async () => {
    const { real, idxB } = await seedDiverged('non-overlapping');
    await upgrade(['Button']);

    const merged = await readFile(buttonMain(), 'utf-8');
    expect(merged).not.toContain('<<<<<<<');
    // idxA reverted to THEIRS, idxB's user edit preserved
    const mergedLines = merged.split('\n');
    const realLines = real.split('\n');
    expect(mergedLines[idxB]).toBe(realLines[idxB] + ' /* mine */');
    expect(process.exitCode).toBeUndefined();
  });

  it('diverged, conflicting edits with --yes: writes markers, exit 1', async () => {
    await seedDiverged('conflicting');
    await upgrade(['Button'], { yes: true });

    const written = await readFile(buttonMain(), 'utf-8');
    expect(written).toContain('<<<<<<<');
    expect(written).toContain('|||||||');
    expect(written).toContain('=======');
    expect(written).toContain('>>>>>>>');
    expect(process.exitCode).toBe(1);
  });

  it('--strategy ours on a conflict: leaves disk untouched', async () => {
    await seedDiverged('conflicting');
    const before = await readFile(buttonMain(), 'utf-8');
    await upgrade(['Button'], { strategy: 'ours' });
    expect(await readFile(buttonMain(), 'utf-8')).toBe(before);
  });

  it('--strategy theirs on a conflict: overwrites with THEIRS, discarding the user edit', async () => {
    const { real } = await seedDiverged('conflicting');
    await upgrade(['Button'], { strategy: 'theirs' });
    expect(await readFile(buttonMain(), 'utf-8')).toBe(real);
  });

  it('--dry-run makes no changes to disk or manifest', async () => {
    await seedDiverged('non-overlapping');
    const diskBefore = await readFile(buttonMain(), 'utf-8');
    const manifestBefore = await readFile(manifestPath(), 'utf-8');

    await upgrade(['Button'], { dryRun: true });

    expect(await readFile(buttonMain(), 'utf-8')).toBe(diskBefore);
    expect(await readFile(manifestPath(), 'utf-8')).toBe(manifestBefore);
  });

  it('backs up the pre-write disk content before an overwrite', async () => {
    await writeConfig();
    await add(['Button']);
    const key = 'Button/Button.tsx';
    const manifest = await readJson(manifestPath());
    manifest.files[key].baseContent = '// stale\n' + manifest.files[key].baseContent;
    await writeJson(manifestPath(), manifest);
    const staleDisk = '// stale\n' + (await readFile(buttonMain(), 'utf-8'));
    await writeFile(buttonMain(), staleDisk);

    await upgrade(['Button']);

    const backupsDir = path.join(TEST_DIR, '.crucible', 'backups');
    const runs = await readdir(backupsDir);
    expect(runs.length).toBeGreaterThanOrEqual(1);
    const backedUp = await readFile(path.join(backupsDir, runs[0], 'Button', 'Button.tsx'), 'utf-8');
    expect(backedUp).toBe(staleDisk);
  });

  it('never touches or deletes an orphaned manifest entry', async () => {
    await writeConfig();
    await add(['Button']);
    const manifest = await readJson(manifestPath());
    manifest.files['GhostComp/Ghost.tsx'] = { contentHash: 'x', generatedAt: 'now', baseContent: 'x' };
    await writeJson(manifestPath(), manifest);

    await upgrade([]);

    const after = await readJson(manifestPath());
    expect(after.files['GhostComp/Ghost.tsx']).toEqual(manifest.files['GhostComp/Ghost.tsx']);
  });
});
