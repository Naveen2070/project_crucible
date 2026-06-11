import { readFile } from 'node:fs/promises';
import path from 'path';
import ansis from 'ansis';
import { readConfig } from '../../config/reader';
import { loadHashes, formatFile } from '../../scaffold/writer';
import { generate } from '../../api/generate';
import { resolveOutputDir, trackedComponents } from '../utils/output-dir';
import { lineDiff, hasChanges } from '../utils/line-diff';
import { pathExists } from '../../utils/fs';
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

  const result = await generate({ components: target, cwd, outDir, config, framework, generateStories });

  const changed: { file: string; status: 'modified' | 'new' }[] = [];

  for (const comp of result.components) {
    for (const [filename, raw] of Object.entries(comp.files)) {
      const rel = path.join(comp.name, filename).split(path.sep).join('/');
      const onDiskPath = path.join(outDir, comp.name, filename);
      const generated = await formatFile(raw, onDiskPath, cwd);

      if (!(await pathExists(onDiskPath))) {
        changed.push({ file: rel, status: 'new' });
        if (!opts.json) {
          console.log(ansis.bold(`\n● ${rel}`) + ansis.gray(` (new — ${generated.split('\n').length} lines)`));
        }
        continue;
      }

      const current = await readFile(onDiskPath, 'utf-8');
      const d = lineDiff(current, generated);
      if (hasChanges(d)) {
        changed.push({ file: rel, status: 'modified' });
        if (!opts.json) printDiff(rel, d);
      }
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
