import { minimalTokens } from './minimal';
import { softTokens } from './soft';

export const PRESETS = {
  minimal: minimalTokens,
  soft: softTokens,
} as const;

export type ThemeName = keyof typeof PRESETS;

export function loadPreset(theme: string): typeof minimalTokens {
  return (PRESETS as Record<string, typeof minimalTokens>)[theme] ?? PRESETS.minimal;
}
