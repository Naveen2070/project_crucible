import { readFile, writeFile } from 'node:fs/promises';
import path from 'path';
import ansis from 'ansis';
import { loadPreset } from '../../themes';
import { ThemePreset } from '../../core/enums';
import { pathExists, readJson, writeJson } from '../../utils/fs';

export interface EjectOptions {
  config: string;
  quiet?: boolean;
  cwd?: string;
}

export async function runEject(opts: EjectOptions) {
  const cwd = opts.cwd || process.cwd();
  const configPath = path.resolve(cwd, opts.config);
  if (!(await pathExists(configPath))) {
    throw new Error('Config file not found. Run "crucible init" first.');
  }
  const raw = await readJson(configPath);
  const theme = raw.theme || ThemePreset.Minimal;
  const presetTokens = loadPreset(theme);

  raw.tokens = { ...presetTokens, ...raw.tokens };
  raw.theme = ThemePreset.Custom;

  await writeJson(configPath, raw);
  if (!opts.quiet) console.log(ansis.green(`✔ Ejected ${theme} theme into ${opts.config}`));
}
