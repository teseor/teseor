import { warnOnce } from "@teseor/primitives";
import { cloneVNode, defineComponent } from "vue";

type EventHandler = (...args: unknown[]) => void;

/**
 * Mirrors Vue's internal `isOn` (`@vue/shared`): char 0/1 are `o`/`n` and
 * char 2 is not a lowercase letter (uppercase, digit, or `:` for
 * `onUpdate:*`). Narrower than `startsWith("on")` so we don't wrap props
 * like `onboardingSteps` whose value happens to be an array.
 */
const isVueListenerKey = (key: string): boolean =>
  key.charCodeAt(0) === 111 &&
  key.charCodeAt(1) === 110 &&
  (key.charCodeAt(2) > 122 || key.charCodeAt(2) < 97);

/**
 * Renders the default slot's first VNode with merged attrs from the parent —
 * Vue equivalent of React's `cloneElement` Slot. Used by composite wrappers
 * when `asChild` is true so the consumer's element receives event handlers,
 * `aria-describedby`, and the anchor binding instead of an extra `<span>`.
 *
 * Drops symbol-typed VNodes (Comment, Text, Fragment) so v-if branches and
 * `<><a/><b/></>` wrappers don't pass the single-child invariant. Passes
 * `attrs` straight to `cloneVNode` — pre-merging via `mergeProps` would
 * double event handlers since `cloneVNode` already merges internally.
 *
 * Wraps composed `on*` handler arrays so a child handler's `preventDefault()`
 * or `stopImmediatePropagation()` short-circuits the slot handler (React-parity,
 * #684). Vue's `mergeProps` orders the array as `[childHandler, attrHandler]`;
 * single handlers (only child or only attrs) stay as plain functions and are
 * left untouched.
 *
 * Replacing the array with a single function bypasses Vue runtime-dom's
 * `patchStopImmediatePropagation`, which would otherwise set `event._stopped`
 * on a `stopImmediatePropagation()` call and skip subsequent array entries.
 * Install the same override locally so the short-circuit still fires.
 */
export const Slot = defineComponent({
  name: "Slot",
  inheritAttrs: false,
  setup(_, { slots, attrs }) {
    return () => {
      const vnodes = (slots.default?.() ?? []).filter((v) => typeof v.type !== "symbol");
      if (vnodes.length !== 1) {
        warnOnce(
          "vue.slot.multi-child",
          `Slot: expected exactly one VNode child, got ${vnodes.length}. Pass a single element or drop \`asChild\`.`,
        );
        return null;
      }
      const child = vnodes[0];
      if (!child) return null;
      const cloned = cloneVNode(child, attrs);
      const props = cloned.props;
      if (props) {
        for (const key of Object.keys(props)) {
          if (!isVueListenerKey(key)) continue;
          const value = props[key];
          if (!Array.isArray(value)) continue;
          const handlers = value.filter((fn): fn is EventHandler => typeof fn === "function");
          if (handlers.length === 0) continue;
          props[key] = (...args: unknown[]) => {
            const event = args[0] as
              | { defaultPrevented?: boolean; _stopped?: boolean; stopImmediatePropagation?: () => void }
              | undefined;
            if (event && typeof event.stopImmediatePropagation === "function" && !event._stopped) {
              const originalStop = event.stopImmediatePropagation.bind(event);
              event.stopImmediatePropagation = () => {
                originalStop();
                event._stopped = true;
              };
            }
            for (const fn of handlers) {
              if (event?._stopped === true) return;
              fn(...args);
              if (event?.defaultPrevented === true) return;
            }
          };
        }
      }
      return cloned;
    };
  },
});
