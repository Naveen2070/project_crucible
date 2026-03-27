import { describe, it, expect } from 'vitest';
import { ComponentName } from '../core/enums';
import { registry } from '../registry/components';

describe('11. Operational Edge Cases', () => {
  it('11.5: unsupported component returns undefined at runtime', () => {
    const unknownComponent = 'UnknownComponent' as ComponentName;
    expect(registry[unknownComponent]).toBeUndefined();
  });

  it('registry contains all expected components', () => {
    expect(Object.keys(registry)).toContain(ComponentName.Button);
    expect(Object.keys(registry)).toContain(ComponentName.Input);
    expect(Object.keys(registry)).toContain(ComponentName.Card);
    expect(Object.keys(registry)).toContain(ComponentName.Dialog);
    expect(Object.keys(registry)).toContain(ComponentName.Select);
  });
});
