import type { Issue } from "../../../core/check-utils.ts";
import { issue } from "../../../core/check-utils.ts";
import type { SpecPart } from "../../../schema.ts";

export type PartRef = { part: SpecPart; path: string };

// Builds partsByName and partNameOccurrences maps, then checks rule 3a:
// part name uniqueness across the parts tree.
export function buildPartIndex(
  parts: Record<string, SpecPart>,
  specName: string,
  issues: Issue[],
): {
  partsByName: Map<string, PartRef>;
  partNameOccurrences: Map<string, string[]>;
} {
  const partsByName = new Map<string, PartRef>();
  const partNameOccurrences = new Map<string, string[]>();

  const walkParts = (walkParts_parts: Record<string, SpecPart>, basePath: string): void => {
    for (const [name, part] of Object.entries(walkParts_parts)) {
      const path = basePath === "" ? `parts.${name}` : `${basePath}.parts.${name}`;
      const seen = partNameOccurrences.get(name) ?? [];
      seen.push(path);
      partNameOccurrences.set(name, seen);
      if (!partsByName.has(name)) partsByName.set(name, { part, path });
      if (part.parts) walkParts(part.parts, path);
    }
  };
  walkParts(parts, "");

  // Rule 3a — part name uniqueness across the parts tree.
  for (const [name, paths] of partNameOccurrences) {
    if (paths.length <= 1) continue;
    issues.push(
      issue(
        specName,
        paths[0] ?? "parts",
        `part name '${name}' is declared ${paths.length} times (${paths.join(", ")}). Part names must be unique across the parts tree so '<part>.<event>' source references stay unambiguous.`,
      ),
    );
  }

  return { partsByName, partNameOccurrences };
}
