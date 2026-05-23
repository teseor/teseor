import { useEffect, useRef } from "react";
import { createFocusTrap, type FocusTrapOptions } from "./index.ts";

/**
 * React adapter for {@link createFocusTrap}.
 *
 * While `active` is true and `container` is non-null, focus is confined to
 * the element. Pass the element directly (typically from a state-driven
 * callback ref, e.g. `useState<HTMLElement | null>(null)` plus `ref={setEl}`)
 * so the effect re-runs when the element itself changes — a `RefObject` is
 * stable across renders and silently skips element swaps.
 *
 * Options are captured at activation time; pass a new object to re-configure
 * on the next activation cycle.
 */
export function useFocusTrap(
  container: HTMLElement | null,
  active: boolean,
  options?: FocusTrapOptions,
): void {
  // Stable ref so a fresh-object-literal options on every render does not
  // re-run the effect; the trap reads options lazily at activate/deactivate.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!active || !container) return;
    const trap = createFocusTrap(container, optionsRef.current);
    trap.activate();
    return () => {
      trap.deactivate();
    };
  }, [active, container]);
}
