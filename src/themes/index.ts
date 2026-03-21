import { minimalTokens } from './minimal';
import { softTokens } from './soft';
import { ThemePreset } from '../core/enums';

export const PRESETS = {
  [ThemePreset.Minimal]: minimalTokens,
  [ThemePreset.Soft]: softTokens,
} as const;

export type ThemeName = ThemePreset | string;

export function loadPreset(theme: string): typeof minimalTokens {
  return (PRESETS as Record<string, typeof minimalTokens>)[theme] ?? PRESETS[ThemePreset.Minimal];
}
