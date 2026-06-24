import type { Issue } from "../../core/check-utils.ts";
import { issue, visitNodes } from "../../core/check-utils.ts";
import type { Spec } from "../../core/schema.ts";

/** Walks every ComponentNode (root and parts) and asserts `enters`/`exits`
 * are declared symmetrically. Symmetry of existence, not duration. */
export function checkMotion(spec: Spec): readonly Issue[] {
  const issues: Issue[] = [];
  visitNodes(spec, (node, path) => {
    const motion = node.motion;
    if (!motion) return;
    const hasEnters = (motion.enters?.length ?? 0) > 0;
    const hasExits = (motion.exits?.length ?? 0) > 0;
    if (hasEnters && !hasExits) {
      issues.push(
        issue(
          spec.name,
          path === "" ? "motion" : `${path}.motion`,
          "motion.enters is declared without motion.exits (rules/motion.md rule 5)",
        ),
      );
    }
    if (hasExits && !hasEnters) {
      issues.push(
        issue(
          spec.name,
          path === "" ? "motion" : `${path}.motion`,
          "motion.exits is declared without motion.enters (rules/motion.md rule 5)",
        ),
      );
    }
  });
  return issues;
}
