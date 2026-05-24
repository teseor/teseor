import type { SlotInfo } from "../../../lib/collect-slots.ts";
import type { Spec } from "../../gen-contract.ts";

/** Emit the `defineSlots<…>()` block — one entry per declared slot plus the
 *  always-present `default?(): VNode[]`. */
export function renderSlotsType(slots: SlotInfo[]): string {
  const slotLines = slots.map((s) => `  ${s.propName}?(): VNode[];`);
  return [`defineSlots<{`, `  default?(): VNode[];`, ...slotLines, `}>();`].join("\n");
}

/** Emit one `<span v-if="$slots.X">…</span>` wrapper around a named slot,
 *  carrying the `data-{name}-{part}` and (optional) `data-position` hooks. */
export function renderSlot(spec: Spec, slot: SlotInfo): string {
  const posAttr = slot.position ? ` data-position="${slot.position}"` : "";
  return `    <span v-if="$slots.${slot.propName}" data-${spec.name}-${slot.part}=""${posAttr}>
      <slot name="${slot.propName}" />
    </span>`;
}

/** Compose the template body for an atomic spec: start slots → middle slots
 *  (no position) → `<slot />` (wrapped in `-label` when there's a loading
 *  state) → end slots → spinner. */
export function renderBody(spec: Spec, slots: SlotInfo[], hasLoading: boolean): string {
  return [
    ...slots.filter((s) => s.position === "start").map((s) => renderSlot(spec, s)),
    ...slots.filter((s) => s.position === undefined).map((s) => renderSlot(spec, s)),
    hasLoading ? `    <span data-${spec.name}-label=""><slot /></span>` : `    <slot />`,
    ...slots.filter((s) => s.position === "end").map((s) => renderSlot(spec, s)),
    hasLoading
      ? `    <span v-if="loading" data-${spec.name}-spinner="" aria-hidden="true" />`
      : null,
  ]
    .filter((l): l is string => l !== null)
    .join("\n");
}
