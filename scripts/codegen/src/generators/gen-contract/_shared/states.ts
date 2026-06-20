import { pascalCase } from "../../../lib/pascal-case.ts";
import type { SpecPart } from "../../../schema.ts";

export type StatefulPart = {
  partName: string;
  stateNames: string[];
};

/** Walks the parts tree and collects every part that declares a non-empty
 *  `states:` map. Order matches the spec's declaration order; the first key
 *  in each part's map is the initial state by the RFC's contract. */
export function collectStatefulParts(parts: Record<string, SpecPart> | undefined): StatefulPart[] {
  if (!parts) return [];
  const out: StatefulPart[] = [];
  const walk = (tree: Record<string, SpecPart>): void => {
    for (const [name, part] of Object.entries(tree)) {
      if (part.states) {
        const stateNames = Object.keys(part.states);
        if (stateNames.length > 0) out.push({ partName: name, stateNames });
      }
      if (part.parts) walk(part.parts);
    }
  };
  walk(parts);
  return out;
}

/** `<Spec>State` when there's exactly one stateful part; otherwise
 *  `<Spec><Part>State` to disambiguate. */
export function stateTypeName(
  specPascalName: string,
  partName: string,
  statefulCount: number,
): string {
  return statefulCount <= 1
    ? `${specPascalName}State`
    : `${specPascalName}${pascalCase(partName)}State`;
}
