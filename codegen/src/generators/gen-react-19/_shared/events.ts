// Shared rendering for the consumer event surface. One per-event prop per
// declared event, plus a single `onEvent` discriminated channel that fires
// for both declared events and controllable mirrors. The composite-overlay
// renderer composes these into the wrapper template; future composite
// kinds (list / atomic) reuse the same helpers.
//
// Three blocks come out of here:
//
//   1. `renderEventPropLines` — the per-event prop type lines that go inside
//      `<Name>OwnProps`. Each declared event becomes `on<Name>?: (e: { … }) => void`.
//      Empty-payload events emit `() => void` so consumers don't take an
//      unused argument.
//   2. `renderChannelPropLines` — the `onEvent` prop type lines plus JSDoc.
//      Always present when at least one event is declared.
//   3. `renderEventHandlerBodies` — the wrapper-body `useCallback` blocks
//      that thread the per-event prop -> channel ordering. The wrapper
//      passes the wrapped `handle<Event>` to `useOverlay` (adapted from the
//      runtime's `reason: string` shape to the consumer's `{ reason }`
//      shape) and uses the wrapped `handle<Controllable>Change` as the
//      hook's `on<Controllable>Change` callback.

import { pascalCase } from "../../../lib/pascal-case.ts";
import { renderPayloadFields } from "../../gen-contract/_shared/payload-printer.ts";
import type { Spec } from "../../gen-contract.ts";

/** Names of declared events on a spec, in declaration order. */
export function declaredEventNames(spec: Spec): string[] {
  return Object.keys(spec.events ?? {});
}

/** Returns true when the spec declares at least one event. */
export function hasEventsBlock(spec: Spec): boolean {
  return declaredEventNames(spec).length > 0;
}

/** Per-event prop lines, indented for the OwnProps block. Each entry carries
 *  the spec's `description` as JSDoc. Empty-payload events emit `() => void`. */
export function renderEventPropLines(spec: Spec): string[] {
  const events = spec.events ?? {};
  const lines: string[] = [];
  for (const eventName of Object.keys(events)) {
    const entry = events[eventName];
    if (!entry) continue;
    const fields = renderPayloadFields(entry.payload ?? {});
    const sig = fields ? `(e: { ${fields} }) => void` : `() => void`;
    const handlerName = `on${pascalCase(eventName)}`;
    if (entry.description) lines.push(`  /** ${entry.description} */`);
    lines.push(`  ${handlerName}?: ${sig};`);
  }
  return lines;
}

/** The `onEvent` channel prop line(s). Returns an empty array when the spec
 *  has no events. The TS type name (`<Name>Event`) is pulled from the
 *  contract package; the wrapper imports it alongside its other contract
 *  types at the top of the file. */
export function renderChannelPropLines(spec: Spec, Name: string): string[] {
  if (!hasEventsBlock(spec)) return [];
  const genericNames = (spec.generics ?? []).map((g) => g.name);
  const params = genericNames.length > 0 ? `<${genericNames.join(", ")}>` : "";
  return [
    `  /** Aggregated event channel: fires for every declared event and every`,
    `   *  controllable state mirror. Per-emission ordering: declared event prop →`,
    `   *  channel → controllable callback → channel. */`,
    `  onEvent?: (e: ${Name}Event${params}) => void;`,
  ];
}

/**
 * Wrapped callback blocks for the wrapper body. Each block is a
 * `useCallback` declaration that fires consumer per-event then channel,
 * implementing the per-emission ordering: declared event prop → channel →
 * controllable callback → channel.
 *
 * Two kinds of wrappers come out of here:
 *
 *   - `handleDismiss`: runtime-shape adapter for the `dismiss` event the
 *     overlay-runtime emits (`(reason: "outside" | "escape" | "button")`)
 *     into the consumer-shape per-event prop (`onDismiss?: (e: { reason }) => void`)
 *     plus the channel arm. Only emitted when the spec declares `dismiss`.
 *
 *   - `handle<Controllable>Change`: state-mirror adapter for every
 *     controllable boolean prop the spec declares. Threads the channel
 *     emission after the consumer's `on<Controllable>Change` callback.
 *
 * Other declared events (`select`, `inputChange`, …) are NOT wrapped here
 * — the overlay runtime has no source for them in v1, so the per-event
 * prop is emitted on the surface but no auto-fire path exists. Adding a
 * runtime source means extending this helper plus the `useOverlay`
 * contract; the semantic-check layer rejects unsupported declarations
 * upstream so the gap can't ship silently.
 *
 * Generated shape (Modal example):
 *
 *   const handleDismiss = useCallback(
 *     (reason: "outside" | "escape" | "button") => {
 *       onDismiss?.({ reason });
 *       onEvent?.({ type: "dismiss", reason });
 *     },
 *     [onDismiss, onEvent],
 *   );
 *   const handleOpenChange = useCallback(
 *     (value: boolean) => {
 *       onOpenChange?.(value);
 *       onEvent?.({ type: "openChange", value });
 *     },
 *     [onOpenChange, onEvent],
 *   );
 */
export function renderEventHandlerBodies(
  spec: Spec,
  controllableBooleanProps: readonly string[],
): string {
  if (!hasEventsBlock(spec)) return "";
  const blocks: string[] = [];
  const events = spec.events ?? {};

  if (Object.hasOwn(events, "dismiss")) {
    const reasonEntry = events.dismiss?.payload?.reason;
    if (reasonEntry?.type !== "enum") {
      throw new Error(
        `events.dismiss must declare a payload field 'reason' of type enum (runtime adapter requires the enum values to type the reason argument).`,
      );
    }
    const reasonValues = reasonEntry.values.map((v) => JSON.stringify(v)).join(" | ");
    blocks.push(
      `  const handleDismiss = useCallback(\n` +
        `    (reason: ${reasonValues}) => {\n` +
        `      onDismiss?.({ reason });\n` +
        `      onEvent?.({ type: "dismiss", reason });\n` +
        `    },\n` +
        `    [onDismiss, onEvent],\n` +
        `  );`,
    );
  }

  for (const propName of controllableBooleanProps) {
    const PName = pascalCase(propName);
    const handlerName = `on${PName}Change`;
    const wrappedName = `handle${PName}Change`;
    blocks.push(
      `  const ${wrappedName} = useCallback(\n` +
        `    (value: boolean) => {\n` +
        `      ${handlerName}?.(value);\n` +
        `      onEvent?.({ type: "${propName}Change", value });\n` +
        `    },\n` +
        `    [${handlerName}, onEvent],\n` +
        `  );`,
    );
  }

  return blocks.join("\n");
}

/** Consumer-facing handler prop names (`onDismiss`, `onSelect`, …) — used by
 *  the wrapper template to destructure from props. */
export function consumerHandlerPropNames(spec: Spec): string[] {
  return declaredEventNames(spec).map((n) => `on${pascalCase(n)}`);
}

/** Wrapped handler names (`handleDismiss`, `handleSelect`, …) — used by the
 *  wrapper template to reference the local `useCallback` blocks. */
export function wrappedHandlerNames(spec: Spec): string[] {
  return declaredEventNames(spec).map((n) => `handle${pascalCase(n)}`);
}
