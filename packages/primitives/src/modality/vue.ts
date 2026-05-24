import { onBeforeUnmount, type Ref, watch } from "vue";
import { createModalityScope, type ModalityScope } from "./index.ts";

/**
 * Vue adapter for {@link createModalityScope}.
 *
 * While `active.value` is true and `elementRef.value` is non-null, a modality
 * scope is subscribed: every direct `<body>` child whose subtree does not
 * contain the element gets `inert=""`. Re-subscribes when the element changes
 * or `active` toggles, and tears down on component unmount.
 *
 * `flush: "post"` matches the dismissable-layer adapter — the DOM has mounted
 * before the watcher fires, so `elementRef.value` resolves to the real node.
 */
export function useModalityScope(elementRef: Ref<HTMLElement | null>, active: Ref<boolean>): void {
  let scope: ModalityScope | null = null;

  function teardown(): void {
    if (scope) {
      scope.deactivate();
      scope = null;
    }
  }

  watch(
    [elementRef, active],
    ([element, isActive]) => {
      teardown();
      if (isActive && element) {
        scope = createModalityScope(element);
        scope.activate();
      }
    },
    { immediate: true, flush: "post" },
  );

  onBeforeUnmount(teardown);
}
