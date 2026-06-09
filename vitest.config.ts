import { defineConfig } from 'vitest/config';

// Storybook component tests live in the standalone React playground
// (playground/react), which wires its own @storybook/addon-vitest via
// `storybook init`. The root suite covers the engine (node) and the
// generated-output accessibility checks (react-a11y).
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/__tests__/**'],
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          globals: true,
          environment: 'node',
          setupFiles: ['src/__tests__/setup.ts'],
          include: ['src/__tests__/**/*.test.ts'],
        },
      },
      {
        extends: true,
        // The a11y suite renders React components generated into the standalone
        // playground/react, which resolves its own copy of React. Dedupe so the
        // components and @testing-library/react share one React instance
        // (otherwise hooks hit a null dispatcher).
        resolve: { dedupe: ['react', 'react-dom'] },
        test: {
          name: 'react-a11y',
          globals: true,
          environment: 'jsdom',
          setupFiles: ['src/__tests__/a11y/setup.ts'],
          include: ['src/__tests__/a11y/**/*.test.tsx'],
        },
      },
    ],
  },
});
