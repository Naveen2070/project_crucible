import path from 'path';
import { writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import ansis from 'ansis';
import { select } from '@inquirer/prompts';
import { readConfig } from '../../config/reader';
import { loadHashes, saveHashes, writeFiles } from '../../scaffold/writer';
import { resolveOutputDir } from '../utils/output-dir';
import { classifyTree, ReportFileState } from '../../migrate/report';
import { mergeThreeWay } from '../../migrate/merge';
import { Framework, StyleSystem } from '../../core/enums';

export type UpgradeStrategy = 'ours' | 'theirs' | 'merge';

export interface UpgradeOptions {
  framework?: string;
  style?: string;
  stories?: boolean;
  strategy?: UpgradeStrategy;
  yes?: boolean;
  dryRun?: boolean;
  /** Pre-write backups under `.crucible/backups/<timestamp>/`. Default on; commander's --no-backup sets false. */
  backup?: boolean;
  cwd?: string;
  config?: string;
  quiet?: boolean;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const BACKUP_DIR = '.crucible/backups';
const MAX_BACKUPS = 5;

async function backupFile(cwd: string, timestamp: string, hashKey: string, content: string) {
  const dest = path.join(cwd, BACKUP_DIR, timestamp, hashKey);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, content, 'utf-8');
}

/** Backups are grouped one directory per run (ISO timestamp, sorts lexicographically). */
async function pruneBackups(cwd: string) {
  const dir = path.join(cwd, BACKUP_DIR);
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return;
  }
  const stale = entries.sort().slice(0, Math.max(0, entries.length - MAX_BACKUPS));
  for (const name of stale) {
    await rm(path.join(dir, name), { recursive: true, force: true });
  }
}

const LABEL: Record<ReportFileState, string> = {
  clean: 'clean',
  'upstream-updated': 'upstream updated',
  'user-edited': 'user edited',
  diverged: 'diverged',
  orphaned: 'orphaned',
  new: 'new',
};

export async function runUpgrade(components: string[], opts: UpgradeOptions = {}) {
  const cwd = path.resolve(process.cwd(), opts.cwd || '.');
  const configRel = path.relative(
    process.cwd(),
    path.join(cwd, opts.config || 'crucible.config.json'),
  );
  const config = await readConfig(configRel);
  if (opts.style) config.styleSystem = opts.style as StyleSystem;
  const framework = (opts.framework as Framework) || (config.framework as Framework);
  const generateStories = opts.stories ?? config.flags?.stories ?? false;

  const manifest = await loadHashes(cwd);
  const outputDir = await resolveOutputDir(cwd);
  const outDir = path.join(cwd, outputDir);

  const report = await classifyTree({
    cwd,
    outDir,
    config,
    framework,
    generateStories,
    manifest,
    components: components && components.length > 0 ? components.map(capitalizeFirst) : undefined,
  });

  if (!opts.quiet) {
    console.log(ansis.cyan(`\n⚗  Crucible Upgrade — ${outputDir}\n`));
    const parts = (Object.keys(LABEL) as ReportFileState[])
      .map((s) => ({ s, n: report.counts[s] ?? 0 }))
      .filter(({ n }) => n > 0)
      .map(({ s, n }) => `${n} ${LABEL[s]}`);
    console.log(`  ${parts.length > 0 ? parts.join(', ') : 'nothing tracked'}\n`);
  }

  if (opts.dryRun) {
    for (const f of report.files) {
      if (f.state === 'clean' || f.state === 'orphaned') continue;
      console.log(`  ~ ${f.hashKey} (${LABEL[f.state]})`);
    }
    if ((report.counts.diverged ?? 0) > 0) process.exitCode = 1;
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  let wrote = 0;
  let unresolvedConflicts = 0;

  for (const f of report.files) {
    // clean: bytes identical to what's already on disk/manifest — nothing to do.
    // orphaned: no template to render against — never touched, never deleted (D6).
    if (f.state === 'clean' || f.state === 'orphaned') continue;

    let finalText: string | undefined;

    if (f.state === 'upstream-updated' || f.state === 'new') {
      finalText = f.theirs;
    } else if (f.state === 'user-edited') {
      continue; // keep OURS — no write, no manifest change
    } else {
      // diverged
      if (opts.strategy === 'ours') {
        continue;
      } else if (opts.strategy === 'theirs') {
        finalText = f.theirs;
      } else {
        const merged = mergeThreeWay(f.base ?? '', f.theirs ?? '', f.ours ?? '');
        if (merged.clean) {
          finalText = merged.text;
        } else if (opts.yes || !process.stdout.isTTY) {
          finalText = merged.text; // written with <<<<<<< markers; caller must resolve by hand
          unresolvedConflicts++;
        } else {
          const choice = await select({
            message: `Conflict in ${f.hashKey} — how should it be resolved?`,
            choices: [
              { name: 'Keep yours (skip this file)', value: 'ours' as const },
              { name: 'Take theirs (discard your edits)', value: 'theirs' as const },
              { name: 'Write with conflict markers', value: 'markers' as const },
              { name: 'Skip', value: 'skip' as const },
            ],
          });
          if (choice === 'ours' || choice === 'skip') continue;
          if (choice === 'theirs') finalText = f.theirs;
          else {
            finalText = merged.text;
            unresolvedConflicts++;
          }
        }
      }
    }

    if (finalText === undefined) continue;

    if (opts.backup !== false && f.state !== 'new' && f.ours !== undefined) {
      await backupFile(cwd, timestamp, f.hashKey, f.ours);
    }

    const comp = f.hashKey.split('/')[0];
    const filename = f.hashKey.slice(comp.length + 1);
    await writeFiles({ [filename]: finalText }, outDir, comp, {
      cwd,
      force: true,
      quiet: true,
      hashes: manifest,
    });
    wrote++;
    if (!opts.quiet) console.log(ansis.green(`✓  ${f.hashKey}`));
  }

  await saveHashes(manifest, cwd);
  if (opts.backup !== false) await pruneBackups(cwd);

  if (!opts.quiet) {
    console.log(ansis.gray(`\n${wrote} file(s) written.`));
    if (unresolvedConflicts > 0) {
      console.log(
        ansis.red(`${unresolvedConflicts} file(s) written with unresolved conflict markers.`),
      );
    }
    console.log('');
  }

  if (unresolvedConflicts > 0) process.exitCode = 1;
}
