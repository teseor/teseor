import type { Issue } from "../../../core/check-utils.ts";
import { issue } from "../../../core/check-utils.ts";
import type { SpecPart } from "../../../core/schema.ts";

// Rule 6 — overlay.anchor must point at a sibling part that declares
// `fromChildren: true`. Fires whether or not the part declares `states:`.
export function visitOverlay(
  parts: Record<string, SpecPart>,
  siblings: Record<string, SpecPart>,
  basePath: string,
  specName: string,
  issues: Issue[],
): void {
  for (const [name, part] of Object.entries(parts)) {
    const path = basePath === "" ? `parts.${name}` : `${basePath}.parts.${name}`;
    if (part.overlay) {
      const anchorName = part.overlay.anchor;
      const sibling = siblings[anchorName];
      if (!sibling) {
        issues.push(
          issue(
            specName,
            `${path}.overlay.anchor`,
            `'${anchorName}' is not a sibling part of '${name}'. \`overlay.anchor\` must name a part declared alongside this one.`,
          ),
        );
      } else if (sibling.fromChildren !== true) {
        issues.push(
          issue(
            specName,
            `${path}.overlay.anchor`,
            `'${anchorName}' must declare \`fromChildren: true\` to serve as an overlay anchor. The anchor wraps the consumer's children and supplies the anchor element.`,
          ),
        );
      }
    }
    if (part.parts) visitOverlay(part.parts, part.parts, path, specName, issues);
  }
}
