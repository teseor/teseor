import type { Issue } from "../../core/check-utils.ts";
import { issue } from "../../core/check-utils.ts";

export type DependencyIndex = {
  /** Spec basename to the declared `dependencies:`. */
  depsByName: Map<string, string[]>;
};

/** Detects `dependencies:` cycles across the whole spec set. */
export function checkDependencyCycles(deps: DependencyIndex): Issue[] {
  const issues: Issue[] = [];
  const WHITE = 0;
  const GREY = 1;
  const BLACK = 2;
  const color = new Map<string, number>();
  for (const name of deps.depsByName.keys()) color.set(name, WHITE);

  const visit = (node: string, stack: string[]): void => {
    color.set(node, GREY);
    for (const child of deps.depsByName.get(node) ?? []) {
      const childColor = color.get(child) ?? WHITE;
      if (childColor === GREY) {
        const cycle = [...stack.slice(stack.indexOf(child)), child].join(" -> ");
        issues.push(issue(node, "dependencies", `cycle detected: ${cycle}`));
        continue;
      }
      if (childColor === WHITE && deps.depsByName.has(child)) {
        visit(child, [...stack, child]);
      }
    }
    color.set(node, BLACK);
  };

  for (const name of [...deps.depsByName.keys()].sort()) {
    if ((color.get(name) ?? WHITE) === WHITE) visit(name, [name]);
  }
  return issues;
}
