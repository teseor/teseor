import type { Issue } from "../../../core/check-utils.ts";
import { isComposite, issue } from "../../../core/check-utils.ts";
import type { Spec } from "../../../core/schema.ts";

/**
 * Runtime-source check for declared events.
 *
 * `gen-contract` produces type surfaces for any declared event, but a
 * wrapper-runtime auto-fire path exists only for a small subset today. The
 * audit principle:
 * either the generator fires the event, or the semantic check rejects the
 * declaration. Without this rule, a spec can declare `select` /
 * `inputChange` / `rowClick`; consumers see the per-event prop on the
 * surface; the prop never fires from the wrapper.
 *
 * v1 supports `dismiss` only, only on overlay composites. Other declared
 * events must wait until their runtime source ships in the matching
 * `gen-*` template.
 */
export function checkEventsRuntimeSupport(spec: Spec): Issue[] {
  const events = spec.events;
  if (!events || Object.keys(events).length === 0) return [];
  const issues: Issue[] = [];

  // Today's runtime-supported event sources, scoped to spec shapes the
  // generator actually emits firing code for. Extending this set means
  // adding the firing path in the matching generator template + updating
  // this list in the same change. `supportsGenerics` tracks whether the
  // generated wrapper declares type parameters on its props / signature —
  // composite-overlay wrappers don't today, so a spec with `events:` AND
  // `generics:` would emit references to undeclared identifiers.
  const SUPPORTED_BY_SHAPE: ReadonlyArray<{
    matches: (s: Spec) => boolean;
    events: ReadonlyArray<string>;
    shape: string;
    supportsGenerics: boolean;
  }> = [
    {
      matches: (s) => isComposite(s) && Object.values(s.parts).some((p) => p.overlay !== undefined),
      events: ["dismiss"],
      shape: "composite-overlay",
      supportsGenerics: false,
    },
  ];

  // Per-event runtime payload contract — the closed-set values the wrapper
  // runtime actually fires. A spec whose payload diverges from this set
  // would produce a generated wrapper whose handler signature can't be
  // passed to the runtime hook (TS error downstream). Reject at the spec
  // layer with a clear path.
  const REQUIRED_REASON_VALUES: Record<string, ReadonlySet<string>> = {
    dismiss: new Set(["outside", "escape", "button"]),
  };

  const shape = SUPPORTED_BY_SHAPE.find((s) => s.matches(spec));

  // Generics + events combo: the wrapper template must declare the generic
  // parameters on its props and component signature for the emitted type
  // references to resolve. Until each shape's template gains that support,
  // reject the combination here so consumers don't ship a contract that
  // compiles in isolation but fails in the wrapper.
  const hasGenerics = (spec.generics ?? []).length > 0;
  if (shape && hasGenerics && !shape.supportsGenerics) {
    issues.push(
      issue(
        spec.name,
        "generics",
        `${shape.shape} wrappers do not declare generic type parameters yet, so an events: block together with generics: would emit undeclared identifiers in the React wrapper. Remove generics: or wait for the wrapper-template generic-parameter pass.`,
      ),
    );
  }

  for (const name of Object.keys(events)) {
    if (!shape) {
      issues.push(
        issue(
          spec.name,
          `events.${name}`,
          `Declared events are not supported on this spec shape yet. v1 supports composite-overlay specs and the 'dismiss' event only. Remove the events: block or migrate the spec to an overlay composite.`,
        ),
      );
      continue;
    }
    if (!shape.events.includes(name)) {
      const supported = shape.events.map((e) => `'${e}'`).join(", ");
      issues.push(
        issue(
          spec.name,
          `events.${name}`,
          `Event '${name}' has no wrapper-runtime source on ${shape.shape} specs (v1 supports ${supported} only). Extend the generator template to fire the event before re-declaring it here.`,
        ),
      );
      continue;
    }
    const expectedReasons = REQUIRED_REASON_VALUES[name];
    if (!expectedReasons) continue;
    const entry = events[name];
    const reasonEntry = entry?.payload?.reason;
    const expectedList = [...expectedReasons].map((v) => `'${v}'`).join(", ");
    if (reasonEntry?.type !== "enum") {
      issues.push(
        issue(
          spec.name,
          `events.${name}.payload.reason`,
          `event '${name}' must declare a 'reason' field of type 'enum' with values matching the wrapper-runtime contract (${expectedList}).`,
        ),
      );
      continue;
    }
    const declared = new Set(reasonEntry.values);
    const exact =
      declared.size === expectedReasons.size && [...expectedReasons].every((v) => declared.has(v));
    if (!exact) {
      issues.push(
        issue(
          spec.name,
          `events.${name}.payload.reason`,
          `event '${name}'.payload.reason.values must match the wrapper-runtime contract exactly. Required: [${expectedList}]; declared: [${[...declared].map((v) => `'${v}'`).join(", ")}].`,
        ),
      );
    }
  }
  return issues;
}
