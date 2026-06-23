import type { SpecAnalysis } from "../../core/analysis.ts";
import type { Spec } from "../../schema.ts";

export function analyzeElementByProp(spec: Spec): Partial<SpecAnalysis> {
  if (spec.kind !== "atomic") return {};
  return { elementByPropControllingProp: spec.elementByProp?.prop };
}
