import { onBeforeUnmount, type Ref, watch } from "vue";
import {
  createDismissableLayer,
  type DismissableLayer,
  type DismissableLayerOptions,
} from "./index.ts";

/**
 * Vue adapter for {@link createDismissableLayer}.
 *
 * While `active` is true and `elementRef.value` is non-null, a dismiss-
 * notifying layer is subscribed. Re-subscribes when the element changes or
 * `active` toggles, and tears down on component unmount.
 *
 * `setup()` runs once, so the `options` callbacks are captured at first
 * call. If you need a callback to react to state, close over `ref`s or
 * `reactive` values declared in `setup()` scope — Vue will see live values
 * each time the callback fires.
 */
export function useDismissableLayer(
  elementRef: Ref<HTMLElement | null>,
  active: Ref<boolean>,
  options: DismissableLayerOptions = {},
): void {
  let layer: DismissableLayer | null = null;

  function teardown(): void {
    if (layer) {
      layer.destroy();
      layer = null;
    }
  }

  watch(
    [elementRef, active],
    ([element, isActive]) => {
      teardown();
      if (isActive && element) {
        layer = createDismissableLayer(element, options);
      }
    },
    { immediate: true, flush: "post" },
  );

  onBeforeUnmount(teardown);
}
