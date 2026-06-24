import type { SlotInfo } from "../../../lib/collect-slots.ts";
import type { Spec } from "../../gen-contract.ts";

/** Emit one `{slot != null ? <span>…</span> : null}` block carrying the
 *  `data-{name}-{part}` and (optional) `data-position` hooks. */
export function renderSlot(spec: Spec, slot: SlotInfo): string {
  const posAttr = slot.position ? ` data-position="${slot.position}"` : "";
  return `      {${slot.propName} != null ? (
        <span data-${spec.name}-${slot.part}=""${posAttr}>
          {${slot.propName}}
        </span>
      ) : null}`;
}

/** Compose the JSX body for an atomic spec: start slots → middle slots
 *  (no position) → `{children}` (wrapped in `-label` when there's a loading
 *  state) → end slots → spinner. */
export function renderBody(spec: Spec, slots: SlotInfo[], hasLoading: boolean): string {
  return [
    ...slots.filter((s) => s.position === "start").map((s) => renderSlot(spec, s)),
    ...slots.filter((s) => s.position === undefined).map((s) => renderSlot(spec, s)),
    hasLoading ? `      <span data-${spec.name}-label="">{children}</span>` : `      {children}`,
    ...slots.filter((s) => s.position === "end").map((s) => renderSlot(spec, s)),
    hasLoading
      ? `      {loading ? <span data-${spec.name}-spinner="" aria-hidden="true" /> : null}`
      : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}
