import React, { useState } from 'react';
import { test, expect, vi, describe } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// @ts-ignore
import { Dialog } from '../../../playground/react/src/__generated__/Dialog/Dialog';

describe('Dialog a11y & interactions', () => {
  test('Dialog focus trap — focus cycles within Dialog', async () => {
    render(
      <Dialog isOpen onClose={() => {}}>
        <Dialog.Overlay>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Title</Dialog.Title>
              <Dialog.Close />
            </Dialog.Header>
            <Dialog.Body>
              <button>Inner Button 1</button>
              <button>Inner Button 2</button>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog>
    );

    const dialogEl = screen.getByRole('dialog');
    const focusableElements = dialogEl.querySelectorAll('button, input, [tabindex="0"]');
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    firstFocusable?.focus();
    expect(document.activeElement).toBe(firstFocusable);

    await userEvent.tab();
    expect(document.activeElement).not.toBe(firstFocusable);

    // It should stay inside the Dialog
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    expect(dialogEl.contains(document.activeElement)).toBe(true);
  });

  test('Dialog Escape key closes Dialog', async () => {
    const onClose = vi.fn();
    render(
      <Dialog isOpen onClose={onClose}>
        <Dialog.Overlay>
          <Dialog.Content>
            <Dialog.Body>Content</Dialog.Body>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog>
    );

    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
