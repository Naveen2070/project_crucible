import { describe, it, expect } from 'vitest';
import {
  sort,
  cycleSortDirection,
  SortDirection,
} from '../../../templates/shared/utils/table-sorter';

describe('table-sorter', () => {
  describe('sort()', () => {
    const testData = [
      { id: 1, name: 'Charlie', age: 30, joinedDate: '2023-01-15' },
      { id: 2, name: 'Alice', age: 25, joinedDate: '2022-06-20' },
      { id: 3, name: 'Bob', age: 35, joinedDate: '2024-03-10' },
      { id: 4, name: 'Diana', age: 28, joinedDate: '2023-11-05' },
    ];

    describe('string sorting', () => {
      it('should sort strings ascending', () => {
        const result = sort(testData, 'name', 'asc');
        expect(result[0].name).toBe('Alice');
        expect(result[1].name).toBe('Bob');
        expect(result[2].name).toBe('Charlie');
        expect(result[3].name).toBe('Diana');
      });

      it('should sort strings descending', () => {
        const result = sort(testData, 'name', 'desc');
        expect(result[0].name).toBe('Diana');
        expect(result[1].name).toBe('Charlie');
        expect(result[2].name).toBe('Bob');
        expect(result[3].name).toBe('Alice');
      });

      it('should handle case-insensitive sorting', () => {
        const data = [
          { id: 1, name: 'alice' },
          { id: 2, name: 'BOB' },
          { id: 3, name: 'Charlie' },
        ];
        const result = sort(data, 'name', 'asc');
        expect(result[0].name).toBe('alice');
        expect(result[1].name).toBe('BOB');
        expect(result[2].name).toBe('Charlie');
      });
    });

    describe('number sorting', () => {
      it('should sort numbers ascending', () => {
        const result = sort(testData, 'age', 'asc');
        expect(result[0].age).toBe(25);
        expect(result[1].age).toBe(28);
        expect(result[2].age).toBe(30);
        expect(result[3].age).toBe(35);
      });

      it('should sort numbers descending', () => {
        const result = sort(testData, 'age', 'desc');
        expect(result[0].age).toBe(35);
        expect(result[1].age).toBe(30);
        expect(result[2].age).toBe(28);
        expect(result[3].age).toBe(25);
      });
    });

    describe('date sorting', () => {
      it('should sort dates ascending', () => {
        const result = sort(testData, 'joinedDate', 'asc');
        expect(result[0].joinedDate).toBe('2022-06-20');
        expect(result[1].joinedDate).toBe('2023-01-15');
        expect(result[2].joinedDate).toBe('2023-11-05');
        expect(result[3].joinedDate).toBe('2024-03-10');
      });

      it('should sort dates descending', () => {
        const result = sort(testData, 'joinedDate', 'desc');
        expect(result[0].joinedDate).toBe('2024-03-10');
        expect(result[1].joinedDate).toBe('2023-11-05');
        expect(result[2].joinedDate).toBe('2023-01-15');
        expect(result[3].joinedDate).toBe('2022-06-20');
      });
    });

    describe('edge cases', () => {
      it('should handle mixed types (numbers and strings)', () => {
        const data = [
          { id: 1, value: 100 },
          { id: 2, value: 'banana' },
          { id: 3, value: 50 },
          { id: 4, value: 'apple' },
        ];
        const result = sort(data, 'value', 'asc');
        // Should fall back to string comparison
        expect(result[0].value).toBe(50);
        expect(result[1].value).toBe(100);
        expect(result[2].value).toBe('apple');
        expect(result[3].value).toBe('banana');
      });

      it('should handle empty strings', () => {
        const data = [
          { id: 1, name: '' },
          { id: 2, name: 'Bob' },
          { id: 3, name: 'Alice' },
        ];
        const result = sort(data, 'name', 'asc');
        expect(result[0].name).toBe('');
        expect(result[1].name).toBe('Alice');
        expect(result[2].name).toBe('Bob');
      });

      it('should handle special characters', () => {
        const data = [
          { id: 1, name: 'Über' },
          { id: 2, name: 'Ångström' },
          { id: 3, name: 'Zebra' },
        ];
        const result = sort(data, 'name', 'asc');
        // Should use localeCompare which handles special chars
        expect(result.length).toBe(3);
      });

      it('should handle empty array', () => {
        const result = sort([], 'name', 'asc');
        expect(result).toEqual([]);
      });

      it('should handle single item', () => {
        const data = [{ id: 1, name: 'Only' }];
        const result = sort(data, 'name', 'asc');
        expect(result.length).toBe(1);
        expect(result[0].name).toBe('Only');
      });

      it('should return original array when key is empty', () => {
        const result = sort(testData, '', 'asc');
        expect(result).toEqual(testData);
      });

      it('should return original array when direction is invalid', () => {
        const result = sort(testData, 'name', '' as any);
        expect(result).toEqual(testData);
      });

      it('should not mutate original array', () => {
        const original = [...testData];
        sort(testData, 'name', 'asc');
        expect(testData).toEqual(original);
      });
    });
  });

  describe('cycleSortDirection()', () => {
    it('should return asc when current is null', () => {
      expect(cycleSortDirection(null)).toBe('asc');
    });

    it('should return desc when current is asc', () => {
      expect(cycleSortDirection('asc')).toBe('desc');
    });

    it('should return asc when current is desc', () => {
      expect(cycleSortDirection('desc')).toBe('asc');
    });
  });
});
