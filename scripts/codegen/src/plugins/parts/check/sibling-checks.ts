import type { Issue } from "../../../core/check-utils.ts";
import { issue } from "../../../core/check-utils.ts";
import type { SpecPart } from "../../../schema.ts";

// Rule 5: sibling propName collision within a parts map. Parts that
// legitimately share via `groupKey:` are excluded — they're meant to
// collapse to the same propName.
export function checkSiblingPropNameCollisions(
  parts: Record<string, SpecPart>,
  parentPath: string,
  specName: string,
  issues: Issue[],
): void {
  const propNameOwners = new Map<string, Array<{ name: string; groupKey?: string }>>();
  for (const [partName, part] of Object.entries(parts)) {
    if (part.repeating !== true) continue;
    const effective = part.propName ?? part.groupKey ?? `${partName}s`;
    const owners = propNameOwners.get(effective) ?? [];
    owners.push({ name: partName, groupKey: part.groupKey });
    propNameOwners.set(effective, owners);
  }
  for (const [effective, owners] of propNameOwners) {
    if (owners.length < 2) continue;
    // Legitimate share: all owners declare the same `groupKey:` and that
    // groupKey value matches the effective propName.
    const sharedGroupKey = owners[0]?.groupKey;
    const allShare =
      sharedGroupKey !== undefined &&
      sharedGroupKey === effective &&
      owners.every((o) => o.groupKey === sharedGroupKey);
    if (allShare) continue;
    for (const { name: partName } of owners) {
      const path = parentPath === "" ? `parts.${partName}` : `${parentPath}.parts.${partName}`;
      issues.push(
        issue(
          specName,
          path,
          `repeating parts ${owners.map((o) => `'${o.name}'`).join(", ")} collapse to the same propName '${effective}'. Set \`propName:\` explicitly or use a shared \`groupKey:\` if they should iterate the same array.`,
        ),
      );
    }
  }
}

// Rule 7: parts sharing a `groupKey:` cannot declare the same per-item
// prop name — the merged item shape would have a single ambiguous field.
export function checkGroupKeyPropCollisions(
  parts: Record<string, SpecPart>,
  parentPath: string,
  specName: string,
  issues: Issue[],
): void {
  const byGroupKey = new Map<string, Array<{ name: string; props: string[] }>>();
  for (const [partName, part] of Object.entries(parts)) {
    if (part.repeating !== true || typeof part.groupKey !== "string") continue;
    const entry = { name: partName, props: Object.keys(part.props ?? {}) };
    const owners = byGroupKey.get(part.groupKey) ?? [];
    owners.push(entry);
    byGroupKey.set(part.groupKey, owners);
  }
  for (const [groupKey, owners] of byGroupKey) {
    if (owners.length < 2) continue;
    // Count each prop name across all owners; any appearing more than once
    // is a cross-sibling collision.
    const propNameCounts = new Map<string, string[]>();
    for (const owner of owners) {
      for (const propName of owner.props) {
        const owners2 = propNameCounts.get(propName) ?? [];
        owners2.push(owner.name);
        propNameCounts.set(propName, owners2);
      }
    }
    for (const [propName, sharers] of propNameCounts) {
      if (sharers.length < 2) continue;
      for (const partName of sharers) {
        const path = parentPath === "" ? `parts.${partName}` : `${parentPath}.parts.${partName}`;
        issues.push(
          issue(
            specName,
            `${path}.props.${propName}`,
            `repeating parts ${sharers.map((n) => `'${n}'`).join(", ")} share \`groupKey: ${groupKey}\` and both declare per-item prop '${propName}'. Rename one of them — the merged item shape can have only one '${propName}'.`,
          ),
        );
      }
    }
  }
}
