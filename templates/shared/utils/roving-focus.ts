/**
 * Framework-agnostic roving-focus manager.
 *
 * Owns the ordered set of focusable items (keyed by a stable `value`), tracks which are
 * disabled, and moves DOM focus between the enabled ones with wrap-around. Shared by the
 * components that implement arrow-key / Home / End roving navigation (Accordion, Tabs,
 * RadioGroup, Select, DropdownMenu) so the index math + registration live in one place.
 *
 * Each framework instantiates one manager per component root and registers items as they
 * mount:
 *   - React:   hold it in a `useRef`; register in a ref callback, unregister on cleanup.
 *   - Vue:     create it in `setup`; register in `onMounted`, unregister in `onBeforeUnmount`.
 *   - Angular: a class field; register in `ngAfterViewInit`, unregister in `ngOnDestroy`.
 */
export interface RovingItem<K extends string | number = string> {
  value: K;
  disabled: boolean;
  el: HTMLElement | null;
}

/**
 * `K` is the item key type — `string` for value-keyed components (Accordion, Tabs,
 * RadioGroup) and `number` for index-keyed ones (DropdownMenu).
 */
export class RovingFocusManager<K extends string | number = string> {
  private items = new Map<K, RovingItem<K>>();
  private order: K[] = [];

  /**
   * Register (or update) an item. Passing `el === null` unregisters it — convenient for
   * frameworks that call the same hook on mount and unmount.
   */
  register(value: K, disabled: boolean, el: HTMLElement | null): void {
    if (el === null) {
      this.unregister(value);
      return;
    }
    if (!this.items.has(value)) {
      this.order.push(value);
    }
    this.items.set(value, { value, disabled, el });
  }

  unregister(value: K): void {
    this.items.delete(value);
    const idx = this.order.indexOf(value);
    if (idx >= 0) this.order.splice(idx, 1);
  }

  /** Item values in registration order, excluding disabled ones. */
  enabled(): K[] {
    return this.order.filter((v) => !this.items.get(v)?.disabled);
  }

  /** Move focus from `current` by `direction` (1 = next, -1 = previous), wrapping around.
   * If `current` isn't a known enabled item, lands on the first (next) or last (prev). */
  moveFocus(current: K, direction: 1 | -1): K | null {
    const enabled = this.enabled();
    if (enabled.length === 0) return null;
    const idx = enabled.indexOf(current);
    const nextIdx =
      idx === -1
        ? direction === 1
          ? 0
          : enabled.length - 1
        : (idx + direction + enabled.length) % enabled.length;
    const next = enabled[nextIdx];
    this.focus(next);
    return next;
  }

  /** Focus the first or last enabled item. */
  focusEdge(edge: 'first' | 'last'): K | null {
    const enabled = this.enabled();
    if (enabled.length === 0) return null;
    const next = edge === 'first' ? enabled[0] : enabled[enabled.length - 1];
    this.focus(next);
    return next;
  }

  /** Focus a specific item's element by value. */
  focus(value: K): void {
    this.items.get(value)?.el?.focus();
  }

  clear(): void {
    this.items.clear();
    this.order = [];
  }
}
