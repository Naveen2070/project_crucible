import { describe, it, expect } from 'vitest';
import { buildComponentModel } from '../../components/model';
import { resolveTokens } from '../../tokens/resolver';
import { renderComponent } from '../../templates/engine';
import { Framework, ThemePreset, StyleSystem, ComponentName } from '../../core/enums';

const mockConfig = {
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

describe('DropdownMenu snapshots', () => {
  it('react css mode snapshot (compound)', async () => {
    const tokens = resolveTokens(mockConfig);
    const model = buildComponentModel(ComponentName.DropdownMenu, tokens, mockConfig, true);
    const files = await renderComponent(model);

    expect(files['DropdownMenu.tsx']).toMatchSnapshot();
    expect(files['DropdownMenu.module.css']).toMatchSnapshot();
    expect(files['DropdownMenu.stories.tsx']).toMatchSnapshot();

    // Floating-ui menu with roving list navigation + compound API
    expect(files['DropdownMenu.tsx']).toContain('export const DropdownMenu');
    expect(files['DropdownMenu.tsx']).toContain('Object.assign(DropdownMenuRoot');
    expect(files['DropdownMenu.tsx']).toContain("role: 'menu'");
    expect(files['DropdownMenu.tsx']).toContain('role="menuitem"');
    expect(files['DropdownMenu.tsx']).toContain('useListNavigation');
    expect(files['DropdownMenu.tsx']).toContain('@floating-ui/react');
  });

  it('react scss mode snapshot', async () => {
    const config = { ...mockConfig, styleSystem: StyleSystem.SCSS };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.DropdownMenu, tokens, config, true);
    const files = await renderComponent(model);
    expect(files['DropdownMenu.module.scss']).toMatchSnapshot();
    expect(files['DropdownMenu.tsx']).toContain("import styles from './DropdownMenu.module.scss'");
  });

  it('react tailwind mode snapshot', async () => {
    const config = { ...mockConfig, styleSystem: StyleSystem.Tailwind };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.DropdownMenu, tokens, config, true);
    const files = await renderComponent(model);
    expect(files['DropdownMenu.tsx']).toMatchSnapshot();
    expect(files['DropdownMenu.module.css']).toBeUndefined();
    expect(files['DropdownMenu.tsx']).not.toContain('DropdownMenu.module');
    expect(files['DropdownMenu.tsx']).toContain('useListNavigation');
  });

  it('vue css mode snapshot', async () => {
    const config = { ...mockConfig, framework: Framework.Vue };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.DropdownMenu, tokens, config, true);
    const files = await renderComponent(model);
    expect(files['DropdownMenu.vue']).toMatchSnapshot();
    expect(files['DropdownMenu.vue']).toContain('menu');
    expect(files['DropdownMenu.vue']).toContain('@floating-ui/vue');
  });

  it('angular css mode snapshot (monolithic)', async () => {
    const config = { ...mockConfig, framework: Framework.Angular };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.DropdownMenu, tokens, config, true);
    const files = await renderComponent(model);
    expect(files['dropdownmenu.component.ts']).toMatchSnapshot();
    expect(files['dropdownmenu.component.html']).toMatchSnapshot();
    expect(files['dropdownmenu.component.ts']).toContain('export class DropdownMenuComponent');
    expect(files['dropdownmenu.component.ts']).toContain('@floating-ui/dom');
    expect(files['dropdownmenu.component.ts']).not.toContain('Object.assign');
    expect(files['dropdownmenu.component.html']).toContain('role="menu"');
  });
});
