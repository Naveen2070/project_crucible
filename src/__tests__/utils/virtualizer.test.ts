import { describe, it, expect, beforeEach } from 'vitest';
import {
  HeadlessVirtualizer,
  VirtualState,
  HeadlessVirtualizerOptions,
} from '../../../templates/shared/utils/virtualizer';

describe('HeadlessVirtualizer', () => {
  let virtualizer: HeadlessVirtualizer;
  const defaultOptions: HeadlessVirtualizerOptions = {
    itemCount: 100,
    itemHeight: 44,
    overscan: 5,
    containerHeight: 600,
  };

  beforeEach(() => {
    virtualizer = new HeadlessVirtualizer(defaultOptions);
  });

  describe('constructor', () => {
    it('should create virtualizer with default values', () => {
      const v = new HeadlessVirtualizer({ itemCount: 50, itemHeight: 30 });
      expect(v).toBeDefined();
    });

    it('should use default overscan when not provided', () => {
      const v = new HeadlessVirtualizer({ itemCount: 10, itemHeight: 20 });
      const state = v.getState();
      // With 10 items and default overscan=5, virtualItems will be around 10 items + overscan
      expect(state.virtualItems.length).toBe(10);
    });

    it('should use default containerHeight when not provided', () => {
      const v = new HeadlessVirtualizer({ itemCount: 10, itemHeight: 20 });
      expect(v).toBeDefined();
    });
  });

  describe('getState()', () => {
    it('should return correct virtualItems for normal scroll position', () => {
      virtualizer.updateScroll(0);
      const state = virtualizer.getState();

      expect(state.startIndex).toBe(0);
      // With scroll=0, containerHeight=600, itemHeight=44:
      // endIndex = min(99, ceil(600/44) + 5) = min(99, 14 + 5) = 19
      expect(state.endIndex).toBe(19);
      expect(state.virtualItems.length).toBe(20); // 0 to 19 inclusive
      expect(state.virtualItems[0].index).toBe(0);
    });

    it('should calculate correct offsetY', () => {
      virtualizer.updateScroll(0);
      const state = virtualizer.getState();

      expect(state.offsetY).toBe(0);
      expect(state.totalHeight).toBe(4400); // 100 * 44
    });

    it('should handle scroll position in middle', () => {
      virtualizer.updateScroll(1000);
      const state = virtualizer.getState();

      // scrollTop=1000, itemHeight=44: floor(1000/44) = 22
      // startIndex = max(0, 22 - 5) = 17
      expect(state.startIndex).toBe(17);
      expect(state.offsetY).toBe(748); // 17 * 44
    });

    it('should handle scroll at end', () => {
      virtualizer.updateScroll(4000);
      const state = virtualizer.getState();

      expect(state.endIndex).toBeLessThanOrEqual(99);
      expect(state.startIndex).toBeGreaterThanOrEqual(80);
    });
  });

  describe('edge cases', () => {
    it('should handle empty data (0 items)', () => {
      const v = new HeadlessVirtualizer({ itemCount: 0, itemHeight: 44 });
      const state = v.getState();

      expect(state.startIndex).toBe(0);
      expect(state.endIndex).toBe(-1);
      expect(state.virtualItems.length).toBe(0);
      expect(state.totalHeight).toBe(0);
    });

    it('should handle single item', () => {
      const v = new HeadlessVirtualizer({ itemCount: 1, itemHeight: 44 });
      const state = v.getState();

      expect(state.startIndex).toBe(0);
      expect(state.endIndex).toBe(0);
      expect(state.virtualItems.length).toBe(1);
      expect(state.virtualItems[0].index).toBe(0);
    });

    it('should handle threshold boundary - items just under threshold', () => {
      // Note: threshold is handled at component level, not in virtualizer
      // With 50 items and default containerHeight=600, itemHeight=44:
      // visibleItems = ceil(600/44) + overscan = 14 + 5 = 19
      // virtualItems will be around 20 (accounting for bounds)
      const v = new HeadlessVirtualizer({ itemCount: 50, itemHeight: 44 });
      const state = v.getState();

      expect(state.virtualItems.length).toBeGreaterThan(0);
      expect(state.virtualItems.length).toBeLessThanOrEqual(50);
    });

    it('should handle large dataset (10000+ items)', () => {
      const v = new HeadlessVirtualizer({ itemCount: 10000, itemHeight: 44 });
      const state = v.getState();

      expect(state.totalHeight).toBe(440000);
      expect(state.virtualItems.length).toBeLessThan(25); // Only visible + overscan
    });

    it('should not return negative startIndex', () => {
      virtualizer.updateScroll(-100);
      const state = virtualizer.getState();

      expect(state.startIndex).toBe(0);
    });

    it('should not exceed item count for endIndex', () => {
      virtualizer.updateScroll(10000);
      const state = virtualizer.getState();

      expect(state.endIndex).toBeLessThanOrEqual(99);
    });
  });

  describe('updateScroll()', () => {
    it('should update scroll position', () => {
      virtualizer.updateScroll(500);
      const state = virtualizer.getState();

      expect(state.startIndex).toBeGreaterThan(0);
    });

    it('should handle zero scroll', () => {
      virtualizer.updateScroll(0);
      const state = virtualizer.getState();

      expect(state.startIndex).toBe(0);
    });
  });

  describe('updateContainerHeight()', () => {
    it('should update container height', () => {
      virtualizer.updateContainerHeight(1000);
      virtualizer.updateScroll(0);
      const state = virtualizer.getState();

      expect(state.virtualItems.length).toBeGreaterThan(19); // More items visible
    });
  });

  describe('updateItemCount()', () => {
    it('should update item count', () => {
      virtualizer.updateItemCount(200);
      const state = virtualizer.getState();

      expect(state.totalHeight).toBe(8800); // 200 * 44
    });

    it('should handle reducing item count', () => {
      virtualizer.updateScroll(0);
      virtualizer.updateItemCount(10);
      const state = virtualizer.getState();

      expect(state.endIndex).toBe(9);
    });
  });

  describe('scrollToIndex()', () => {
    it('should calculate correct scroll position', () => {
      const scrollPos = virtualizer.scrollToIndex(10);

      expect(scrollPos).toBe(440); // 10 * 44
    });

    it('should handle index 0', () => {
      const scrollPos = virtualizer.scrollToIndex(0);

      expect(scrollPos).toBe(0);
    });

    it('should handle out-of-bounds index (negative)', () => {
      const scrollPos = virtualizer.scrollToIndex(-5);

      expect(scrollPos).toBe(-220); // -5 * 44
    });

    it('should handle index beyond item count', () => {
      const scrollPos = virtualizer.scrollToIndex(200);

      expect(scrollPos).toBe(8800); // Still calculates position
    });

    it('should use current itemHeight', () => {
      const v = new HeadlessVirtualizer({ itemCount: 100, itemHeight: 50 });
      const scrollPos = v.scrollToIndex(5);

      expect(scrollPos).toBe(250); // 5 * 50
    });
  });

  describe('virtualItems structure', () => {
    it('should have correct index in virtualItems', () => {
      virtualizer.updateScroll(200);
      const state = virtualizer.getState();

      state.virtualItems.forEach((item, i) => {
        expect(item.index).toBe(state.startIndex + i);
      });
    });

    it('should have correct start position in virtualItems', () => {
      const state = virtualizer.getState();

      state.virtualItems.forEach((item) => {
        expect(item.start).toBe(item.index * 44);
      });
    });
  });
});
