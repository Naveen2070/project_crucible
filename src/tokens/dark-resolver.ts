import Color from 'colorjs.io';
import { DarkModeConfig } from '../config/reader';
import { ThemePreset, DarkModeStrategy } from '../core/enums';

export function normalizeDarkMode(
  raw: boolean | DarkModeConfig | undefined,
): DarkModeConfig | null {
  if (!raw) return null;
  if (raw === true) return { strategy: DarkModeStrategy.Auto };
  return raw as DarkModeConfig;
}

export function deriveDarkTokens(
  light: Record<string, string>,
  config: DarkModeConfig,
  theme: string,
): Record<string, string> {
  const base =
    theme === ThemePreset.Soft
      ? { surface: '#1a1525', background: '#100e1a' }
      : { surface: '#1a1a2e', background: '#0f0f1a' };

  const auto: Record<string, string> = {
    primary: shiftColor(light.primary, { l: +15, c: +5 }),
    secondary: shiftColor(light.primary, { l: -40, c: -20 }),
    surface: base.surface,
    background: base.background,
    border: withAlpha(light.primary, 0.15),
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    destructive: shiftColor(light.destructive, { l: +10 }),
    success: shiftColor(light.success, { l: +10 }),
  };

  return config.strategy === DarkModeStrategy.Manual && config.tokens
    ? { ...auto, ...config.tokens }
    : auto;
}

function shiftColor(hex: string, shift: { l?: number; c?: number }): string {
  try {
    const c = new Color(hex).to('oklch');
    if (shift.l !== undefined && c.l != null) c.l = Math.min(1, Math.max(0, c.l + shift.l / 100));
    if (shift.c !== undefined && c.c != null) c.c = Math.max(0, c.c + shift.c / 100);
    return c.to('srgb').toString({ format: 'hex' });
  } catch {
    return hex;
  }
}

function withAlpha(hex: string, alpha: number): string {
  try {
    const c = new Color(hex);
    c.alpha = alpha;
    return c.to('srgb').toString({ format: 'hex' });
  } catch {
    return hex;
  }
}
