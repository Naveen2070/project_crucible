import React from 'react';
import { describe, test, expect } from 'vitest';
import { axe } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers';
import { renderWithDarkTokens } from './render-with-tokens';
import { resolveTokens } from '../../tokens/resolver';
import { ThemePreset } from '../../core/enums';
// @ts-ignore
import { Button } from '../../../playground/react/src/__generated__/Button/Button';
// @ts-ignore
import { Input } from '../../../playground/react/src/__generated__/Input/Input';
// @ts-ignore
import { Card } from '../../../playground/react/src/__generated__/Card/Card';

expect.extend(matchers);

const DARK_CONFIGS = [
  { theme: ThemePreset.Minimal, darkMode: true },
  { theme: ThemePreset.Soft, darkMode: true },
] as const;

describe('Dark Mode a11y', () => {
  describe.each(DARK_CONFIGS)('Theme: %s', (config) => {
    const darkTokens = resolveTokens(config as any);

    test('Button passes axe in dark mode', async () => {
      const { container } = renderWithDarkTokens(
        <Button>Click me</Button>,
        darkTokens
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('Input passes axe in dark mode', async () => {
      const { container } = renderWithDarkTokens(
        <Input>
          <Input.Label>Username</Input.Label>
          <Input.Field placeholder="Enter username" />
        </Input>,
        darkTokens
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('Card passes axe in dark mode', async () => {
      const { container } = renderWithDarkTokens(
        <Card>
          <Card.Header>
            <h3>Title</h3>
          </Card.Header>
          <Card.Content>Content</Card.Content>
        </Card>,
        darkTokens
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
