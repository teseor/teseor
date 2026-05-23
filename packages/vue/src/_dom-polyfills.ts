/**
 * Test-controllable polyfills for the surfaces `_runtime.ts` touches:
 * Popover API, `:popover-open`, matchMedia change events, CSS.supports.
 * happy-dom stubs or skips them. Call `installDomPolyfills()` once per file
 * and `resetDomPolyfills()` in `afterEach`.
 */

type MatchMediaListener = (event: MediaQueryListEvent) => void;

type MatchMediaEntry = {
  query: string;
  matches: boolean;
  listeners: Set<MatchMediaListener>;
};

const POPOVER_STATE = new WeakMap<HTMLElement, boolean>();
const MATCH_MEDIA_ENTRIES = new Map<string, MatchMediaEntry>();
const MATCHING_QUERIES = new Set<string>();

// Treat the prototypes as loose records so we can swap descriptors without
// fighting the lib.dom overloaded signatures (Element.matches has 4).
type LooseProto = Record<string, unknown>;
const elementProto = Element.prototype as unknown as LooseProto;
const htmlProto = HTMLElement.prototype as unknown as LooseProto;
const cssLike = (globalThis as { CSS?: { supports?: (...args: unknown[]) => boolean } }).CSS;

let supportsPopoverOpenSelector = true;
let originalMatches: unknown;
let originalShowPopover: unknown;
let originalHidePopover: unknown;
let originalCssSupports: ((...args: unknown[]) => boolean) | undefined;
let originalMatchMedia: typeof window.matchMedia | undefined;
let installed = false;

/** Install onto `window` / `Element.prototype`. Idempotent. */
export function installDomPolyfills(): void {
  if (installed) return;
  installed = true;

  // Popover state per element; mirrored in the `:popover-open` matches override.
  originalShowPopover = htmlProto.showPopover;
  originalHidePopover = htmlProto.hidePopover;
  htmlProto.showPopover = function (this: HTMLElement) {
    POPOVER_STATE.set(this, true);
  };
  htmlProto.hidePopover = function (this: HTMLElement) {
    POPOVER_STATE.set(this, false);
  };

  // `:popover-open` resolves via tracked state; throw SyntaxError when the
  // flag is off to mirror engines without the pseudo-class.
  originalMatches = elementProto.matches;
  const baseMatches = originalMatches as ((selector: string) => boolean) | undefined;
  elementProto.matches = function (this: Element, selector: string): boolean {
    if (selector === ":popover-open") {
      if (!supportsPopoverOpenSelector) {
        throw new SyntaxError("':popover-open' is not a valid selector");
      }
      return POPOVER_STATE.get(this as HTMLElement) === true;
    }
    return baseMatches ? baseMatches.call(this, selector) : false;
  };

  // CSS.supports returns the flag for `:popover-open`; delegate everything else.
  let cssTarget = cssLike;
  if (!cssTarget) {
    cssTarget = { supports: () => true };
    (globalThis as { CSS?: typeof cssTarget }).CSS = cssTarget;
  }
  originalCssSupports = cssTarget.supports;
  cssTarget.supports = (...args: unknown[]): boolean => {
    const head = args[0];
    if (typeof head === "string" && head.includes(":popover-open")) {
      return supportsPopoverOpenSelector;
    }
    return originalCssSupports ? originalCssSupports.apply(cssTarget, args) : true;
  };

  // One entry per unique query; setMatchingMediaQueries notifies its listeners.
  originalMatchMedia = window.matchMedia;
  window.matchMedia = (query: string): MediaQueryList => {
    let entry = MATCH_MEDIA_ENTRIES.get(query);
    if (!entry) {
      entry = { query, matches: MATCHING_QUERIES.has(query), listeners: new Set() };
      MATCH_MEDIA_ENTRIES.set(query, entry);
    }
    const trackedEntry = entry;
    const mql: Partial<MediaQueryList> & { addEventListener: MediaQueryList["addEventListener"] } =
      {
        get matches() {
          return trackedEntry.matches;
        },
        media: query,
        onchange: null,
        addEventListener: ((type: string, listener: EventListenerOrEventListenerObject | null) => {
          if (type !== "change" || typeof listener !== "function") return;
          trackedEntry.listeners.add(listener as MatchMediaListener);
        }) as MediaQueryList["addEventListener"],
        removeEventListener: ((
          type: string,
          listener: EventListenerOrEventListenerObject | null,
        ) => {
          if (type !== "change" || typeof listener !== "function") return;
          trackedEntry.listeners.delete(listener as MatchMediaListener);
        }) as MediaQueryList["removeEventListener"],
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => true,
      };
    return mql as MediaQueryList;
  };
}

/** Reset to install-time state. Call in `afterEach`. */
export function resetDomPolyfills(): void {
  supportsPopoverOpenSelector = true;
  MATCH_MEDIA_ENTRIES.clear();
  MATCHING_QUERIES.clear();
  // POPOVER_STATE is a WeakMap; entries die with the element.
}

/**
 * Set the matching query set. Works before or after `matchMedia` registers a
 * query; pre-existing entries flip and fire listeners, new entries pick it up.
 */
export function setMatchingMediaQueries(queries: readonly string[]): void {
  MATCHING_QUERIES.clear();
  for (const q of queries) MATCHING_QUERIES.add(q);
  for (const [query, entry] of MATCH_MEDIA_ENTRIES) {
    const next = MATCHING_QUERIES.has(query);
    if (entry.matches === next) continue;
    entry.matches = next;
    const event = { matches: next, media: query } as MediaQueryListEvent;
    for (const listener of entry.listeners) listener(event);
  }
}

/** Toggle `:popover-open` support (CSS.supports + Element.matches). */
export function setSupportsPopoverOpenSelector(value: boolean): void {
  supportsPopoverOpenSelector = value;
}

/** Tracked Popover state for an element. Test-only. */
export function isPopoverShown(node: HTMLElement): boolean {
  return POPOVER_STATE.get(node) === true;
}

/** Restore originals. Rarely needed — vitest tears down between files. */
export function uninstallDomPolyfills(): void {
  if (!installed) return;
  installed = false;
  if (originalMatches) elementProto.matches = originalMatches;
  if (originalShowPopover) htmlProto.showPopover = originalShowPopover;
  else delete htmlProto.showPopover;
  if (originalHidePopover) htmlProto.hidePopover = originalHidePopover;
  else delete htmlProto.hidePopover;
  if (cssLike && originalCssSupports) cssLike.supports = originalCssSupports;
  if (originalMatchMedia) window.matchMedia = originalMatchMedia;
}
