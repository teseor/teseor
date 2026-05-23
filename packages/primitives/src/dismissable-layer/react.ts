import { useEffect, useRef } from "react";
import { createDismissableLayer, type DismissableLayerOptions } from "./index.ts";

/**
 * React adapter for {@link createDismissableLayer}.
 *
 * While `active` is true and `element` is non-null, a dismiss-notifying
 * layer is subscribed. Pass the element directly (e.g. from a state-driven
 * callback ref, `useState<HTMLElement | null>(null)` plus `ref={setEl}`) so
 * the effect re-runs when the element itself changes; a `RefObject` is
 * stable across renders and silently skips element swaps.
 *
 * Callbacks are read through a stable ref so a fresh inline `{ onEscapeKeyDown,
 * ... }` object on every render does not destroy and re-subscribe the layer.
 */
export function useDismissableLayer(
  element: HTMLElement | null,
  active: boolean,
  options: DismissableLayerOptions = {},
): void {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!active || !element) return;
    const layer = createDismissableLayer(element, {
      onEscapeKeyDown: (event) => optionsRef.current.onEscapeKeyDown?.(event),
      onPointerDownOutside: (event) => optionsRef.current.onPointerDownOutside?.(event),
      onInteractOutside: (event) => optionsRef.current.onInteractOutside?.(event),
    });
    return () => {
      layer.destroy();
    };
  }, [active, element]);
}
