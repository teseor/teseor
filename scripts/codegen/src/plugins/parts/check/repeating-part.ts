import type { Issue } from "../../../core/check-utils.ts";
import { issue } from "../../../core/check-utils.ts";
import type { SpecPart } from "../../../core/schema.ts";
import { JS_IDENTIFIER_RE, RESERVED_PROP_NAMES } from "./constants.ts";

// Rules 1, 2, 4, 6, 8, 9, 10, 12, 14 — checks for a single repeating part.
export function checkRepeatingPart(
  specName: string,
  partName: string,
  part: SpecPart,
  path: string,
  parentIsRepeating: boolean,
  loneGroupKeys: Set<string>,
  issues: Issue[],
): void {
  // Rule 4: nested inside a repeating ancestor.
  if (parentIsRepeating) {
    issues.push(
      issue(
        specName,
        path,
        `'${partName}' is a repeating part nested inside another repeating part. Recursive repeating is deferred to #834.`,
      ),
    );
  }
  // Rule 1: `fromChildren` conflict.
  if (part.fromChildren === true) {
    issues.push(
      issue(
        specName,
        path,
        `repeating part '${partName}' cannot also set \`fromChildren: true\` — repeating renders from an array prop, fromChildren consumes wrapped children.`,
      ),
    );
  }
  // Rule 2: empty item shape.
  const propEntries = Object.entries(part.props ?? {});
  if (propEntries.length === 0) {
    issues.push(
      issue(
        specName,
        path,
        `repeating part '${partName}' must declare at least one entry in \`props:\` — the synthesized \`id\` alone has no DOM emission.`,
      ),
    );
  }
  // Rule 8: `id` is reserved.
  if (propEntries.some(([name]) => name === "id")) {
    issues.push(
      issue(
        specName,
        `${path}.props.id`,
        `'id' is reserved on repeating items — codegen synthesizes it as the React/Vue key.`,
      ),
    );
  }
  // Rule 6: `propName:` and `groupKey:` together are contradictory.
  // groupKey's value already supplies the shared prop name.
  if (part.propName !== undefined && typeof part.groupKey === "string") {
    issues.push(
      issue(
        specName,
        path,
        `repeating part '${partName}' sets both \`propName: '${part.propName}'\` and \`groupKey: '${part.groupKey}'\`. The groupKey value is the shared prop name; remove \`propName:\`.`,
      ),
    );
  }
  // Rule 9: a `groupKey:` value referenced by exactly one part.
  if (typeof part.groupKey === "string" && loneGroupKeys.has(part.groupKey)) {
    issues.push(
      issue(
        specName,
        path,
        `repeating part '${partName}' has \`groupKey: '${part.groupKey}'\` but no sibling shares it. Use \`propName:\` if you want a custom prop name on a single repeating part.`,
      ),
    );
  }
  // Rule 12: `responsive: true` on item props is not currently supported.
  // The generators emit a plain scalar field + single `data-*` binding
  // with no per-breakpoint expansion.
  for (const [itemPropName, def] of propEntries) {
    if (def.responsive === true) {
      issues.push(
        issue(
          specName,
          `${path}.props.${itemPropName}`,
          `repeating item prop '${itemPropName}' cannot set \`responsive: true\` — per-item responsive emission is not supported. Set \`responsive: false\`.`,
        ),
      );
    }
  }
  // Rule 14: item prop names must be valid JS identifiers. Codegen emits
  // `item.<name>` in iteration bodies and `<name>?: T;` in type members;
  // hyphenated / spaced / non-identifier names (e.g. `aria-label`,
  // `page-size`) produce parse errors. Skip `id` — already rejected
  // by rule 8.
  for (const [itemPropName] of propEntries) {
    if (itemPropName === "id") continue;
    if (!JS_IDENTIFIER_RE.test(itemPropName)) {
      issues.push(
        issue(
          specName,
          `${path}.props.${itemPropName}`,
          `repeating item prop name '${itemPropName}' is not a valid JS identifier. Codegen emits \`item.${itemPropName}\` in the iteration body; non-identifier names produce parse errors. Use camelCase.`,
        ),
      );
    }
  }
  // Rule 10: the effective propName (propName ?? groupKey ?? plural)
  // must be a valid JS identifier and not collide with reserved names.
  // Tailor the error message to the source field that supplied the value.
  const effectivePropName = part.propName ?? part.groupKey ?? `${partName}s`;
  const sourceField =
    part.propName !== undefined
      ? "propName"
      : part.groupKey !== undefined
        ? "groupKey"
        : "default plural";
  const fixHint =
    sourceField === "default plural"
      ? "Set `propName:` to a camelCase identifier"
      : `Change \`${sourceField}:\` to a camelCase identifier`;
  if (!JS_IDENTIFIER_RE.test(effectivePropName)) {
    issues.push(
      issue(
        specName,
        path,
        `repeating part '${partName}' has effective propName '${effectivePropName}' (from ${sourceField}) which is not a valid JS identifier. ${fixHint}.`,
      ),
    );
  } else if (RESERVED_PROP_NAMES.has(effectivePropName)) {
    issues.push(
      issue(
        specName,
        path,
        `repeating part '${partName}' has effective propName '${effectivePropName}' (from ${sourceField}) which collides with a codegen-reserved wrapper local. ${fixHint} not in: ${[...RESERVED_PROP_NAMES].join(", ")}.`,
      ),
    );
  }
}
