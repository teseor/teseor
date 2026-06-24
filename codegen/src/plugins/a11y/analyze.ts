import type { SpecAnalysis } from "../../core/analysis.ts";
import { visitAllNodes } from "../../core/check-utils.ts";
import type { Spec } from "../../core/schema.ts";

export function analyzeA11y(spec: Spec): Partial<SpecAnalysis> {
  const names = new Set<string>();
  visitAllNodes(spec, (node) => {
    for (const name of node.a11y?.ariaProps ?? []) names.add(name);
  });
  return { ariaPropNames: names };
}
