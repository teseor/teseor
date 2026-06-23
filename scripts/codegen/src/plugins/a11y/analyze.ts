import type { SpecAnalysis } from "../../core/analysis.ts";
import type { Spec, SpecPart } from "../../schema.ts";

export function analyzeA11y(spec: Spec): Partial<SpecAnalysis> {
  const names = new Set<string>();
  if (spec.kind === "atomic") {
    for (const name of spec.a11y?.ariaProps ?? []) names.add(name);
  }
  if (spec.kind === "composite") {
    const walk = (parts: Record<string, SpecPart>): void => {
      for (const part of Object.values(parts)) {
        for (const name of part.a11y?.ariaProps ?? []) names.add(name);
        if (part.parts) walk(part.parts);
      }
    };
    walk(spec.parts);
  }
  return { ariaPropNames: names };
}
