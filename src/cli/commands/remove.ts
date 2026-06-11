import { rm } from 'node:fs/promises';
import path from 'path';
import ansis from 'ansis';
import { confirm } from '@inquirer/prompts';
import { loadHashes, saveHashes } from '../../scaffold/writer';
import { getComponentDefinition } from '../utils/deps';
import { resolveOutputDir, trackedComponents } from '../utils/output-dir';
import { pathExists } from '../../utils/fs';

export interface RemoveOptions {
  yes?: boolean;
  dryRun?: boolean;
  quiet?: boolean;
  cwd?: string;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export async function runRemove(components: string[], opts: RemoveOptions = {}) {
  const cwd = path.resolve(process.cwd(), opts.cwd || '.');
  const manifest = await loadHashes(cwd);
  const outputDir = await resolveOutputDir(cwd);
  const outDir = path.join(cwd, outputDir);
  const tracked = trackedComponents(manifest.files);

  const targets = (components || []).map(capitalizeFirst);
  if (targets.length === 0) {
    if (!opts.quiet) console.log(ansis.gray('Nothing to remove — specify a component.'));
    return;
  }

  let manifestChanged = false;

  for (const comp of targets) {
    const compDir = path.join(outDir, comp);
    const onDisk = await pathExists(compDir);
    const isTracked = tracked.includes(comp);

    if (!onDisk && !isTracked) {
      if (!opts.quiet) console.log(ansis.gray(`— ${comp} is not generated; skipping.`));
      continue;
    }

    // Warn if another generated component declares this one as a dependency.
    const dependents = tracked.filter(
      (t) => t !== comp && getComponentDefinition(t)?.dependencies?.includes(comp),
    );
    if (dependents.length > 0 && !opts.quiet) {
      console.warn(
        ansis.yellow(`⚠ ${comp} is a dependency of: ${dependents.join(', ')} — removing may break them.`),
      );
    }

    if (opts.dryRun) {
      console.log(ansis.yellow(`~ would remove ${path.join(outputDir, comp)}/ and untrack its files`));
      continue;
    }

    if (!opts.yes) {
      const ok = await confirm({
        message: `Remove ${comp}? This deletes ${path.join(outputDir, comp)}/ and untracks its files.`,
        default: false,
      });
      if (!ok) {
        if (!opts.quiet) console.log(ansis.gray(`  Skipped ${comp}.`));
        continue;
      }
    }

    if (onDisk) await rm(compDir, { recursive: true, force: true });
    for (const key of Object.keys(manifest.files)) {
      if (key.split('/')[0] === comp) {
        delete manifest.files[key];
        manifestChanged = true;
      }
    }
    if (!opts.quiet) console.log(ansis.green(`✓ Removed ${comp}`));
  }

  if (manifestChanged && !opts.dryRun) {
    await saveHashes(manifest, cwd);
  }
}
