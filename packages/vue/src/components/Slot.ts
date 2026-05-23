import { warnOnce } from "@teseor/primitives";
import { cloneVNode, defineComponent } from "vue";

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
      return cloneVNode(child, attrs);
    };
  },
});
