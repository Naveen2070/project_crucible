import React from 'react';
import { expect, test, describe } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// @ts-ignore - imports the generated component from the playground
import { Form } from '../../../playground/react/src/__generated__/Form/Form';

describe('Form controlled input (regression: typing only registered one char)', () => {
  test('typing a full word into a Form.Control persists every character', async () => {
    const user = userEvent.setup();
    render(
      <Form.Root mode="onBlur">
        <Form.Field name="email">
          <Form.Item>
            <Form.Label>Email</Form.Label>
            <Form.Control asChild>
              <input type="text" aria-label="email-input" />
            </Form.Control>
            <Form.Message />
          </Form.Item>
        </Form.Field>
      </Form.Root>,
    );

    const input = screen.getByLabelText('email-input') as HTMLInputElement;
    await user.type(input, 'hello@example.com');
    expect(input.value).toBe('hello@example.com');
  });

  test('validation still fires on submit for a required field', async () => {
    const user = userEvent.setup();
    render(
      <Form.Root>
        <Form.Field name="name" rules={{ required: 'Name is required.' }}>
          <Form.Item>
            <Form.Label>Name</Form.Label>
            <Form.Control asChild>
              <input type="text" aria-label="name-input" />
            </Form.Control>
            <Form.Message />
          </Form.Item>
        </Form.Field>
        <Form.Submit>Save</Form.Submit>
      </Form.Root>,
    );

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Name is required.');

    await user.type(screen.getByLabelText('name-input'), 'Ada');
    expect((screen.getByLabelText('name-input') as HTMLInputElement).value).toBe('Ada');
  });
});
