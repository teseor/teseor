// Semantic cross-checks the Zod schema cannot express: the spec ↔ CSS token
// contract (both directions), example references, constraint enforcement
// across `examples:` and the cartesian-expanded `coverage:` cells, vocabulary
// drift with Levenshtein suggestions, motion in/out symmetry, dependency
// cycles, the `@import` allowlist driven by `dependencies:`, and
// `guidance.variantChoice` key equality with `spec.variants`.
import type { TokenDictionary } from "./lib/token-dictionary.ts";
import type { Vocabulary } from "./lib/vocabulary.ts";
import { checkA11yRefs } from "./plugins/a11y/check.ts";
import { checkBranches } from "./plugins/branches/check.ts";
import { checkCoverageShape } from "./plugins/coverage/check.ts";
import { checkElementByProp } from "./plugins/elementByProp/check.ts";
import { checkEvents, checkEventsRuntimeSupport } from "./plugins/events/check.ts";
import { checkExamplesPresent } from "./plugins/examples/check.ts";
import { checkFormControl } from "./plugins/formControl/check.ts";
import { checkImperativeProps } from "./plugins/imperativeProps/check.ts";
import { checkMotion } from "./plugins/motion/check.ts";
import { checkAsIsConstrained, checkPolymorphicAtomic } from "./plugins/polymorphic/check.ts";
import { checkResponsiveExplicit } from "./plugins/props/check.ts";
import {
  checkCssImportAllowlist,
  checkPrivateTokens,
  checkTokenContract,
  checkTokenFallbacks,
  checkTokenNames,
} from "./plugins/tokens/check.ts";
import { checkExamplesReferences, checkVariantChoiceKeys } from "./plugins/variants/check.ts";
import { checkVoidElementConstraints } from "./plugins/voidElements/check.ts";
import type { PayloadEntry, Spec, SpecPart } from "./schema.ts";

type TokensCss = ReadonlySet<string>;

export type Issue = {
  /** Spec file basename (e.g. `button`). */
  spec: string;
  /** Dotted path inside the spec. Empty string means the spec root. */
  path: string;
  /** Human-readable failure message. */
  message: string;
};

type CssIndex = {
  /** Spec basename to the CSS source string. */
  cssByName: Map<string, string>;
};

type AtomicSpec = Spec & { kind: "atomic" };
type CompositeSpec = Spec & { kind: "composite" };

function isAtomic(spec: Spec): spec is AtomicSpec {
  return spec.kind === "atomic";
}

function isComposite(spec: Spec): spec is CompositeSpec {
  return spec.kind === "composite";
}

function issue(spec: string, path: string, message: string): Issue {
  return { spec, path, message };
}

// ── Levenshtein ─────────────────────────────────────────────────────────────

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const prev = new Array<number>(b.length + 1);
  const curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const del = (prev[j] ?? 0) + 1;
      const ins = (curr[j - 1] ?? 0) + 1;
      const sub = (prev[j - 1] ?? 0) + cost;
      curr[j] = Math.min(del, ins, sub);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j] ?? 0;
  }
  return prev[b.length] ?? 0;
}

/** Closest match within `maxDistance`, or undefined. */
export function suggest(
  candidate: string,
  options: readonly string[],
  maxDistance = 3,
): string | undefined {
  let best: { name: string; distance: number } | undefined;
  for (const option of options) {
    const distance = levenshtein(candidate.toLowerCase(), option.toLowerCase());
    if (distance > maxDistance) continue;
    if (best === undefined || distance < best.distance) best = { name: option, distance };
  }
  return best?.name;
}

function suggestionFragment(name: string, options: readonly string[]): string {
  const hint = suggest(name, options);
  return hint ? ` Did you mean '${hint}'?` : "";
}

// ── Constraint enforcement (examples + coverage cells) ──────────────────────

type Constraint = NonNullable<AtomicSpec["constraints"]>[number];

/**
 * Apply a constraint to a candidate cell. Returns the matched forbid key/value
 * pair when the cell violates the constraint, or undefined when the cell is
 * clean.
 */
function violation(
  cell: Record<string, unknown>,
  constraint: Constraint,
): { prop: string; value: unknown } | undefined {
  for (const [prop, expected] of Object.entries(constraint.when)) {
    if (cell[prop] !== expected) return undefined;
  }
  for (const [prop, forbidValue] of Object.entries(constraint.forbid)) {
    const cellValue = cell[prop];
    if (cellValue === undefined) continue;
    const forbiddenList = Array.isArray(forbidValue) ? forbidValue : [forbidValue];
    if (forbiddenList.some((v) => v === cellValue)) return { prop, value: cellValue };
  }
  return undefined;
}

function describeConstraint(constraint: Constraint): string {
  const whenStr = Object.entries(constraint.when)
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join(", ");
  return `constraint (when ${whenStr}): ${constraint.reason}`;
}

export function checkConstraintsAgainstExamples(spec: Spec): Issue[] {
  const issues: Issue[] = [];
  if (!isAtomic(spec)) return issues;
  const constraints = spec.constraints ?? [];
  if (constraints.length === 0) return issues;
  for (const example of spec.examples ?? []) {
    const cell = example.props ?? {};
    for (const constraint of constraints) {
      const v = violation(cell, constraint);
      if (v !== undefined) {
        issues.push(
          issue(
            spec.name,
            `examples.${example.id}`,
            `violates ${describeConstraint(constraint)}; '${v.prop}=${JSON.stringify(v.value)}' is forbidden`,
          ),
        );
      }
    }
  }
  return issues;
}

/**
 * Cartesian-expand `coverage:` into cells, pulling each dimension's values
 * from the spec's `variants:` / `intents:` / `sizes:` / `props:` / `states:`
 * declarations. Dimensions declared as a string-list (e.g.
 * `states: [disabled, loading]`) use that subset; `true` means "every
 * declared value". The codegen path uses pairwise reduction for fixtures; a
 * cartesian walk is fine here because we only need it for constraint checks.
 */
function expandCoverage(spec: AtomicSpec): Record<string, unknown>[] {
  const coverage = spec.coverage;
  if (!coverage) return [];
  const dimensions: { name: string; values: unknown[] }[] = [];
  for (const [dimName, declaration] of Object.entries(coverage)) {
    const declared = collectDimensionValues(spec, dimName);
    const values = declaration === true ? declared : Array.isArray(declaration) ? declaration : [];
    if (values.length === 0) continue;
    dimensions.push({ name: dimName, values });
  }
  if (dimensions.length === 0) return [];
  let cells: Record<string, unknown>[] = [{}];
  for (const dim of dimensions) {
    const next: Record<string, unknown>[] = [];
    for (const cell of cells) {
      for (const value of dim.values) next.push({ ...cell, [dim.name]: value });
    }
    cells = next;
  }
  return cells;
}

function collectDimensionValues(spec: AtomicSpec, dim: string): string[] {
  switch (dim) {
    case "variant":
      return Object.keys(spec.variants ?? {});
    case "intent":
      return Object.keys(spec.intents ?? {});
    case "size":
      return Object.keys(spec.sizes ?? {});
    case "visualStates":
      return Object.keys(spec.visualStates ?? {});
    default: {
      const propDef = spec.props?.[dim];
      if (propDef?.values) return propDef.values;
      return [];
    }
  }
}

/**
 * Asserts the coverage expansion is internally consistent with constraints.
 * Constraints prune the cell set before expansion — forbidden cells never
 * enter the candidate set. This check walks the post-pruning cells and
 * confirms none violate a constraint: a defensive sanity gate that catches
 * a future regression in pruning logic.
 */
export function checkConstraintsAgainstCoverage(spec: Spec): Issue[] {
  const issues: Issue[] = [];
  if (!isAtomic(spec)) return issues;
  const constraints = spec.constraints ?? [];
  if (constraints.length === 0) return issues;
  const cells = expandCoverage(spec).filter(
    (cell) => !constraints.some((c) => violation(cell, c) !== undefined),
  );
  for (const cell of cells) {
    for (const constraint of constraints) {
      const v = violation(cell, constraint);
      if (v !== undefined) {
        const cellStr = Object.entries(cell)
          .map(([k, val]) => `${k}=${JSON.stringify(val)}`)
          .join(", ");
        issues.push(
          issue(
            spec.name,
            "coverage",
            `expanded cell {${cellStr}} violates ${describeConstraint(constraint)}; '${v.prop}=${JSON.stringify(v.value)}' is forbidden`,
          ),
        );
      }
    }
  }
  return issues;
}

// ── Vocabulary check ────────────────────────────────────────────────────────

/**
 * Walks the spec's value-bearing names (component, variant names, intent
 * names, size names, prop names, state names) and flags any that fall outside
 * `_vocabulary.yaml`. Per `rules/naming.md`, the canonical list is the only
 * vocabulary — additions land in a separate vocabulary PR.
 */
export function checkVocabulary(spec: Spec, vocabulary: Vocabulary): Issue[] {
  const issues: Issue[] = [];
  const canonicalComponents = vocabulary.components.map((n) => n.toLowerCase());
  if (!canonicalComponents.includes(spec.name.toLowerCase())) {
    issues.push(
      issue(
        spec.name,
        "name",
        `'${spec.name}' is not in the canonical components list.${suggestionFragment(spec.name, canonicalComponents)}`,
      ),
    );
  }
  if (!isAtomic(spec)) return issues;
  for (const variant of Object.keys(spec.variants ?? {})) {
    if (!vocabulary.variants.includes(variant)) {
      issues.push(
        issue(
          spec.name,
          `variants.${variant}`,
          `'${variant}' is not a canonical variant.${suggestionFragment(variant, vocabulary.variants)}`,
        ),
      );
    }
  }
  for (const intent of Object.keys(spec.intents ?? {})) {
    if (!vocabulary.intents.includes(intent)) {
      issues.push(
        issue(
          spec.name,
          `intents.${intent}`,
          `'${intent}' is not a canonical intent.${suggestionFragment(intent, vocabulary.intents)}`,
        ),
      );
    }
  }
  for (const size of Object.keys(spec.sizes ?? {})) {
    if (!vocabulary.sizes.includes(size)) {
      issues.push(
        issue(
          spec.name,
          `sizes.${size}`,
          `'${size}' is not a canonical size.${suggestionFragment(size, vocabulary.sizes)}`,
        ),
      );
    }
  }
  // Props in the canonical list are reserved global names; component-specific
  // props are allowed (Button has `iconStart`, Stack has `gap`). Only flag a
  // mis-spelled canonical name (close-but-not-equal to a vocabulary entry).
  for (const prop of Object.keys(spec.props ?? {})) {
    if (vocabulary.props.includes(prop)) continue;
    const hint = suggest(prop, vocabulary.props, 1);
    if (hint && hint !== prop) {
      issues.push(
        issue(
          spec.name,
          `props.${prop}`,
          `'${prop}' looks like a typo of the canonical prop '${hint}'`,
        ),
      );
    }
  }
  for (const state of Object.keys(spec.visualStates ?? {})) {
    if (vocabulary.states.includes(state)) continue;
    // Component-specific states (hover, focus, active) are allowed — only flag
    // a near-match to a canonical name.
    const hint = suggest(state, vocabulary.states, 1);
    if (hint && hint !== state) {
      issues.push(
        issue(
          spec.name,
          `visualStates.${state}`,
          `'${state}' looks like a typo of the canonical state '${hint}'`,
        ),
      );
    }
  }
  return issues;
}

export { checkA11yRefs };

// ── Repeating parts ─────────────────────────────────────────────────────────

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

// ── State machines ──────────────────────────────────────────────────────────

/**
 * Rejections for per-part `states:` blocks:
 *
 *  - Empty `states:` rejected; initial state = first key.
 *  - Transition `to:` targets resolve in the same part's `states:` map.
 *  - Source-key prefix resolves: `<part>.<event>` → part exists in the
 *    parts tree and `<event>` is a registered DOM event;
 *    `key.<name>` → `<name>` is a registered key name;
 *    `outside.<event>` → current part declares `overlay:`.
 *  - Part-name uniqueness across the spec's parts tree (so `<part>.<event>`
 *    references stay unambiguous without a qualified path).
 *  - `emits:` event names exist in root `events:`; payload literals match
 *    the declared payload shape (closed enums checked exactly).
 *  - `overlay.anchor` resolves to a sibling part declaring `fromChildren: true`.
 *  - `pattern: "controllable"` props mirror a state name when the part
 *    also declares `states:`.
 *  - `when:` guards parse as `[!]<part>.<bool-prop>`; part exists, prop is a
 *    `type: boolean` declared on that part.
 *  - `after:` references a declared `type: number` prop on the same part —
 *    the generator emits `setTimeout(..., props.<name>)` which fails
 *    silently if the prop is the wrong type.
 *
 * Unreachable-event detection (an event declared in root `events:` but never
 * fired from any transition's `emits:`) is intentionally not enforced: the
 * Issue type has no severity axis today, and "warn but allow" needs that
 * infra to land first.
 */
export function checkStateMachines(spec: Spec, vocabulary: Vocabulary): Issue[] {
  if (!isComposite(spec)) return [];
  const issues: Issue[] = [];

  type PartRef = { part: SpecPart; path: string };
  const partsByName = new Map<string, PartRef>();
  const partNameOccurrences = new Map<string, string[]>();
  const walkParts = (parts: Record<string, SpecPart>, basePath: string): void => {
    for (const [name, part] of Object.entries(parts)) {
      const path = basePath === "" ? `parts.${name}` : `${basePath}.parts.${name}`;
      const seen = partNameOccurrences.get(name) ?? [];
      seen.push(path);
      partNameOccurrences.set(name, seen);
      if (!partsByName.has(name)) partsByName.set(name, { part, path });
      if (part.parts) walkParts(part.parts, path);
    }
  };
  walkParts(spec.parts, "");

  // Rule 3a — part name uniqueness across the parts tree.
  for (const [name, paths] of partNameOccurrences) {
    if (paths.length <= 1) continue;
    issues.push(
      issue(
        spec.name,
        paths[0] ?? "parts",
        `part name '${name}' is declared ${paths.length} times (${paths.join(", ")}). Part names must be unique across the parts tree so '<part>.<event>' source references stay unambiguous.`,
      ),
    );
  }

  const domEvents = vocabulary.dom_events ?? {};
  const keys = vocabulary.keys ?? {};
  const domEventNames = Object.keys(domEvents);
  const keyNames = Object.keys(keys);

  const declaredEvents = spec.events ?? {};
  const declaredEventNames = Object.keys(declaredEvents);

  // Rule 6 — overlay.anchor must point at a sibling part that declares
  // `fromChildren: true`. Fires whether or not the part declares `states:`.
  const visitOverlay = (
    parts: Record<string, SpecPart>,
    siblings: Record<string, SpecPart>,
    basePath: string,
  ): void => {
    for (const [name, part] of Object.entries(parts)) {
      const path = basePath === "" ? `parts.${name}` : `${basePath}.parts.${name}`;
      if (part.overlay) {
        const anchorName = part.overlay.anchor;
        const sibling = siblings[anchorName];
        if (!sibling) {
          issues.push(
            issue(
              spec.name,
              `${path}.overlay.anchor`,
              `'${anchorName}' is not a sibling part of '${name}'. \`overlay.anchor\` must name a part declared alongside this one.`,
            ),
          );
        } else if (sibling.fromChildren !== true) {
          issues.push(
            issue(
              spec.name,
              `${path}.overlay.anchor`,
              `'${anchorName}' must declare \`fromChildren: true\` to serve as an overlay anchor. The anchor wraps the consumer's children and supplies the anchor element.`,
            ),
          );
        }
      }
      if (part.parts) visitOverlay(part.parts, part.parts, path);
    }
  };
  visitOverlay(spec.parts, spec.parts, "");

  // Rules 1, 2, 3, 5, 7 (via 3), 9, 10, +after — walk every part that
  // declares states:.
  const visitStates = (parts: Record<string, SpecPart>, basePath: string): void => {
    for (const [partName, part] of Object.entries(parts)) {
      const partPath = basePath === "" ? `parts.${partName}` : `${basePath}.parts.${partName}`;
      if (part.states) {
        checkPartStates(spec.name, partName, part, partPath, {
          partsByName,
          domEventNames,
          domEvents,
          keyNames,
          keys,
          declaredEvents,
          declaredEventNames,
          issues,
        });
      }
      if (part.parts) visitStates(part.parts, partPath);
    }
  };
  visitStates(spec.parts, "");

  return issues;
}

function checkPartStates(
  specName: string,
  partName: string,
  part: SpecPart,
  partPath: string,
  ctx: {
    partsByName: Map<string, { part: SpecPart; path: string }>;
    domEventNames: string[];
    domEvents: Record<string, string>;
    keyNames: string[];
    keys: Record<string, string>;
    declaredEvents: Record<string, { description: string; payload: Record<string, PayloadEntry> }>;
    declaredEventNames: string[];
    issues: Issue[];
  },
): void {
  const states = part.states ?? {};
  const stateNames = Object.keys(states);
  const statesPath = `${partPath}.states`;

  // Rule 1 — empty states block.
  if (stateNames.length === 0) {
    ctx.issues.push(
      issue(
        specName,
        statesPath,
        `\`states:\` is empty on part '${partName}'. Declare at least one state or omit the block entirely.`,
      ),
    );
    return;
  }

  const hasOverlay = part.overlay !== undefined;

  // Rule 9 — controllable prop mirrors a state name.
  const controllableProps = Object.entries(part.props ?? {})
    .filter(([, prop]) => prop.pattern === "controllable" && prop.type === "boolean")
    .map(([name]) => name);
  for (const propName of controllableProps) {
    if (!Object.hasOwn(states, propName)) {
      ctx.issues.push(
        issue(
          specName,
          `${partPath}.props.${propName}`,
          `controllable boolean prop '${propName}' must mirror a state name declared in \`states:\` on the same part. States declared: [${stateNames.map((s) => `'${s}'`).join(", ")}]. Codegen wires the prop value to the runtime's initial state.`,
        ),
      );
    }
  }

  for (const [stateName, stateDef] of Object.entries(states)) {
    const statePath = `${statesPath}.${stateName}`;
    const on = stateDef.on ?? {};
    for (const [sourceKey, target] of Object.entries(on)) {
      const sourcePath = `${statePath}.on.${JSON.stringify(sourceKey)}`;

      // Rules 3 / 4 / 7 — source key prefix resolves.
      const dotIdx = sourceKey.indexOf(".");
      if (dotIdx < 0) {
        ctx.issues.push(
          issue(
            specName,
            sourcePath,
            `source key '${sourceKey}' must use a '<prefix>.<name>' shape (e.g. 'trigger.click', 'key.escape', 'outside.click').`,
          ),
        );
        continue;
      }
      const prefix = sourceKey.slice(0, dotIdx);
      const eventName = sourceKey.slice(dotIdx + 1);
      if (prefix === "key") {
        if (!Object.hasOwn(ctx.keys, eventName)) {
          ctx.issues.push(
            issue(
              specName,
              sourcePath,
              `key name '${eventName}' is not registered in specs/_vocabulary.yaml keys:.${suggestionFragment(eventName, ctx.keyNames)}`,
            ),
          );
        }
      } else if (prefix === "outside") {
        if (!hasOverlay) {
          ctx.issues.push(
            issue(
              specName,
              sourcePath,
              `'outside.*' sources are only valid on parts that declare \`overlay:\`. Move the state machine onto the overlay-bearing part or drop the source.`,
            ),
          );
        }
        if (!Object.hasOwn(ctx.domEvents, eventName)) {
          ctx.issues.push(
            issue(
              specName,
              sourcePath,
              `DOM event '${eventName}' is not registered in specs/_vocabulary.yaml dom_events:.${suggestionFragment(eventName, ctx.domEventNames)}`,
            ),
          );
        }
      } else {
        const referenced = ctx.partsByName.get(prefix);
        if (!referenced) {
          ctx.issues.push(
            issue(
              specName,
              sourcePath,
              `source prefix '${prefix}' does not match any part in this spec.${suggestionFragment(prefix, [...ctx.partsByName.keys()])}`,
            ),
          );
        }
        if (!Object.hasOwn(ctx.domEvents, eventName)) {
          ctx.issues.push(
            issue(
              specName,
              sourcePath,
              `DOM event '${eventName}' is not registered in specs/_vocabulary.yaml dom_events:.${suggestionFragment(eventName, ctx.domEventNames)}`,
            ),
          );
        }
      }

      // Normalize the shorthand `"open"` to long form for the remaining
      // rules (2, 5, after, 10).
      const long = typeof target === "string" ? { to: target } : target;

      // Rule 2 — `to:` resolves.
      if (!Object.hasOwn(states, long.to)) {
        ctx.issues.push(
          issue(
            specName,
            sourcePath,
            `transition target '${long.to}' is not a state declared on part '${partName}'. States: [${stateNames.map((s) => `'${s}'`).join(", ")}].`,
          ),
        );
      }

      // `after:` references a `type: number` prop on this part.
      if ("after" in long && long.after !== undefined) {
        const propEntry = part.props?.[long.after];
        if (!propEntry) {
          ctx.issues.push(
            issue(
              specName,
              sourcePath,
              `\`after: '${long.after}'\` must reference a prop declared on part '${partName}'. The runtime reads the prop value as a millisecond delay.`,
            ),
          );
        } else if (propEntry.type !== "number") {
          ctx.issues.push(
            issue(
              specName,
              sourcePath,
              `\`after: '${long.after}'\` must reference a \`type: number\` prop. Prop '${long.after}' has type '${propEntry.type}'.`,
            ),
          );
        }
      }

      // Rule 10 — when guard parses as [!]<part>.<bool-prop>.
      if ("when" in long && long.when !== undefined) {
        const expr = long.when.trim();
        const negated = expr.startsWith("!");
        const body = (negated ? expr.slice(1) : expr).trim();
        const guardDot = body.indexOf(".");
        if (guardDot < 1 || guardDot === body.length - 1) {
          ctx.issues.push(
            issue(
              specName,
              sourcePath,
              `\`when: '${long.when}'\` does not match the supported grammar '[!]<part>.<bool-prop>'.`,
            ),
          );
        } else {
          const guardPart = body.slice(0, guardDot);
          const guardProp = body.slice(guardDot + 1);
          const referenced = ctx.partsByName.get(guardPart);
          if (!referenced) {
            ctx.issues.push(
              issue(
                specName,
                sourcePath,
                `\`when:\` references part '${guardPart}' which does not exist.${suggestionFragment(guardPart, [...ctx.partsByName.keys()])}`,
              ),
            );
          } else {
            const propEntry = referenced.part.props?.[guardProp];
            if (!propEntry) {
              ctx.issues.push(
                issue(
                  specName,
                  sourcePath,
                  `\`when:\` references prop '${guardProp}' which is not declared on part '${guardPart}'.`,
                ),
              );
            } else if (propEntry.type !== "boolean") {
              ctx.issues.push(
                issue(
                  specName,
                  sourcePath,
                  `\`when:\` prop '${guardPart}.${guardProp}' must be a \`type: boolean\` prop; got '${propEntry.type}'.`,
                ),
              );
            }
          }
        }
      }

      // Rule 5 — emits event names + payload literals.
      if ("emits" in long && long.emits !== undefined) {
        for (const [emittedName, payloadLiteral] of Object.entries(long.emits)) {
          const eventEntry = ctx.declaredEvents[emittedName];
          if (!eventEntry) {
            ctx.issues.push(
              issue(
                specName,
                sourcePath,
                `emits: '${emittedName}' is not declared in root \`events:\`.${suggestionFragment(emittedName, ctx.declaredEventNames)}`,
              ),
            );
            continue;
          }
          for (const [field, literal] of Object.entries(payloadLiteral)) {
            const fieldSchema = eventEntry.payload[field];
            if (!fieldSchema) {
              ctx.issues.push(
                issue(
                  specName,
                  sourcePath,
                  `emits: '${emittedName}' payload field '${field}' is not declared in events.${emittedName}.payload.`,
                ),
              );
              continue;
            }
            if (
              fieldSchema.type === "enum" &&
              typeof literal === "string" &&
              !fieldSchema.values.includes(literal)
            ) {
              ctx.issues.push(
                issue(
                  specName,
                  sourcePath,
                  `emits: '${emittedName}.${field}' value '${literal}' is not in the declared enum [${fieldSchema.values.map((v) => `'${v}'`).join(", ")}].`,
                ),
              );
            }
          }
        }
      }
    }
  }
}

// ── Aggregate ───────────────────────────────────────────────────────────────

export function runSemanticChecks(
  spec: Spec,
  ctx: {
    css?: string;
    vocabulary: Vocabulary;
    tokenDictionary: TokenDictionary;
    tokensCss: TokensCss;
  },
): Issue[] {
  return [
    ...checkTokenContract(spec, ctx.css, ctx.tokensCss),
    ...checkTokenFallbacks(spec, ctx.tokensCss),
    ...checkPrivateTokens(spec, ctx.css),
    ...checkTokenNames(spec, ctx.tokenDictionary),
    ...checkExamplesReferences(spec),
    ...checkConstraintsAgainstExamples(spec),
    ...checkCoverageShape(spec),
    ...checkConstraintsAgainstCoverage(spec),
    ...checkVocabulary(spec, ctx.vocabulary),
    ...checkMotion(spec),
    ...checkCssImportAllowlist(spec, ctx.css),
    ...checkVariantChoiceKeys(spec),
    ...checkResponsiveExplicit(spec),
    ...checkAsIsConstrained(spec),
    ...checkElementByProp(spec),
    ...checkA11yRefs(spec),
    ...checkPolymorphicAtomic(spec),
    ...checkFormControl(spec, ctx.vocabulary),
    ...checkImperativeProps(spec, ctx.vocabulary),
    ...checkVoidElementConstraints(spec),
    ...checkBranches(spec),
    ...checkRepeatingParts(spec),
    ...checkExamplesPresent(spec),
    ...checkEvents(spec, ctx.vocabulary),
    ...checkEventsRuntimeSupport(spec),
    ...checkStateMachines(spec, ctx.vocabulary),
  ];
}

export { checkBranches } from "./plugins/branches/check.ts";
export { checkCoverageShape } from "./plugins/coverage/check.ts";
export type { DependencyIndex } from "./plugins/dependencies/check.ts";
export { checkDependencyCycles } from "./plugins/dependencies/check.ts";
export { checkElementByProp } from "./plugins/elementByProp/check.ts";
export { checkEvents, checkEventsRuntimeSupport } from "./plugins/events/check.ts";
export { checkExamplesPresent } from "./plugins/examples/check.ts";
export { checkFormControl } from "./plugins/formControl/check.ts";
export { checkImperativeProps } from "./plugins/imperativeProps/check.ts";
export { checkAsIsConstrained, checkPolymorphicAtomic } from "./plugins/polymorphic/check.ts";
export { checkResponsiveExplicit } from "./plugins/props/check.ts";
export {
  checkCssImportAllowlist,
  checkPrivateTokens,
  checkTokenContract,
  checkTokenFallbacks,
  checkTokenNames,
} from "./plugins/tokens/check.ts";
export {
  checkExamplesReferences,
  checkVariantChoiceKeys,
} from "./plugins/variants/check.ts";
export { checkVoidElementConstraints } from "./plugins/voidElements/check.ts";

export type { CssIndex };
