import { dirname } from 'path';
import { fileURLToPath } from 'url';

function getAbsolutePath(value) {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}

const config = {
  stories: [
    '../src/__generated__/**/*.mdx',
    '../src/__generated__/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    getAbsolutePath('@storybook/addon-essentials'),
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-docs'),
  ],
  framework: {
    name: getAbsolutePath('@storybook/vue3-vite'),
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};

export default config;
