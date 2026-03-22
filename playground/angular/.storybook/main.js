const config = {
  stories: ['../src/__generated__/**/*.mdx', '../src/__generated__/**/*.stories.ts'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};

module.exports = config;
