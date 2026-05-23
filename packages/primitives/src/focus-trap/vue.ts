import { onBeforeUnmount, type Ref, watch } from "vue";
import { createFocusTrap, type FocusTrap, type FocusTrapOptions } from "./index.ts";

/**
 * Vue adapter for {@link createFocusTrap}.
 *
 * While `active` is true and `containerRef` is non-null, focus is confined
 * to the referenced element. The trap activates/deactivates as the inputs
 * change and deactivates on component unmount.
 *
 * Options are captured at activation time; pass a new object to re-configure
 * on the next activation cycle.
 */
export function useFocusTrap(
  containerRef: Ref<HTMLElement | null>,
  active: Ref<boolean>,
  options?: FocusTrapOptions,
): void {
  let trap: FocusTrap | null = null;

  function teardown(): void {
    if (trap) {
      trap.deactivate();
      trap = null;
    }
  }

  watch(
    [containerRef, active],
    ([container, isActive]) => {
      teardown();
      if (isActive && container) {
        trap = createFocusTrap(container, options);
        trap.activate();
      }
    },
    { immediate: true, flush: "post" },
  );

  onBeforeUnmount(teardown);
}
