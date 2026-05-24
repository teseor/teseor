import { useEffect } from "react";
import { createModalityScope } from "./index.ts";

/**
 * React adapter for {@link createModalityScope}.
 *
 * While `active` is true and `element` is non-null, a modality scope is
 * subscribed: every direct `<body>` child whose subtree does not contain
 * `element` gets `inert=""`. Cleanup restores them. Pass the element directly
 * (e.g. from a state-driven callback ref) so the effect re-runs when the
 * element itself changes; a `RefObject` is stable across renders and silently
 * skips element swaps.
 */
export function useModalityScope(element: HTMLElement | null, active: boolean): void {
  useEffect(() => {
    if (!active || !element) return;
    const scope = createModalityScope(element);
    scope.activate();
    return () => {
      scope.deactivate();
    };
  }, [active, element]);
}
