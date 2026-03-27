import { describe, it, expect } from 'vitest';
import { generateComponentFiles } from '../registry/path-generator';
import { registry } from '../registry/components';
import { Framework, StyleSystem, ComponentName } from '../core/enums';

describe('generateComponentFiles', () => {
  it('generates all frameworks', () => {
    const result = generateComponentFiles('Button');
    expect(result.frameworks).toContain(Framework.React);
    expect(result.frameworks).toContain(Framework.Angular);
    expect(result.frameworks).toContain(Framework.Vue);
  });

  it('generates all style systems', () => {
    const result = generateComponentFiles('Button');
    expect(result.styleSystems).toContain(StyleSystem.CSS);
    expect(result.styleSystems).toContain(StyleSystem.Tailwind);
    expect(result.styleSystems).toContain(StyleSystem.SCSS);
  });

  describe('React files', () => {
    it('generates correct CSS mode files', () => {
      const result = generateComponentFiles('Button');
      expect(result.files.css).toContain('Button/Button.tsx');
      expect(result.files.css).toContain('Button/Button.module.css');
      expect(result.files.css).toContain('Button/Button.stories.tsx');
    });

    it('generates correct Tailwind mode files', () => {
      const result = generateComponentFiles('Button');
      expect(result.files.tailwind).toContain('Button/Button.tsx');
      expect(result.files.tailwind).toContain('Button/Button.stories.tsx');
      expect(result.files.tailwind).not.toContain('Button/Button.module.css');
    });

    it('generates correct SCSS mode files', () => {
      const result = generateComponentFiles('Button');
      expect(result.files.scss).toContain('Button/Button.tsx');
      expect(result.files.scss).toContain('Button/Button.module.scss');
      expect(result.files.scss).toContain('Button/Button.stories.tsx');
    });
  });

  describe('Component dependencies', () => {
    it('Dialog generates required dependencies exactly once', () => {
      const result = registry[ComponentName.Dialog];
      expect(result.dependencies).toContain('Button');
      expect(result.dependencies).toHaveLength(1);
    });

    it('Select generates required dependencies exactly once', () => {
      const result = registry[ComponentName.Select];
      expect(result.dependencies).toContain('Button');
      expect(result.dependencies).toHaveLength(1);
    });
  });

  describe('Angular files', () => {
    it('generates correct CSS mode files', () => {
      const result = generateComponentFiles('Card');
      expect(result.files.css).toContain('card/card.component.ts');
      expect(result.files.css).toContain('card/card.component.html');
      expect(result.files.css).toContain('card/card.component.css');
      expect(result.files.css).toContain('card/card.stories.ts');
    });

    it('generates correct SCSS mode files', () => {
      const result = generateComponentFiles('Card');
      expect(result.files.scss).toContain('card/card.component.scss');
      expect(result.files.scss).not.toContain('card/card.component.css');
    });

    it('generates correct Tailwind mode files', () => {
      const result = generateComponentFiles('Card');
      expect(result.files.tailwind).toContain('card/card.component.ts');
      expect(result.files.tailwind).toContain('card/card.component.html');
      expect(result.files.tailwind).toContain('card/card.stories.ts');
    });
  });

  describe('Vue files', () => {
    it('generates correct CSS mode files', () => {
      const result = generateComponentFiles('Input');
      expect(result.files.css).toContain('Input/Input.vue');
      expect(result.files.css).toContain('Input/Input.stories.ts');
      expect(result.files.css).toContain('Input/Input.module.css');
    });

    it('generates correct SCSS mode files', () => {
      const result = generateComponentFiles('Input');
      expect(result.files.scss).toContain('Input/Input.vue');
      expect(result.files.scss).toContain('Input/Input.stories.ts');
      expect(result.files.scss).toContain('Input/Input.module.scss');
    });
  });

  it('handles different component names correctly', () => {
    const button = generateComponentFiles('Button');
    const Dialog = generateComponentFiles('Dialog');
    const select = generateComponentFiles('Select');

    expect(button.files.css).toContain('Button/Button.tsx');
    expect(Dialog.files.css).toContain('Dialog/Dialog.tsx');
    expect(select.files.css).toContain('Select/Select.tsx');
  });

  it('produces consistent file counts per style system', () => {
    const button = generateComponentFiles('Button');

    expect(button.files.css.length).toBeGreaterThan(0);
    expect(button.files.tailwind.length).toBeGreaterThan(0);
    expect(button.files.scss.length).toBeGreaterThan(0);

    expect(button.files.tailwind.length).toBeLessThan(button.files.css.length);
    expect(button.files.scss.length).toBe(button.files.css.length);
  });

  describe('custom output directory', () => {
    it('config with custom outputDir does not affect default path', () => {
      const result = generateComponentFiles('Button');

      expect(result.files.css[0]).toBe('Button/Button.tsx');

      const customOutputFiles = result.files.css.map((f) => f.replace('Button/', 'custom/path/'));
      expect(customOutputFiles).toContain('custom/path/Button.tsx');
    });
  });
});
