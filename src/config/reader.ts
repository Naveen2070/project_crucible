import fs from 'fs-extra';
import path from 'path';
import { validateConfig } from './validator';

export interface DarkModeConfig {
  strategy: 'auto' | 'manual';
  tokens?: Record<string, string>;
}

export interface CrucibleConfig {
  version: string;
  framework: 'react' | 'angular' | 'vue';
  theme: string;
  styleSystem: 'css' | 'tailwind';
  tokens?: {
    color?: Record<string, string>;
    radius?: Record<string, string>;
    spacing?: { unit: string };
    typography?: { fontFamily: string; scaleBase: string };
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
  const resolved = path.resolve(process.cwd(), configPath);
  if (!(await fs.pathExists(resolved))) {
    throw new Error(`Config not found: ${resolved}\nRun: crucible init`);
  }
  const raw = await fs.readJson(resolved);
  return validateConfig({
    styleSystem: 'css', // default
    theme: 'minimal', // default
    ...raw,
  });
}
