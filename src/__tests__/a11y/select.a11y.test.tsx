import React, { useState } from 'react';
import { test, expect, describe } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// @ts-ignore
import { Select } from '../../../playground/react/src/__generated__/Select/Select';

describe('Select a11y & interactions', () => {
  const TestSelect = () => {
    const [val, setVal] = useState('');
    return (
      <Select value={val} onChange={setVal}>
        <Select.Label>Label</Select.Label>
        <Select.Trigger>
          <Select.Value placeholder="Select one..." />
          <Select.Icon />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="1" label="Option 1" />
          <Select.Item value="2" label="Option 2" />
        </Select.Content>
      </Select>
    );
  };

  test('Select opens on click', async () => {
    render(<TestSelect />);
    await userEvent.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeVisible();
  });

  test('Select keyboard navigation — arrow keys work', async () => {
    render(<TestSelect />);

    const combobox = screen.getByRole('combobox');
    await userEvent.click(combobox);

    const listbox = screen.getByRole('listbox');
    const items = within(listbox).getAllByRole('option');

    await userEvent.keyboard('{ArrowDown}');
    expect(combobox).toHaveAttribute('aria-activedescendant', items[0].id);

    await userEvent.keyboard('{ArrowDown}');
    expect(combobox).toHaveAttribute('aria-activedescendant', items[1].id);

    await userEvent.keyboard('{ArrowUp}');
    expect(combobox).toHaveAttribute('aria-activedescendant', items[0].id);
  });

  test('Select Enter selects highlighted option', async () => {
    render(<TestSelect />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');

    expect(screen.getByRole('combobox')).toHaveTextContent('Option 1');
  });
});
