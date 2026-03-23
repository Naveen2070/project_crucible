import React from 'react';
import { expect, test, describe } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers';
// @ts-ignore
import { Card } from '../../../playground/react/src/__generated__/Card/Card';

expect.extend(matchers);

describe('Card a11y', () => {
  test('passes axe with zero violations', async () => {
    const { container } = render(
      <Card>
        <Card.Header>
          <h3>Title</h3>
        </Card.Header>
        <Card.Content>Content</Card.Content>
      </Card>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('variants all pass axe', async () => {
    for (const variant of ['default', 'hoverable', 'clickable']) {
      const { container } = render(
        <Card variant={variant as any}>
          <Card.Header>
            <h3>Title</h3>
          </Card.Header>
          <Card.Content>Content</Card.Content>
        </Card>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    }
  });
});
