import type { SpecAnalysis } from "../../core/analysis.ts";
import type { Spec } from "../../core/schema.ts";

export function analyzeBranches(spec: Spec): Partial<SpecAnalysis> {
  const computes = new Set<string>();
  if (spec.kind !== "atomic") return { branchComputes: computes };
  for (const branch of spec.branches ?? []) {
    const text = branch.text;
    if (text && "compute" in text) computes.add(text.compute);
  }
  return { branchComputes: computes };
}
