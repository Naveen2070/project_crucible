import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { generate } from '../../api/generate';
import { Framework, ThemePreset, StyleSystem } from '../../core/enums';

const baseConfig = {
  framework: Framework.React,
  theme: ThemePreset.Minimal,
  styleSystem: StyleSystem.CSS,
  tokens: {
    color: {
      primary: '#6C63FF',
      secondary: '#F3F2FF',
      surface: '#FFFFFF',
      background: '#F8F9FA',
      border: '#E2E1F0',
      text: '#1A1A2E',
      textMuted: '#6B6B8A',
      destructive: '#E24B4A',
      success: '#1D9E75',
    },
    radius: { sm: '4px', md: '8px', lg: '12px' },
    spacing: { unit: '4px' },
    typography: { fontFamily: 'system-ui, sans-serif', scaleBase: '16px' },
  },
  features: { hover: true, focusRing: true, motionSafe: true },
  a11y: {
    focusRingColor: 'var(--color-primary)',
    focusRingWidth: '2px',
    focusRingOffset: '3px',
    reduceMotion: true,
  },
} as any;

// Point dependency-existence checks at a directory with no generated components, so peer/dep
// detection reflects a clean project rather than this repo's own tree.
const outDir = path.join(process.cwd(), '.tmp-nonexistent-generate-test');

function req(overrides: Partial<Parameters<typeof generate>[0]>) {
  return generate({
    components: [],
    cwd: process.cwd(),
    outDir,
    config: baseConfig,
    framework: Framework.React,
    generateStories: false,
    ...overrides,
  } as Parameters<typeof generate>[0]);
}

describe('generate() core', () => {
  it('renders a single component in memory with its style file and tokens', async () => {
    const result = await req({ components: ['Button'] });

    expect(result.resolvedComponents).toEqual(['Button']);
    expect(result.components).toHaveLength(1);

    const button = result.components[0];
    expect(button.name).toBe('Button');
    expect(button.pluginId).toBe('core');
    expect(button.files['Button.tsx']).toContain('export const Button');
    expect(button.files['Button.module.css']).toBeDefined();

    expect(result.tokens.content).toContain('--color-primary');
  });

  it('auto-adds a component dependency that is not already generated', async () => {
    // Dialog depends on Button; with a clean outDir, Button must be pulled in.
    const result = await req({ components: ['Dialog'] });
    expect(result.resolvedComponents).toContain('Dialog');
    expect(result.resolvedComponents).toContain('Button');
    expect(result.components.map((c) => c.name)).toContain('Button');
  });

  it('reports missing peer dependencies for a component that needs them', async () => {
    const result = await req({ components: ['DropdownMenu'], framework: Framework.React });
    expect(result.peerDependencies).toContain('@floating-ui/react');
  });

  it('only reports utils the rendered files actually import (import-aware)', async () => {
    // Tabs uses the shared roving-focus util on React...
    const tabs = await req({ components: ['Tabs'] });
    expect(tabs.components[0].usedUtils).toContain('roving-focus');

    // ...but React DropdownMenu uses floating-ui, so it must NOT ship roving-focus.
    const menu = await req({ components: ['DropdownMenu'], framework: Framework.React });
    expect(menu.components[0].usedUtils).not.toContain('roving-focus');
  });

  it('does not write anything to disk (pure render)', async () => {
    const { existsSync } = await import('node:fs');
    await req({ components: ['Button'] });
    expect(existsSync(outDir)).toBe(false);
  });
});
