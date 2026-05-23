import { type RefObject, useEffect, useRef } from "react";
import { createFocusTrap, type FocusTrapOptions } from "./index.ts";

/**
 * React adapter for {@link createFocusTrap}.
 *
 * While `active` is true, focus is confined to `containerRef.current`. The
 * trap activates on mount (or when `active` flips to true), deactivates on
 * unmount (or when `active` flips to false), and restores focus to wherever
 * it came from.
 *
 * Options are captured at activation time. Pass a new object to re-configure
 * on the next activation cycle; mid-cycle changes are not reread.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
  options?: FocusTrapOptions,
): void {
  // Stable ref so a fresh-object-literal options on every render does not
  // re-run the effect; the trap reads options lazily at activate/deactivate.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;
    const trap = createFocusTrap(container, optionsRef.current);
    trap.activate();
    return () => {
      trap.deactivate();
    };
  }, [active, containerRef]);
}
