import type { SpecAnalysis } from "../../core/analysis.ts";
import type { Spec } from "../../schema.ts";

export function analyzePolymorphic(spec: Spec): Partial<SpecAnalysis> {
  return {
    hasPolymorphic: spec.kind === "atomic" && spec.polymorphic === "asChild",
  };
}
