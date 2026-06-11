import { describe, it, expect } from 'vitest';
import Handlebars from 'handlebars';
import '../templates/engine'; // registers custom helpers as a side effect

describe('handlebars helpers', () => {
  it('capitalize does not throw on an empty string', () => {
    const tpl = Handlebars.compile('{{capitalize x}}');
    expect(() => tpl({ x: '' })).not.toThrow();
    expect(tpl({ x: '' })).toBe('');
    expect(tpl({ x: 'foo' })).toBe('Foo');
  });
});
