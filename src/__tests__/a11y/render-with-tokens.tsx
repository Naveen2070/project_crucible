import React from 'react';
import { RenderOptions, render } from '@testing-library/react';
import { ResolvedTokens } from '../../tokens/resolver';

export function renderWithDarkTokens(
  ui: React.ReactElement,
  darkTokens: ResolvedTokens,
  options?: RenderOptions,
) {
  const darkStyles = Object.entries(darkTokens.darkCssVars ?? {})
    .map(([varName, value]) => `${varName}: ${value}`)
    .join('; ');

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <div style={{ colorScheme: 'dark' }}>
      <style>{`
        :root {
          color-scheme: dark;
          ${darkStyles}
        }
      `}</style>
      {children}
    </div>
  );

  return render(ui, { wrapper, ...options });
}
