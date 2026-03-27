import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { runInit } from '../cli/init';
import { runAdd } from '../cli/add';
import { runEject } from '../cli/eject';
import { runList } from '../cli/list';
import { runTokens } from '../cli/tokens';
import { runConfigShow } from '../cli/config-show';
import { registry } from '../registry/components';

// Mock process.exit
const mockExit = vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
  throw new Error(`Process exited with code ${code}`);
});

// Mock console
const mockLog = vi.spyOn(console, 'log').mockImplementation(() => {});
const mockError = vi.spyOn(console, 'error').mockImplementation(() => {});
const mockWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

const TEST_DIR = path.resolve(__dirname, '../../.cli-test-temp');

describe('CLI Commands', () => {
  beforeEach(async () => {
    await fs.ensureDir(TEST_DIR);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await fs.remove(TEST_DIR);
  });

  describe('Missing config file', () => {
    it('fails with clear error and exit code 1 when crucible.config.json is missing', async () => {
      await expect(runAdd(['Button'], { cwd: TEST_DIR, config: 'crucible.config.json', quiet: true }))
        .rejects.toThrow('Process exited with code 1');
      
      expect(mockError).toHaveBeenCalledWith(expect.stringContaining('Config not found'));
    });
  });

  describe('No components in non-interactive mode', () => {
    it('fails when no components are specified with --yes', async () => {
      await expect(runAdd([], { cwd: TEST_DIR, yes: true }))
        .rejects.toThrow('Process exited with code 1');
      
      expect(mockError).toHaveBeenCalledWith(expect.stringContaining('Cannot use --yes without specifying components'));
    });
  });

  describe('Duplicate component names', () => {
    it('does not generate duplicates or corrupt manifest', async () => {
      const configPath = path.join(TEST_DIR, 'crucible.config.json');
      await fs.writeJson(configPath, {
        version: '1',
        framework: 'react',
        styleSystem: 'css',
        tokens: { 
          color: { primary: '#000', secondary: '#fff', surface: '#fff', background: '#fff', border: '#fff', text: '#000', textMuted: '#666', destructive: '#f00', success: '#0f0' }, 
          radius: { sm: '0', md: '0', lg: '0' }, 
          spacing: { unit: '1px' }, 
          typography: { fontFamily: 'serif', scaleBase: '1px' } 
        },
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: { focusRingStyle: 'solid', focusRingColor: '#000', focusRingWidth: '1px', focusRingOffset: '0px', reduceMotion: true }
      });

      await runAdd(['Button', 'Button'], { cwd: TEST_DIR, config: 'crucible.config.json', quiet: true, yes: true });
      
      const manifestPath = path.join(TEST_DIR, '.crucible', 'manifest.json');
      const manifest = await fs.readJson(manifestPath);
      
      const buttonFiles = Object.keys(manifest.files).filter(f => f.startsWith('Button/'));
      expect(buttonFiles.length).toBeGreaterThan(0);
    });
  });

  describe('Unknown component fails', () => {
    it('fails with useful message and exit 1', async () => {
      await expect(runAdd(['UnknownComp'], { cwd: TEST_DIR, quiet: true }))
        .rejects.toThrow('Process exited with code 1');
      
      expect(mockError).toHaveBeenCalledWith(expect.stringContaining('Unknown component: UnknownComp'));
    });
  });

  describe('List command', () => {
    it('outputs available components', () => {
      runList();
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Available components:'));
      for (const name of Object.keys(registry)) {
        expect(mockLog).toHaveBeenCalledWith(expect.stringContaining(name));
      }
    });
  });

  describe('Init idempotency', () => {
    it('is idempotent when config already exists and --yes is used', async () => {
      const configPath = path.join(TEST_DIR, 'crucible.config.json');
      await runInit({ yes: true, cwd: TEST_DIR });
      const firstConfig = await fs.readFile(configPath, 'utf-8');
      
      await runInit({ yes: true, cwd: TEST_DIR });
      const secondConfig = await fs.readFile(configPath, 'utf-8');
      
      expect(secondConfig).toBe(firstConfig);
    });
  });

  describe('Eject command', () => {
    it('sets theme to custom and injects tokens', async () => {
      const configPath = path.join(TEST_DIR, 'crucible.config.json');
      await fs.writeJson(configPath, { 
        version: '1', 
        framework: 'react', 
        theme: 'minimal',
        tokens: { color: { primary: '#custom' }, radius: { sm: '1px' }, spacing: { unit: '1px' }, typography: { fontFamily: 'serif', scaleBase: '1px' } }
      });
      
      await runEject({ config: 'crucible.config.json', cwd: TEST_DIR });
      
      const config = await fs.readJson(configPath);
      expect(config.theme).toBe('custom');
      expect(config.tokens).toBeDefined();
      expect(config.tokens.color.primary).toBe('#custom'); 
    });

    it('is idempotent when run twice', async () => {
      const configPath = path.join(TEST_DIR, 'crucible.config.json');
      await fs.writeJson(configPath, { 
        version: '1', 
        framework: 'react', 
        theme: 'minimal',
        tokens: { color: { primary: '#000' }, radius: { sm: '1px' }, spacing: { unit: '1px' }, typography: { fontFamily: 'serif', scaleBase: '1px' } }
      });
      
      await runEject({ config: 'crucible.config.json', cwd: TEST_DIR });
      const firstRunConfig = await fs.readJson(configPath);
      
      await runEject({ config: 'crucible.config.json', cwd: TEST_DIR });
      const secondRunConfig = await fs.readJson(configPath);
      
      expect(secondRunConfig).toEqual(firstRunConfig);
    });
  });

  describe('Tokens command', () => {
    it('updates only token output, not component files', async () => {
      const configPath = path.join(TEST_DIR, 'crucible.config.json');
      await fs.writeJson(configPath, {
        version: '1',
        framework: 'react',
        styleSystem: 'css',
        tokens: { 
          color: { primary: '#000', secondary: '#fff', surface: '#fff', background: '#fff', border: '#fff', text: '#000', textMuted: '#666', destructive: '#f00', success: '#0f0' }, 
          radius: { sm: '0', md: '0', lg: '0' }, 
          spacing: { unit: '1px' }, 
          typography: { fontFamily: 'serif', scaleBase: '1px' } 
        },
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: { focusRingStyle: 'solid', focusRingColor: '#000', focusRingWidth: '1px', focusRingOffset: '0px', reduceMotion: true }
      });
      
      await runTokens({ cwd: TEST_DIR });
      const tokensPath = path.join(TEST_DIR, 'public/__generated__', 'tokens.css');
      expect(await fs.pathExists(tokensPath)).toBe(true);
      
      expect(await fs.pathExists(path.join(TEST_DIR, 'src/components'))).toBe(false);
    });
  });

  describe('CLI flags override config', () => {
    it('overrides style system from CLI flag', async () => {
      const configPath = path.join(TEST_DIR, 'crucible.config.json');
      await fs.writeJson(configPath, {
        version: '1',
        framework: 'react',
        styleSystem: 'css',
        tokens: { 
          color: { primary: '#000', secondary: '#fff', surface: '#fff', background: '#fff', border: '#fff', text: '#000', textMuted: '#666', destructive: '#f00', success: '#0f0' }, 
          radius: { sm: '0', md: '0', lg: '0' }, 
          spacing: { unit: '1px' }, 
          typography: { fontFamily: 'serif', scaleBase: '1px' } 
        },
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: { focusRingStyle: 'solid', focusRingColor: '#000', focusRingWidth: '1px', focusRingOffset: '0px', reduceMotion: true }
      });
      
      await runAdd(['Button'], { cwd: TEST_DIR, config: 'crucible.config.json', style: 'tailwind', quiet: true, yes: true });
      
      const manifestPath = path.join(TEST_DIR, '.crucible', 'manifest.json');
      const manifest = await fs.readJson(manifestPath);
      const hasCss = Object.keys(manifest.files).some(f => f.endsWith('.css'));
      expect(hasCss).toBe(false);
    });

    it('overrides theme from CLI flag', async () => {
      const configPath = path.join(TEST_DIR, 'crucible.config.json');
      await fs.writeJson(configPath, {
        version: '1',
        framework: 'react',
        styleSystem: 'css',
        theme: 'minimal',
        tokens: { 
          color: { primary: '#000', secondary: '#fff', surface: '#fff', background: '#fff', border: '#fff', text: '#000', textMuted: '#666', destructive: '#f00', success: '#0f0' }, 
          radius: { sm: '0', md: '0', lg: '0' }, 
          spacing: { unit: '1px' }, 
          typography: { fontFamily: 'serif', scaleBase: '1px' } 
        },
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: { focusRingStyle: 'solid', focusRingColor: '#000', focusRingWidth: '1px', focusRingOffset: '0px', reduceMotion: true }
      });
      
      await runAdd(['Button'], { cwd: TEST_DIR, config: 'crucible.config.json', theme: 'soft', quiet: false, yes: true });
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Theme: soft (CLI override)'));
    });
  });

  describe('Config Show', () => {
    it('outputs config as JSON', async () => {
      const configPath = path.join(TEST_DIR, 'crucible.config.json');
      const config = { version: '1', framework: 'react' };
      await fs.writeJson(configPath, config);
      
      await runConfigShow({ cwd: TEST_DIR, json: true });
      expect(mockLog).toHaveBeenCalledWith(JSON.stringify(config));
    });

    it('fails if config not found', async () => {
      await expect(runConfigShow({ cwd: TEST_DIR }))
        .rejects.toThrow('Process exited with code 1');
      expect(mockError).toHaveBeenCalledWith(expect.stringContaining('Config file not found'));
    });
  });

  describe('Config with unknown keys', () => {
    it('handles unknown keys without failing', async () => {
      const configPath = path.join(TEST_DIR, 'crucible.config.json');
      await fs.writeJson(configPath, {
        version: '1',
        framework: 'react',
        styleSystem: 'css',
        unknownKey: 'shouldBeIgnored',
        tokens: { 
          color: { primary: '#000', secondary: '#fff', surface: '#fff', background: '#fff', border: '#fff', text: '#000', textMuted: '#666', destructive: '#f00', success: '#0f0' }, 
          radius: { sm: '0', md: '0', lg: '0' }, 
          spacing: { unit: '1px' }, 
          typography: { fontFamily: 'serif', scaleBase: '1px' } 
        },
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: { focusRingStyle: 'solid', focusRingColor: '#000', focusRingWidth: '1px', focusRingOffset: '0px', reduceMotion: true }
      });
      
      await runAdd(['Button'], { cwd: TEST_DIR, config: 'crucible.config.json', quiet: true, yes: true });
      expect(mockError).not.toHaveBeenCalled();
    });
  });
});
