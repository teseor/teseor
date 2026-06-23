import type { AtomicSpec, CompositeSpec, Spec, SpecPart } from "../../schema.ts";
import type { Issue } from "../../semantic-checks.ts";

function isAtomic(spec: Spec): spec is AtomicSpec {
  return spec.kind === "atomic";
}

function isComposite(spec: Spec): spec is CompositeSpec {
  return spec.kind === "composite";
}

function motionIssue(spec: string, path: string, message: string): Issue {
  return { spec, path, message };
}

function visitPart(
  part: SpecPart,
  path: string,
  visit: (node: SpecPart, path: string) => void,
): void {
  visit(part, path);
  for (const [childName, child] of Object.entries(part.parts ?? {})) {
    visitPart(child, `${path}.parts.${childName}`, visit);
  }
}

function visitNodes(spec: Spec, visit: (node: AtomicSpec | SpecPart, path: string) => void): void {
  if (isAtomic(spec)) {
    visit(spec, "");
    return;
  }
  if (isComposite(spec)) {
    for (const [partName, part] of Object.entries(spec.parts)) {
      visitPart(part, `parts.${partName}`, visit);
    }
  }
}

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
        motionIssue(
          spec.name,
          path === "" ? "motion" : `${path}.motion`,
          "motion.enters is declared without motion.exits (rules/motion.md rule 5)",
        ),
      );
    }
    if (hasExits && !hasEnters) {
      issues.push(
        motionIssue(
          spec.name,
          path === "" ? "motion" : `${path}.motion`,
          "motion.exits is declared without motion.enters (rules/motion.md rule 5)",
        ),
      );
    }
  });
  return issues;
}
