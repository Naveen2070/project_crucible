import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import {
  compareVersions,
  coerceVersion,
  supportsVueUseId,
  detectVueVersion,
} from '../utils/semver';
import { buildComponentModel } from '../components/model';
import { Framework, ComponentName } from '../core/enums';

const mockTokens = {
  cssVars: {},
  darkCssVars: null,
  js: {},
  componentTokens: {},
} as any;
const vueConfig = {
  framework: Framework.Vue,
  features: { hover: true, focusRing: true, motionSafe: true },
  a11y: {
    focusRingColor: 'var(--color-primary)',
    focusRingWidth: '2px',
    focusRingOffset: '3px',
    reduceMotion: true,
  },
} as any;

describe('compareVersions', () => {
  it('orders versions correctly', () => {
    expect(compareVersions('3.5.0', '3.4.9')).toBe(1);
    expect(compareVersions('3.4.0', '3.5.0')).toBe(-1);
    expect(compareVersions('3.5.0', '3.5.0')).toBe(0);
    expect(compareVersions('3.5', '3.5.0')).toBe(0); // missing parts default to 0
  });
});

describe('coerceVersion', () => {
  it('strips range operators and returns x.y.z', () => {
    expect(coerceVersion('^3.5.0')).toBe('3.5.0');
    expect(coerceVersion('~3.2.47')).toBe('3.2.47');
    expect(coerceVersion('>=3.4.0')).toBe('3.4.0');
    expect(coerceVersion('3.5')).toBe('3.5.0'); // missing patch
  });

  it('uses the first alternative in a union range', () => {
    expect(coerceVersion('^3.0.0-0 || ^2.6.0')).toBe('3.0.0');
  });

  it('returns null for undetectable input', () => {
    expect(coerceVersion('')).toBeNull();
    expect(coerceVersion(undefined)).toBeNull();
    expect(coerceVersion('latest')).toBeNull();
  });
});

describe('supportsVueUseId', () => {
  it('is true for Vue 3.5+', () => {
    expect(supportsVueUseId('3.5.0')).toBe(true);
    expect(supportsVueUseId('3.6.2')).toBe(true);
    expect(supportsVueUseId('4.0.0')).toBe(true);
  });

  it('is false for Vue < 3.5', () => {
    expect(supportsVueUseId('3.4.9')).toBe(false);
    expect(supportsVueUseId('3.2.47')).toBe(false);
  });

  it('defaults to true (modern) when version is unknown', () => {
    expect(supportsVueUseId(null)).toBe(true);
  });
});

describe('detectVueVersion', () => {
  let dir: string;

  beforeAll(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'crucible-vue-detect-'));
  });

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('returns null when Vue cannot be located', async () => {
    expect(await detectVueVersion(dir)).toBeNull();
  });

  it('reads the declared range from package.json', async () => {
    await writeFile(
      path.join(dir, 'package.json'),
      JSON.stringify({ devDependencies: { vue: '^3.4.0' } }),
    );
    expect(await detectVueVersion(dir)).toBe('3.4.0');
  });

  it('prefers the installed node_modules version over the declared range', async () => {
    const vueModDir = path.join(dir, 'node_modules', 'vue');
    await mkdir(vueModDir, { recursive: true });
    await writeFile(path.join(vueModDir, 'package.json'), JSON.stringify({ version: '3.5.13' }));
    expect(await detectVueVersion(dir)).toBe('3.5.13');
  });
});

describe('buildComponentModel vueUseId flag', () => {
  it('defaults vueUseId to true for Vue', () => {
    const model = buildComponentModel(ComponentName.Input, mockTokens, vueConfig, false);
    expect(model.vueUseId).toBe(true);
  });

  it('honors an explicit false (legacy fallback)', () => {
    const model = buildComponentModel(ComponentName.Input, mockTokens, vueConfig, false, false);
    expect(model.vueUseId).toBe(false);
  });

  it('is always false for non-Vue frameworks', () => {
    const react = buildComponentModel(
      ComponentName.Input,
      mockTokens,
      { ...vueConfig, framework: Framework.React },
      false,
      true,
    );
    expect(react.vueUseId).toBe(false);
  });
});
