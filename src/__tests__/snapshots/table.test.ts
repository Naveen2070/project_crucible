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
      surface: '#FFFFFF',
      border: '#E2E1F0',
      text: '#1A1A2E',
      textMuted: '#6B6B8A',
    },
    radius: { sm: '4px', md: '8px' },
    spacing: { unit: '4px' },
    typography: { scaleBase: '16px' },
  },
  features: { hover: true, focusRing: true, motionSafe: true },
  a11y: {
    focusRingColor: 'var(--color-primary)',
    focusRingWidth: '2px',
    focusRingOffset: '3px',
    reduceMotion: true,
  },
  darkMode: true,
} as any;

describe('Table Component Tests', () => {
  describe('Table rendering', () => {
    it('should generate Table component with correct structure', async () => {
      const tokens = resolveTokens(mockConfig);
      const model = buildComponentModel(ComponentName.Table, tokens, mockConfig, false);
      const output = await renderComponent(model);

      expect(output).toBeDefined();
      expect(output['Table.tsx']).toBeDefined();
    });

    it('should include virtualization references in output', async () => {
      const tokens = resolveTokens(mockConfig);
      const model = buildComponentModel(ComponentName.Table, tokens, mockConfig, false);
      const output = await renderComponent(model);

      // Check that the Table component code references the utilities
      const tableCode =
        output['Table.tsx'] || output['Table.vue'] || output['table.component.ts'] || '';
      const hasVirtualizerRef =
        tableCode.includes('HeadlessVirtualizer') || tableCode.includes('VirtualState');
      expect(hasVirtualizerRef).toBe(true);
    });

    it('should generate virtualization adapters guide', async () => {
      const tokens = resolveTokens(mockConfig);
      const model = buildComponentModel(ComponentName.Table, tokens, mockConfig, false);
      const output = await renderComponent(model);

      expect(output['virtualization-adapters-guide.md']).toBeDefined();
      expect(output['virtualization-adapters-guide.md']).toContain('TanStack Virtual');
      expect(output['virtualization-adapters-guide.md']).toContain('React Integration');
    });

    it('should include CSS module', async () => {
      const tokens = resolveTokens(mockConfig);
      const model = buildComponentModel(ComponentName.Table, tokens, mockConfig, false);
      const output = await renderComponent(model);

      expect(output['Table.module.css']).toBeDefined();
    });
  });

  describe('React Table with different style systems', () => {
    it('should render React CSS Table', async () => {
      const config = { ...mockConfig, framework: Framework.React, styleSystem: StyleSystem.CSS };
      const tokens = resolveTokens(config);
      const model = buildComponentModel(ComponentName.Table, tokens, config, false);
      const output = await renderComponent(model);

      expect(output['Table.tsx']).toContain('useState');
    });

    it('should render React Tailwind Table', async () => {
      const config = {
        ...mockConfig,
        framework: Framework.React,
        styleSystem: StyleSystem.Tailwind,
      };
      const tokens = resolveTokens(config);
      const model = buildComponentModel(ComponentName.Table, tokens, config, false);
      const output = await renderComponent(model);

      expect(output['Table.tsx']).toContain('className');
    });

    it('should render React SCSS Table', async () => {
      const config = { ...mockConfig, framework: Framework.React, styleSystem: StyleSystem.SCSS };
      const tokens = resolveTokens(config);
      const model = buildComponentModel(ComponentName.Table, tokens, config, false);
      const output = await renderComponent(model);

      expect(output['Table.tsx']).toContain('import styles');
    });
  });

  describe('Vue Table', () => {
    it('should render Vue Table', async () => {
      const config = { ...mockConfig, framework: Framework.Vue, styleSystem: StyleSystem.CSS };
      const tokens = resolveTokens(config);
      const model = buildComponentModel(ComponentName.Table, tokens, config, false);
      const output = await renderComponent(model);

      expect(output['Table.vue']).toContain('<script setup');
      expect(output['Table.vue']).toContain('HeadlessVirtualizer');
    });
  });

  describe('Angular Table', () => {
    it('should render Angular Table', async () => {
      const config = { ...mockConfig, framework: Framework.Angular, styleSystem: StyleSystem.CSS };
      const tokens = resolveTokens(config);
      const model = buildComponentModel(ComponentName.Table, tokens, config, false);
      const output = await renderComponent(model);

      expect(output['table.component.ts']).toContain('@Component');
      expect(output['table.component.ts']).toContain('virtualizer');
    });

    it('should include Angular HTML template', async () => {
      const config = { ...mockConfig, framework: Framework.Angular, styleSystem: StyleSystem.CSS };
      const tokens = resolveTokens(config);
      const model = buildComponentModel(ComponentName.Table, tokens, config, false);
      const output = await renderComponent(model);

      expect(output['table.component.html']).toBeDefined();
      expect(output['table.component.html']).toContain('<table');
    });
  });
});
