export interface VirtualState {
  startIndex: number;
  endIndex: number;
  totalHeight: number;
  offsetY: number;
  virtualItems: { index: number; start: number }[];
}

export interface HeadlessVirtualizerOptions {
  itemCount: number;
  itemHeight: number;
  overscan?: number;
  containerHeight?: number;
}

export class HeadlessVirtualizer {
  private itemCount: number;
  private itemHeight: number;
  private overscan: number;
  private containerHeight: number;
  private scrollTop: number = 0;

  constructor(options: HeadlessVirtualizerOptions) {
    this.itemCount = options.itemCount;
    this.itemHeight = options.itemHeight;
    this.overscan = options.overscan ?? 5;
    this.containerHeight = options.containerHeight ?? 600;
  }

  updateScroll(scrollTop: number): void {
    this.scrollTop = scrollTop;
  }

  updateContainerHeight(height: number): void {
    this.containerHeight = height;
  }

  updateItemCount(count: number): void {
    this.itemCount = count;
  }

  getState(): VirtualState {
    const startIndex = Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - this.overscan);
    const endIndex = Math.min(
      this.itemCount - 1,
      Math.ceil((this.scrollTop + this.containerHeight) / this.itemHeight) + this.overscan,
    );

    const virtualItems: { index: number; start: number }[] = [];
    for (let i = startIndex; i <= endIndex; i++) {
      virtualItems.push({
        index: i,
        start: i * this.itemHeight,
      });
    }

    const totalHeight = this.itemCount * this.itemHeight;
    const offsetY = startIndex * this.itemHeight;

    return {
      startIndex,
      endIndex,
      totalHeight,
      offsetY,
      virtualItems,
    };
  }

  scrollToIndex(index: number): number {
    return index * this.itemHeight;
  }
}
