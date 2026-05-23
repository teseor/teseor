// Confines keyboard focus to a container. Vanilla DOM; framework adapters
// under ./react and ./vue wrap this for component lifecycles.

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]:not([contenteditable="false"])',
].join(",");

export type FocusTrapOptions = {
  /** Where to send focus on activate. Default: first focusable inside the container, falling back to the container itself. `false` skips initial focus. */
  initialFocus?: HTMLElement | (() => HTMLElement | null) | false;
  /** Where to send focus on deactivate. Default: the element focused before activate. `false` skips restoration. */
  returnFocus?: HTMLElement | (() => HTMLElement | null) | false;
};

export type FocusTrap = {
  activate: () => void;
  deactivate: () => void;
};

function isHTMLElement(value: unknown): value is HTMLElement {
  return value instanceof HTMLElement;
}

/** Returns focusable descendants of `container` in DOM order, skipping
 *  disabled inputs, anything inside an `[inert]` subtree, and elements
 *  whose computed `tabIndex` is negative (e.g. `tabindex="-2"`). */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => el.tabIndex >= 0 && !el.closest("[inert]"),
  );
}

/**
 * Cycles Tab/Shift+Tab inside `container`. Tab from the last focusable wraps
 * to the first; Shift+Tab from the first wraps to the last. Focus escaping
 * the container is pulled back to the first focusable. On deactivate, focus
 * returns to wherever it came from (overridable via `returnFocus`).
 *
 * The trap does not handle ESC, click-outside, or portal placement — those
 * are separate primitives. Composing a Popover means activating a focus trap
 * inside a portal with a dismissable layer wrapping both.
 */
export function createFocusTrap(container: HTMLElement, options: FocusTrapOptions = {}): FocusTrap {
  let previouslyFocused: HTMLElement | null = null;
  let active = false;
  let temporaryTabindex = false;

  function ensureContainerFocusable(): void {
    if (!container.hasAttribute("tabindex")) {
      container.setAttribute("tabindex", "-1");
      temporaryTabindex = true;
    }
  }

  function focusFallback(): void {
    const focusables = getFocusableElements(container);
    const next = focusables[0];
    if (next) {
      next.focus();
      return;
    }
    ensureContainerFocusable();
    container.focus();
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key !== "Tab") return;
    const focusables = getFocusableElements(container);
    if (focusables.length === 0) {
      // No tabbable children — block Tab and keep focus inside the container.
      event.preventDefault();
      if (!container.contains(document.activeElement)) {
        ensureContainerFocusable();
        container.focus();
      }
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (!first || !last) return;
    const activeEl = document.activeElement;
    if (!container.contains(activeEl)) {
      event.preventDefault();
      first.focus();
      return;
    }
    if (event.shiftKey && activeEl === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && activeEl === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleFocusIn(event: FocusEvent): void {
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (container.contains(target)) return;
    // Focus escaped via click, programmatic focus, or browser-native Tab —
    // pull it back. Tab keydown's handler runs first and already redirects,
    // so this is a no-op on that path.
    focusFallback();
  }

  function resolveInitial(): HTMLElement | null {
    const { initialFocus } = options;
    if (initialFocus === false) return null;
    if (typeof initialFocus === "function") return initialFocus();
    if (isHTMLElement(initialFocus)) return initialFocus;
    return getFocusableElements(container)[0] ?? container;
  }

  function resolveReturn(): HTMLElement | null {
    const { returnFocus } = options;
    if (returnFocus === false) return null;
    if (typeof returnFocus === "function") return returnFocus();
    if (isHTMLElement(returnFocus)) return returnFocus;
    return previouslyFocused;
  }

  function activate(): void {
    if (active) return;
    active = true;
    previouslyFocused = isHTMLElement(document.activeElement) ? document.activeElement : null;
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("focusin", handleFocusIn, true);
    const initial = resolveInitial();
    if (initial) {
      // Fall back to focusing the container itself when there's no other
      // candidate; ensureContainerFocusable cleans up the tabindex on deactivate.
      if (initial === container) {
        ensureContainerFocusable();
      }
      initial.focus();
    }
  }

  function deactivate(): void {
    if (!active) return;
    active = false;
    document.removeEventListener("keydown", handleKeyDown, true);
    document.removeEventListener("focusin", handleFocusIn, true);
    if (temporaryTabindex) {
      container.removeAttribute("tabindex");
      temporaryTabindex = false;
    }
    const ret = resolveReturn();
    ret?.focus();
    previouslyFocused = null;
  }

  return { activate, deactivate };
}
