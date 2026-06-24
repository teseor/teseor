import type { SpecAnalysis } from "../../core/analysis.ts";
import type { Spec } from "../../schema.ts";

export function analyzeRoot(spec: Spec): Partial<SpecAnalysis> {
  if (spec.kind !== "atomic") return {};
  const root = spec.root;
  return {
    hasPolymorphic: root?.polymorphic === "asChild",
    elementByPropControllingProp: root?.kind === "byProp" ? root.prop : undefined,
  };
}
