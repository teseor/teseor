import type { Issue } from "../../../core/check-utils.ts";
import { isComposite } from "../../../core/check-utils.ts";
import type { Spec, SpecPart } from "../../../core/schema.ts";
import type { Vocabulary } from "../../../lib/vocabulary.ts";
import { visitOverlay } from "./overlay.ts";
import { buildPartIndex } from "./part-names.ts";
import { checkPartStates } from "./transitions.ts";

/**
 * Rejections for per-part `states:` blocks:
 *
 *  - Empty `states:` rejected; initial state = first key.
 *  - Transition `to:` targets resolve in the same part's `states:` map.
 *  - Source-key prefix resolves: `<part>.<event>` → part exists in the
 *    parts tree and `<event>` is a registered DOM event;
 *    `key.<name>` → `<name>` is a registered key name;
 *    `outside.<event>` → current part declares `overlay:`.
 *  - Part-name uniqueness across the spec's parts tree (so `<part>.<event>`
 *    references stay unambiguous without a qualified path).
 *  - `emits:` event names exist in root `events:`; payload literals match
 *    the declared payload shape (closed enums checked exactly).
 *  - `overlay.anchor` resolves to a sibling part declaring `fromChildren: true`.
 *  - `pattern: "controllable"` props mirror a state name when the part
 *    also declares `states:`.
 *  - `when:` guards parse as `[!]<part>.<bool-prop>`; part exists, prop is a
 *    `type: boolean` declared on that part.
 *  - `after:` references a declared `type: number` prop on the same part —
 *    the generator emits `setTimeout(..., props.<name>)` which fails
 *    silently if the prop is the wrong type.
 *
 * Unreachable-event detection (an event declared in root `events:` but never
 * fired from any transition's `emits:`) is intentionally not enforced: the
 * Issue type has no severity axis today, and "warn but allow" needs that
 * infra to land first.
 */
export function checkStateMachines(spec: Spec, vocabulary: Vocabulary): Issue[] {
  if (!isComposite(spec)) return [];
  const issues: Issue[] = [];

  const { partsByName } = buildPartIndex(spec.parts, spec.name, issues);

  const domEvents = vocabulary.dom_events ?? {};
  const keys = vocabulary.keys ?? {};
  const domEventNames = Object.keys(domEvents);
  const keyNames = Object.keys(keys);

  const declaredEvents = spec.events ?? {};
  const declaredEventNames = Object.keys(declaredEvents);

  // Rule 6 — overlay.anchor must point at a sibling part that declares
  // `fromChildren: true`. Fires whether or not the part declares `states:`.
  visitOverlay(spec.parts, spec.parts, "", spec.name, issues);

  // Rules 1, 2, 3, 5, 7 (via 3), 9, 10, +after — walk every part that
  // declares states:.
  const visitStates = (parts: Record<string, SpecPart>, basePath: string): void => {
    for (const [partName, part] of Object.entries(parts)) {
      const partPath = basePath === "" ? `parts.${partName}` : `${basePath}.parts.${partName}`;
      if (part.states) {
        checkPartStates(spec.name, partName, part, partPath, {
          partsByName,
          domEventNames,
          domEvents,
          keyNames,
          keys,
          declaredEvents,
          declaredEventNames,
          issues,
        });
      }
      if (part.parts) visitStates(part.parts, partPath);
    }
  };
  visitStates(spec.parts, "");

  return issues;
}
