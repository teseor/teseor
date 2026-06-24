import type { Issue } from "../../core/check-utils.ts";
import { issue } from "../../core/check-utils.ts";
import type { Spec } from "../../core/schema.ts";

/**
 * Every spec must declare at least one entry in `examples:`. A spec without
 * examples produces a docs page that lists props and types but renders no
 * actual component — consumers can't see the thing they're documenting.
 * The empty case has no positive value and is almost always a forgotten
 * authoring step.
 */
export function checkExamplesPresent(spec: Spec): Issue[] {
  if (spec.examples && spec.examples.length > 0) return [];
  return [
    issue(
      spec.name,
      "examples",
      `spec must declare at least one entry in \`examples:\` — components without examples produce empty docs pages.`,
    ),
  ];
}
