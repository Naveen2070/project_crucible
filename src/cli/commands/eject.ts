import { readFile, writeFile } from 'node:fs/promises';
import path from 'path';
import chalk from 'chalk';
import { loadPreset } from '../../themes';
import { ThemePreset } from '../../core/enums';
import { pathExists, readJson, writeJson } from '../../utils/fs';

export interface EjectOptions {
  config: string;
  cwd?: string;
}

export async function runEject(opts: EjectOptions) {
  try {
    const cwd = opts.cwd || process.cwd();
    const configPath = path.resolve(cwd, opts.config);
    if (!(await pathExists(configPath))) {
      console.error(chalk.red('✗ Config file not found. Run "crucible init" first.'));
      process.exit(1);
    }
    const raw = await readJson(configPath);
    const theme = raw.theme || ThemePreset.Minimal;
    const presetTokens = loadPreset(theme);

    raw.tokens = { ...presetTokens, ...raw.tokens };
    raw.theme = ThemePreset.Custom;

    await writeJson(configPath, raw);
    console.log(chalk.green(`✔ Ejected ${theme} theme into ${opts.config}`));
  } catch (e: any) {
    console.error(chalk.red(`✗ Error: ${e.message}`));
    process.exit(1);
  }
}
