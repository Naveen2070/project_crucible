import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { loadPreset } from '../themes';
import { ThemePreset } from '../core/enums';

export interface EjectOptions {
  config: string;
  cwd?: string;
}

export async function runEject(opts: EjectOptions) {
  try {
    const cwd = opts.cwd || process.cwd();
    const configPath = path.resolve(cwd, opts.config);
    if (!(await fs.pathExists(configPath))) {
      console.error(chalk.red('✗ Config file not found. Run "crucible init" first.'));
      process.exit(1);
    }
    const raw = await fs.readJson(configPath);
    const theme = raw.theme || ThemePreset.Minimal;
    const presetTokens = loadPreset(theme);

    // Scenario 2.8: Eject twice should not duplicate or mangle token structure
    // If we already have tokens, we should probably merge them carefully
    // Currently it just overwrites or merges
    raw.tokens = { ...presetTokens, ...raw.tokens };
    raw.theme = ThemePreset.Custom;

    await fs.writeJson(configPath, raw, { spaces: 2 });
    console.log(chalk.green(`✔ Ejected ${theme} theme into ${opts.config}`));
  } catch (e: any) {
    console.error(chalk.red(`✗ Error: ${e.message}`));
    process.exit(1);
  }
}
