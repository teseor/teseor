import type { SpecAnalysis } from "../../core/analysis.ts";
import { specVoidStatus } from "../../lib/html-void-elements.ts";
import type { Spec } from "../../schema.ts";

export function analyzeVoidElements(spec: Spec): Partial<SpecAnalysis> {
  if (spec.kind !== "atomic") {
    return { voidStatus: "never" };
  }
  return { voidStatus: specVoidStatus(spec) };
}
