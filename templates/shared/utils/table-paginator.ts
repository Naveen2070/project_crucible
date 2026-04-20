export interface PageInfo {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginationResult<T> {
  data: T[];
  pageInfo: PageInfo;
}

export function calculatePages(totalItems: number, pageSize: number): number {
  if (totalItems <= 0 || pageSize <= 0) return 0;
  return Math.ceil(totalItems / pageSize);
}

export function getPageData<T>(data: T[], page: number, pageSize: number): PaginationResult<T> {
  const totalItems = data.length;
  const totalPages = calculatePages(totalItems, pageSize);

  const safePage = Math.max(1, Math.min(page, totalPages || 1));
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const pageData = data.slice(startIndex, endIndex);

  return {
    data: pageData,
    pageInfo: {
      page: safePage,
      pageSize,
      totalItems,
      totalPages,
      startIndex,
      endIndex,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1,
    },
  };
}

export function getPageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5,
): number[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const half = Math.floor(maxVisible / 2);
  let start = currentPage - half;
  let end = currentPage + half;

  if (start < 1) {
    start = 1;
    end = maxVisible;
  }

  if (end > totalPages) {
    end = totalPages;
    start = totalPages - maxVisible + 1;
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}
