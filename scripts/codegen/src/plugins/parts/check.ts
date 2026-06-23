import type { Issue } from "../../core/check-utils.ts";
import { isComposite, issue } from "../../core/check-utils.ts";
import type { Spec, SpecPart } from "../../schema.ts";

// Valid JS identifier: starts with letter/underscore/$, followed by alphanumerics/_/$.
const JS_IDENTIFIER_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
// Names that collide with codegen-emitted wrapper locals, HTML/React/Vue
// attributes, or JS reserved words. Using one of these as the effective
// propName produces a duplicate-identifier or parser error in the generated
// React / Vue / contract code.
const RESERVED_PROP_NAMES = new Set([
  // React / HTML / Vue conventions
  "ref",
  "className",
  "class",
  "children",
  "key",
  "style",
  "id",
  // Wrapper template locals — the React composite-list template emits
  // `const { <propName> = [], className, ref, ...rest } = props;` followed by
  // `const mergedClassName = …;` — any of these as a propName triggers a
  // duplicate binding or shadowing.
  "props",
  "rest",
  "mergedClassName",
  // ES reserved words — using `default` / `let` / `case` / `class` etc. as a
  // destructure key is a syntax error.
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "new",
  "null",
  "return",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "yield",
  "let",
  "implements",
  "interface",
  "package",
  "private",
  "protected",
  "public",
  "static",
  "await",
  "async",
]);

/**
 * Rejections for repeating parts. Each rule has a stable number that
 * doesn't change even when the wording shifts. Gaps in the numbering
 * (e.g. 10 → 12) are intentional — rules retired or merged keep their
 * slot empty so existing references stay valid.
 *
 *  1. `repeating: true` + `fromChildren: true` — contradictory.
 *  2. `repeating: true` with no (or empty) `props:` — useless item shape.
 *  3. Any part in a list composite declares nested `parts:` — deferred to #835.
 *  4. Repeating part nested inside another repeating part — deferred to #834.
 *  5. Two repeating siblings collapse to the same effective `propName` (and
 *     are not legitimately sharing via `groupKey:`).
 *  6. `propName:` and `groupKey:` both set on the same part — contradictory:
 *     groupKey's value already supplies the shared prop name.
 *  7. Two parts sharing `groupKey:` declare the same per-item prop name —
 *     the merged item shape would have an ambiguous field.
 *  8. Repeating part declares `props.id` — `id` is codegen-reserved.
 *  9. A `groupKey:` value is referenced by exactly one repeating part —
 *     `groupKey` is for shared-array siblings; use `propName:` for a single
 *     part that wants a custom prop name.
 * 10. The effective propName must be a valid JS identifier and must not
 *     collide with codegen-emitted wrapper locals or JS reserved words (see
 *     RESERVED_PROP_NAMES).
 * 12. Repeating item props cannot set `responsive: true` — generators emit a
 *     plain scalar field + single data-attr, no per-breakpoint expansion.
 * 13. A list composite must declare exactly one non-repeating top-level part —
 *     the wrapper. Multiple wrappers are silently dropped by the renderer;
 *     zero wrappers cause a generator throw.
 * 14. Repeating item prop names must be valid JS identifiers — codegen emits
 *     `item.<name>` access in iteration bodies; hyphens / spaces / leading
 *     digits produce parse errors.
 * 15. `propName:` or `groupKey:` declared on a part without `repeating: true`
 *     — both are only consumed when `repeating: true`. Silently ignored
 *     downstream otherwise.
 * 16. Group-level scalar prop on a non-repeating part in a list composite
 *     uses an advanced shape the wrapper template can't currently handle.
 *     Three sub-cases each emit their own issue: `responsive: true` (no
 *     per-breakpoint expansion), `slot: true` (no slot body), and
 *     `pattern: controllable` (no `default*` / `on*Change` triple).
 */
export function checkRepeatingParts(spec: Spec): Issue[] {
  if (!isComposite(spec)) return [];
  const issues: Issue[] = [];

  // Walk the whole tree once to detect repeating presence. `anyRepeating`
  // gates rule 3 (no nested parts in a list composite) and rule 13.
  let anyRepeating = false;
  const detect = (parts: Record<string, SpecPart>): void => {
    for (const part of Object.values(parts)) {
      if (part.repeating === true) anyRepeating = true;
      if (part.parts) detect(part.parts);
    }
  };
  detect(spec.parts);

  // Rule 9: `groupKey:` value must be shared by ≥ 2 repeating parts across
  // the spec. A lone groupKey is meaningless; the author wants `propName:`.
  // Build a count and emit per-offender below if any group has size 1.
  const groupKeyCounts = new Map<string, string[]>();
  const collectGroupKeys = (parts: Record<string, SpecPart>): void => {
    for (const [partName, part] of Object.entries(parts)) {
      if (part.repeating === true && typeof part.groupKey === "string") {
        const owners = groupKeyCounts.get(part.groupKey) ?? [];
        owners.push(partName);
        groupKeyCounts.set(part.groupKey, owners);
      }
      if (part.parts) collectGroupKeys(part.parts);
    }
  };
  collectGroupKeys(spec.parts);
  const loneGroupKeys = new Set<string>();
  for (const [groupKey, owners] of groupKeyCounts) {
    if (owners.length === 1) loneGroupKeys.add(groupKey);
  }

  // Rule 13: list composite has exactly one non-repeating top-level part.
  // The composite-list renderers pick the first non-repeating top-level part
  // as the wrapper; extras (or zero) cause silent drops or a generator throw.
  if (anyRepeating) {
    const topLevel = Object.entries(spec.parts);
    const nonRepeatingTop = topLevel.filter(([, p]) => p.repeating !== true);
    if (nonRepeatingTop.length === 0) {
      issues.push(
        issue(
          spec.name,
          "parts",
          "list composite must declare exactly one non-repeating wrapper part — found 0.",
        ),
      );
    } else if (nonRepeatingTop.length > 1) {
      for (const [name] of nonRepeatingTop) {
        issues.push(
          issue(
            spec.name,
            `parts.${name}`,
            `list composite must declare exactly one non-repeating wrapper part — found ${nonRepeatingTop.length}: ${nonRepeatingTop.map(([n]) => `'${n}'`).join(", ")}. Extra wrapper parts are silently dropped by the renderer.`,
          ),
        );
      }
    }
  }

  const walk = (
    parts: Record<string, SpecPart>,
    parentPath: string,
    parentIsRepeating: boolean,
  ): void => {
    // Rule 5: sibling propName collision within this parts map. Parts that
    // legitimately share via `groupKey:` are excluded — they're meant to
    // collapse to the same propName.
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
            spec.name,
            path,
            `repeating parts ${owners.map((o) => `'${o.name}'`).join(", ")} collapse to the same propName '${effective}'. Set \`propName:\` explicitly or use a shared \`groupKey:\` if they should iterate the same array.`,
          ),
        );
      }
    }

    // Rule 7: parts sharing a `groupKey:` cannot declare the same per-item
    // prop name — the merged item shape would have a single ambiguous field.
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
              spec.name,
              `${path}.props.${propName}`,
              `repeating parts ${sharers.map((n) => `'${n}'`).join(", ")} share \`groupKey: ${groupKey}\` and both declare per-item prop '${propName}'. Rename one of them — the merged item shape can have only one '${propName}'.`,
            ),
          );
        }
      }
    }

    for (const [partName, part] of Object.entries(parts)) {
      const path = parentPath === "" ? `parts.${partName}` : `${parentPath}.parts.${partName}`;

      // Rule 3 (generalized): in a list composite, no part — whether the
      // repeating one or a non-repeating wrapper — may declare nested `parts:`.
      // The composite-list renderers only emit the chosen wrapper + each
      // repeating sibling; any nested sub-parts (under either) are silently
      // dropped. Defer to #835 / a future phase.
      if (anyRepeating && part.parts && Object.keys(part.parts).length > 0) {
        issues.push(
          issue(
            spec.name,
            path,
            `'${partName}' cannot declare nested \`parts:\` in a list composite — nested fixed sub-parts are deferred to #835.`,
          ),
        );
      }

      if (part.repeating === true) {
        // Rule 4: nested inside a repeating ancestor.
        if (parentIsRepeating) {
          issues.push(
            issue(
              spec.name,
              path,
              `'${partName}' is a repeating part nested inside another repeating part. Recursive repeating is deferred to #834.`,
            ),
          );
        }
        // Rule 1: `fromChildren` conflict.
        if (part.fromChildren === true) {
          issues.push(
            issue(
              spec.name,
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
              spec.name,
              path,
              `repeating part '${partName}' must declare at least one entry in \`props:\` — the synthesized \`id\` alone has no DOM emission.`,
            ),
          );
        }
        // Rule 8: `id` is reserved.
        if (propEntries.some(([name]) => name === "id")) {
          issues.push(
            issue(
              spec.name,
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
              spec.name,
              path,
              `repeating part '${partName}' sets both \`propName: '${part.propName}'\` and \`groupKey: '${part.groupKey}'\`. The groupKey value is the shared prop name; remove \`propName:\`.`,
            ),
          );
        }
        // Rule 9: a `groupKey:` value referenced by exactly one part.
        if (typeof part.groupKey === "string" && loneGroupKeys.has(part.groupKey)) {
          issues.push(
            issue(
              spec.name,
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
                spec.name,
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
                spec.name,
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
              spec.name,
              path,
              `repeating part '${partName}' has effective propName '${effectivePropName}' (from ${sourceField}) which is not a valid JS identifier. ${fixHint}.`,
            ),
          );
        } else if (RESERVED_PROP_NAMES.has(effectivePropName)) {
          issues.push(
            issue(
              spec.name,
              path,
              `repeating part '${partName}' has effective propName '${effectivePropName}' (from ${sourceField}) which collides with a codegen-reserved wrapper local. ${fixHint} not in: ${[...RESERVED_PROP_NAMES].join(", ")}.`,
            ),
          );
        }
      } else {
        // Rule 15: `propName:` and `groupKey:` are only consumed when
        // `repeating: true`. Either on a non-repeating part is silently
        // ignored downstream.
        if (part.propName !== undefined) {
          issues.push(
            issue(
              spec.name,
              path,
              `non-repeating part '${partName}' cannot declare \`propName:\` — it is only consumed for parts with \`repeating: true\`.`,
            ),
          );
        }
        if (part.groupKey !== undefined) {
          issues.push(
            issue(
              spec.name,
              path,
              `non-repeating part '${partName}' cannot declare \`groupKey:\` — it is only consumed for parts with \`repeating: true\`.`,
            ),
          );
        }
        // Rule 16: in a list composite, group-level scalar props on a
        // non-repeating sibling cannot use advanced shapes that the wrapper
        // template doesn't currently handle. The wrapper just passes props
        // through (React `{...rest}`, Vue `:<name>="<name>"`) — no per-
        // breakpoint expansion, no slot rendering, no controllable triple.
        //   16a: `responsive: true` — no `responsiveDataAttrs` expansion.
        //   16b: `slot: true` — wrapper has no body for slot content.
        //   16c: `pattern: controllable` — no `default*` / `on*Change` triple.
        if (anyRepeating) {
          for (const [propName, def] of Object.entries(part.props ?? {})) {
            if (def.responsive === true) {
              issues.push(
                issue(
                  spec.name,
                  `${path}.props.${propName}`,
                  `group-level scalar prop '${propName}' on non-repeating part '${partName}' cannot set \`responsive: true\` — wrapper props flow through without responsive expansion.`,
                ),
              );
            }
            if (def.slot === true) {
              issues.push(
                issue(
                  spec.name,
                  `${path}.props.${propName}`,
                  `group-level scalar prop '${propName}' on non-repeating part '${partName}' cannot set \`slot: true\` — the wrapper renders the repeating loop, not slot content.`,
                ),
              );
            }
            if (def.pattern === "controllable") {
              issues.push(
                issue(
                  spec.name,
                  `${path}.props.${propName}`,
                  `group-level scalar prop '${propName}' on non-repeating part '${partName}' cannot set \`pattern: controllable\` — the wrapper template doesn't emit the \`default<Name>\` / \`on<Name>Change\` triple. Controllable patterns wait for an events story.`,
                ),
              );
            }
          }
        }
      }

      if (part.parts) {
        walk(part.parts, path, parentIsRepeating || part.repeating === true);
      }
    }
  };

  walk(spec.parts, "", false);
  return issues;
}
