import path from 'path';
import ansis from 'ansis';
import { readConfig } from '../../config/reader';
import { loadHashes } from '../../scaffold/writer';
import { resolveOutputDir, trackedComponents } from '../utils/output-dir';
import { classifyTree, ReportFileState } from '../../migrate/report';
import { lineDiff, hasChanges } from '../utils/line-diff';
import { Framework, StyleSystem } from '../../core/enums';

export interface DiffOptions {
  framework?: string;
  style?: string;
  stories?: boolean;
  json?: boolean;
  cwd?: string;
  config?: string;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function printDiff(file: string, diff: ReturnType<typeof lineDiff>) {
  console.log(ansis.bold(`\n● ${file}`));
  for (const line of diff) {
    if (line.type === '-') console.log(ansis.red(`  - ${line.text}`));
    else if (line.type === '+') console.log(ansis.green(`  + ${line.text}`));
  }
}

export async function runDiff(components: string[], opts: DiffOptions = {}) {
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
  const tracked = trackedComponents(manifest.files);
  const target = components && components.length > 0 ? components.map(capitalizeFirst) : tracked;

  if (target.length === 0) {
    if (!opts.json) console.log(ansis.gray('No generated components to diff.'));
    else console.log(JSON.stringify({ changed: [] }, null, 2));
    return;
  }

  const report = await classifyTree({
    cwd,
    outDir,
    config,
    framework,
    generateStories,
    manifest,
    components: target,
  });

  const changed: { file: string; status: 'modified' | 'new'; state: ReportFileState }[] = [];

  for (const f of report.files) {
    // Orphaned entries have no template to render against; clean ones have nothing to show.
    if (f.state === 'clean' || f.state === 'orphaned') continue;

    const status = f.state === 'new' ? 'new' : 'modified';
    changed.push({ file: f.hashKey, status, state: f.state });

    if (opts.json) continue;
    if (status === 'new') {
      const lines = (f.theirs ?? '').split('\n').length;
      console.log(ansis.bold(`\n● ${f.hashKey}`) + ansis.gray(` (new — ${lines} lines)`));
    } else {
      const d = lineDiff(f.ours ?? '', f.theirs ?? '');
      if (hasChanges(d)) printDiff(f.hashKey, d);
    }
  }

  if (opts.json) {
    console.log(JSON.stringify({ changed }, null, 2));
    return;
  }

  if (changed.length === 0) {
    console.log(ansis.green('\n✓ No changes — generated output matches the files on disk.\n'));
  } else {
    const mod = changed.filter((c) => c.status === 'modified').length;
    const fresh = changed.filter((c) => c.status === 'new').length;
    console.log(
      ansis.cyan(`\n${changed.length} file(s) would change`) +
        ansis.gray(` (${mod} modified, ${fresh} new). Run \`crucible update\` to apply.\n`),
    );
  }
}
