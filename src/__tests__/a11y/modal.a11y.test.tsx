import React, { useState } from 'react';
import { test, expect, vi, describe } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// @ts-ignore
import { Modal } from '../../../playground/react/src/__generated__/Modal/Modal';

describe('Modal a11y & interactions', () => {
  test('Modal focus trap — focus cycles within modal', async () => {
    render(
      <Modal isOpen onClose={() => {}}>
        <Modal.Overlay>
          <Modal.Content>
            <Modal.Header>
              <Modal.Title>Title</Modal.Title>
              <Modal.Close />
            </Modal.Header>
            <Modal.Body>
              <button>Inner Button 1</button>
              <button>Inner Button 2</button>
            </Modal.Body>
          </Modal.Content>
        </Modal.Overlay>
      </Modal>
    );

    const modal = screen.getByRole('dialog');
    const focusableElements = modal.querySelectorAll('button, input, [tabindex="0"]');
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    firstFocusable?.focus();
    expect(document.activeElement).toBe(firstFocusable);

    await userEvent.tab();
    expect(document.activeElement).not.toBe(firstFocusable);

    // It should stay inside the modal
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    expect(modal.contains(document.activeElement)).toBe(true);
  });

  test('Modal Escape key closes modal', async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose}>
        <Modal.Overlay>
          <Modal.Content>
            <Modal.Body>Content</Modal.Body>
          </Modal.Content>
        </Modal.Overlay>
      </Modal>
    );

    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
