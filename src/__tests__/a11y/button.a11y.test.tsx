import React from 'react';
import { expect, test, describe } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers';
// @ts-ignore
import { Button } from '../../../playground/react/src/__generated__/Button/Button';

expect.extend(matchers);

describe('Button a11y', () => {
  test('passes axe with zero violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('variants all pass axe', async () => {
    for (const variant of ['primary', 'secondary', 'ghost', 'danger']) {
      const { container } = render(<Button variant={variant as any}>Test</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    }
  });
});
