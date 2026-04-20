import { describe, it, expect } from 'vitest';
import {
  getPageData,
  calculatePages,
  getPageNumbers,
  PageInfo,
} from '../../../templates/shared/utils/table-paginator';

describe('table-paginator', () => {
  describe('calculatePages()', () => {
    it('should calculate correct number of pages', () => {
      expect(calculatePages(100, 10)).toBe(10);
      expect(calculatePages(99, 10)).toBe(10);
      expect(calculatePages(101, 10)).toBe(11);
    });

    it('should handle zero items', () => {
      expect(calculatePages(0, 10)).toBe(0);
    });

    it('should handle zero page size', () => {
      expect(calculatePages(100, 0)).toBe(0);
    });

    it('should handle negative values', () => {
      expect(calculatePages(-10, 10)).toBe(0);
      expect(calculatePages(100, -5)).toBe(0);
    });

    it('should handle page size larger than items', () => {
      expect(calculatePages(5, 10)).toBe(1);
    });

    it('should handle single item', () => {
      expect(calculatePages(1, 10)).toBe(1);
    });
  });

  describe('getPageData()', () => {
    const testData = Array.from({ length: 100 }, (_, i) => ({ id: i + 1, value: i }));

    describe('client-side pagination', () => {
      it('should return first page by default', () => {
        const result = getPageData(testData, 1, 10);

        expect(result.data.length).toBe(10);
        expect(result.data[0].id).toBe(1);
        expect(result.data[9].id).toBe(10);
      });

      it('should return correct page', () => {
        const result = getPageData(testData, 3, 10);

        expect(result.data.length).toBe(10);
        expect(result.data[0].id).toBe(21);
        expect(result.data[9].id).toBe(30);
      });

      it('should handle last page with fewer items', () => {
        const result = getPageData(testData, 10, 10);

        expect(result.data.length).toBe(10);
        expect(result.data[0].id).toBe(91);
        expect(result.data[9].id).toBe(100);
      });

      it('should handle page beyond available', () => {
        const result = getPageData(testData, 15, 10);

        // Should clamp to last page
        expect(result.pageInfo.page).toBe(10);
        expect(result.data.length).toBe(10);
      });

      it('should handle page before first', () => {
        const result = getPageData(testData, 0, 10);

        // Should clamp to first page
        expect(result.pageInfo.page).toBe(1);
        expect(result.data.length).toBe(10);
      });
    });

    describe('pageInfo', () => {
      it('should have correct page info for first page', () => {
        const result = getPageData(testData, 1, 10);

        expect(result.pageInfo.page).toBe(1);
        expect(result.pageInfo.pageSize).toBe(10);
        expect(result.pageInfo.totalItems).toBe(100);
        expect(result.pageInfo.totalPages).toBe(10);
        expect(result.pageInfo.startIndex).toBe(0);
        expect(result.pageInfo.endIndex).toBe(10);
        expect(result.pageInfo.hasNextPage).toBe(true);
        expect(result.pageInfo.hasPrevPage).toBe(false);
      });

      it('should have correct page info for middle page', () => {
        const result = getPageData(testData, 5, 10);

        expect(result.pageInfo.page).toBe(5);
        expect(result.pageInfo.startIndex).toBe(40);
        expect(result.pageInfo.endIndex).toBe(50);
        expect(result.pageInfo.hasNextPage).toBe(true);
        expect(result.pageInfo.hasPrevPage).toBe(true);
      });

      it('should have correct page info for last page', () => {
        const result = getPageData(testData, 10, 10);

        expect(result.pageInfo.page).toBe(10);
        expect(result.pageInfo.startIndex).toBe(90);
        expect(result.pageInfo.endIndex).toBe(100);
        expect(result.pageInfo.hasNextPage).toBe(false);
        expect(result.pageInfo.hasPrevPage).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('should handle empty data', () => {
        const result = getPageData([], 1, 10);

        expect(result.data.length).toBe(0);
        expect(result.pageInfo.totalItems).toBe(0);
        expect(result.pageInfo.totalPages).toBe(0);
        expect(result.pageInfo.hasNextPage).toBe(false);
        expect(result.pageInfo.hasPrevPage).toBe(false);
      });

      it('should handle single item data', () => {
        const result = getPageData([{ id: 1 }], 1, 10);

        expect(result.data.length).toBe(1);
        expect(result.pageInfo.totalPages).toBe(1);
        expect(result.pageInfo.hasNextPage).toBe(false);
      });

      it('should handle large page size (more than items)', () => {
        const result = getPageData(testData, 1, 200);

        expect(result.data.length).toBe(100);
        expect(result.pageInfo.totalPages).toBe(1);
      });

      it('should handle page size of 1', () => {
        const result = getPageData(testData, 50, 1);

        expect(result.data.length).toBe(1);
        expect(result.pageInfo.totalPages).toBe(100);
        expect(result.pageInfo.startIndex).toBe(49);
        expect(result.pageInfo.endIndex).toBe(50);
      });

      it('should not mutate original array', () => {
        const original = [...testData];
        getPageData(testData, 2, 10);
        expect(testData).toEqual(original);
      });
    });
  });

  describe('getPageNumbers()', () => {
    it('should return all pages when less than max visible', () => {
      const result = getPageNumbers(1, 3);
      expect(result).toEqual([1, 2, 3]);
    });

    it('should return all pages when equal to max visible', () => {
      const result = getPageNumbers(2, 5);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should center on current page when possible', () => {
      const result = getPageNumbers(5, 10);
      expect(result).toEqual([3, 4, 5, 6, 7]);
    });

    it('should handle current page near start', () => {
      const result = getPageNumbers(2, 10);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle current page near end', () => {
      const result = getPageNumbers(9, 10);
      expect(result).toEqual([6, 7, 8, 9, 10]);
    });

    it('should handle first page', () => {
      const result = getPageNumbers(1, 10);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle last page', () => {
      const result = getPageNumbers(10, 10);
      expect(result).toEqual([6, 7, 8, 9, 10]);
    });

    describe('edge cases', () => {
      it('should handle single page', () => {
        const result = getPageNumbers(1, 1);
        expect(result).toEqual([1]);
      });

      it('should handle zero pages', () => {
        const result = getPageNumbers(1, 0);
        expect(result).toEqual([]);
      });

      it('should handle current page beyond total', () => {
        const result = getPageNumbers(20, 10);
        expect(result).toEqual([6, 7, 8, 9, 10]);
      });

      it('should handle current page before first', () => {
        const result = getPageNumbers(0, 10);
        expect(result).toEqual([1, 2, 3, 4, 5]);
      });

      it('should use custom max visible', () => {
        const result = getPageNumbers(5, 20, 3);
        expect(result).toEqual([4, 5, 6]);
      });

      it('should handle max visible of 1', () => {
        const result = getPageNumbers(5, 10, 1);
        expect(result).toEqual([5]);
      });
    });
  });
});
