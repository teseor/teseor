import type { Spec } from "../../schema.ts";
import type { Issue } from "../../semantic-checks.ts";

function issue(spec: string, path: string, message: string): Issue {
  return { spec, path, message };
}

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
