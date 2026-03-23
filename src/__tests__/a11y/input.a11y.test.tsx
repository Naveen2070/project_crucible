import React from 'react';
import { expect, test, describe } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers';
// @ts-ignore
import { Input } from '../../../playground/react/src/__generated__/Input/Input';

expect.extend(matchers);

describe('Input a11y', () => {
  test('passes axe with zero violations', async () => {
    const { container } = render(
      <Input>
        <Input.Label>Username</Input.Label>
        <Input.Field placeholder="Enter username" />
      </Input>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('variants all pass axe', async () => {
    for (const variant of ['default', 'error']) {
      const { container } = render(
        <Input variant={variant as any}>
          <Input.Label>Test</Input.Label>
          <Input.Field />
        </Input>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    }
  });
});
