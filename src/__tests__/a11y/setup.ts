import '@testing-library/jest-dom';
import * as matchers from 'vitest-axe/matchers';
import { expect } from 'vitest';
import { initRegistry } from '../../plugins/loader';

expect.extend(matchers);

declare module 'vitest' {
  export interface Assertion<T = any> {
    toHaveNoViolations(): T;
  }
}

// Initialize registry for tests
await initRegistry(process.cwd());
