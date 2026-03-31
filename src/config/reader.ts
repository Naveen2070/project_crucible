import { readFile } from 'node:fs/promises';
import path from 'path';
import { validateConfig } from './validator';
import { Framework, StyleSystem, ThemePreset, DarkModeStrategy } from '../core/enums';
import { pathExists, readJson } from '../utils/fs';

export interface DarkModeConfig {
  strategy: `${DarkModeStrategy}`;
  tokens?: Record<string, string>;
}

export interface CrucibleConfig {
  version: string;
  framework: `${Framework}`;
  theme: `${ThemePreset}` | string;
  styleSystem: `${StyleSystem}`;
  tokens?: {
    color?: Record<string, string>;
    radius?: Record<string, string>;
    spacing?: { unit: string };
    typography?: { fontFamily: string; scaleBase: string };
    components?: Record<string, Record<string, string>>;
  };
  darkMode?: boolean | DarkModeConfig;
  features: {
    hover: boolean;
    focusRing: boolean;
    motionSafe: boolean;
    compoundComponents?: boolean;
  };
  a11y: {
    focusRingStyle: string;
    focusRingColor: string;
    focusRingWidth: string;
    focusRingOffset: string;
    reduceMotion: boolean;
  };
  flags?: {
    outputDir?: string;
    stories?: boolean;
  };
}

export async function readConfig(configPath: string): Promise<CrucibleConfig> {
  const cwd = process.cwd();
  const resolved = path.resolve(cwd, configPath);

  // Security: Path Traversal & Extension Protection
  if (!resolved.startsWith(cwd)) {
    throw new Error(`Security breach: Config file must be within the project root.`);
  }
  if (path.extname(resolved) !== '.json') {
    throw new Error('Security error: Only .json configuration files are allowed.');
  }

  if (!(await pathExists(resolved))) {
    throw new Error(`Config not found: ${resolved}\nRun: crucible init`);
  }
  const raw = await readJson(resolved);
  return validateConfig({
    styleSystem: StyleSystem.CSS, // default
    theme: ThemePreset.Minimal, // default
    ...raw,
  });
}
