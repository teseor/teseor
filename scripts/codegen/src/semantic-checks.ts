// Semantic cross-checks the Zod schema cannot express: the spec ↔ CSS token
// contract (both directions), example references, constraint enforcement
// across `examples:` and the cartesian-expanded `coverage:` cells, vocabulary
// drift with Levenshtein suggestions, motion in/out symmetry, dependency
// cycles, the `@import` allowlist driven by `dependencies:`, and
// `guidance.variantChoice` key equality with `spec.variants`.
import type { Vocabulary } from "./lib/vocabulary.ts";
import type { Spec, SpecPart } from "./schema.ts";

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

type DependencyIndex = {
  /** Spec basename to the declared `dependencies:`. */
  depsByName: Map<string, string[]>;
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

// ── Token contract (spec ↔ CSS) ─────────────────────────────────────────────

/**
 * Public override slots are written as `--t-<name>-<key>` and appear inside
 * `var(--t-<name>-<key>, …)` chains in the component CSS. Match those
 * conservatively — the consumer can also reassign the slot in modifier rules.
 */
function extractPublicSlots(css: string, specName: string): Set<string> {
  const slots = new Set<string>();
  const escapedName = specName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`--t-${escapedName}-([A-Za-z0-9_-]+)`, "g");
  for (const match of css.matchAll(pattern)) {
    if (match[1] !== undefined) slots.add(match[1]);
  }
  return slots;
}

export function checkTokenContract(spec: Spec, css: string | undefined): Issue[] {
  const issues: Issue[] = [];
  if (!isAtomic(spec)) return issues;
  const declared = new Set(Object.keys(spec.tokens ?? {}));
  if (css === undefined) {
    if (declared.size > 0) {
      issues.push(
        issue(
          spec.name,
          "tokens",
          `spec declares tokens but the component CSS file is missing or unreadable`,
        ),
      );
    }
    return issues;
  }
  const slots = extractPublicSlots(css, spec.name);
  for (const key of declared) {
    if (!slots.has(key)) {
      issues.push(
        issue(
          spec.name,
          `tokens.${key}`,
          `token '${key}' is declared in the spec but never read in the CSS as --t-${spec.name}-${key}`,
        ),
      );
    }
  }
  for (const key of slots) {
    if (!declared.has(key)) {
      issues.push(
        issue(
          spec.name,
          "tokens",
          `CSS reads --t-${spec.name}-${key} but '${key}' is not listed in spec.tokens`,
        ),
      );
    }
  }
  return issues;
}

// ── Examples reference real variant / intent / size ─────────────────────────

export function checkExamplesReferences(spec: Spec): Issue[] {
  const issues: Issue[] = [];
  if (!isAtomic(spec)) return issues;
  const examples = spec.examples ?? [];
  const variants = new Set(Object.keys(spec.variants ?? {}));
  const intents = new Set(Object.keys(spec.intents ?? {}));
  const sizes = new Set(Object.keys(spec.sizes ?? {}));
  for (const example of examples) {
    const props = example.props ?? {};
    const variant = props.variant;
    if (typeof variant === "string" && !variants.has(variant)) {
      issues.push(
        issue(
          spec.name,
          `examples.${example.id}.props.variant`,
          `'${variant}' is not a declared variant.${suggestionFragment(variant, [...variants])}`,
        ),
      );
    }
    const intent = props.intent;
    if (typeof intent === "string" && !intents.has(intent)) {
      issues.push(
        issue(
          spec.name,
          `examples.${example.id}.props.intent`,
          `'${intent}' is not a declared intent.${suggestionFragment(intent, [...intents])}`,
        ),
      );
    }
    const size = props.size;
    if (typeof size === "string" && !sizes.has(size)) {
      issues.push(
        issue(
          spec.name,
          `examples.${example.id}.props.size`,
          `'${size}' is not a declared size.${suggestionFragment(size, [...sizes])}`,
        ),
      );
    }
  }
  return issues;
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
    case "states":
      return Object.keys(spec.states ?? {});
    default: {
      const propDef = spec.props?.[dim];
      if (propDef?.values) return propDef.values;
      return [];
    }
  }
}

export function checkCoverageShape(spec: Spec): Issue[] {
  const issues: Issue[] = [];
  if (!isAtomic(spec)) return issues;
  const coverage = spec.coverage;
  if (!coverage) return issues;
  for (const [dimName, declaration] of Object.entries(coverage)) {
    const declared = collectDimensionValues(spec, dimName);
    if (declared.length === 0) {
      issues.push(
        issue(
          spec.name,
          `coverage.${dimName}`,
          `dimension '${dimName}' is not declared on the spec (no variants/intents/sizes/states/props entry)`,
        ),
      );
      continue;
    }
    if (Array.isArray(declaration)) {
      for (const value of declaration) {
        if (!declared.includes(value)) {
          issues.push(
            issue(
              spec.name,
              `coverage.${dimName}`,
              `'${value}' is not a declared value of '${dimName}'.${suggestionFragment(value, declared)}`,
            ),
          );
        }
      }
    }
  }
  return issues;
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
  for (const state of Object.keys(spec.states ?? {})) {
    if (vocabulary.states.includes(state)) continue;
    // Component-specific states (hover, focus, active) are allowed — only flag
    // a near-match to a canonical name.
    const hint = suggest(state, vocabulary.states, 1);
    if (hint && hint !== state) {
      issues.push(
        issue(
          spec.name,
          `states.${state}`,
          `'${state}' looks like a typo of the canonical state '${hint}'`,
        ),
      );
    }
  }
  return issues;
}

// ── Motion in/out symmetry (rules/motion.md rule 5) ─────────────────────────

/** Walks every ComponentNode (root and parts) and asserts `enters`/`exits`
 * are declared symmetrically. Symmetry of existence, not duration. */
export function checkMotionSymmetry(spec: Spec): Issue[] {
  const issues: Issue[] = [];
  visitNodes(spec, (node, path) => {
    const motion = node.motion;
    if (!motion) return;
    const hasEnters = (motion.enters?.length ?? 0) > 0;
    const hasExits = (motion.exits?.length ?? 0) > 0;
    if (hasEnters && !hasExits) {
      issues.push(
        issue(
          spec.name,
          path === "" ? "motion" : `${path}.motion`,
          "motion.enters is declared without motion.exits (rules/motion.md rule 5)",
        ),
      );
    }
    if (hasExits && !hasEnters) {
      issues.push(
        issue(
          spec.name,
          path === "" ? "motion" : `${path}.motion`,
          "motion.exits is declared without motion.enters (rules/motion.md rule 5)",
        ),
      );
    }
  });
  return issues;
}

function visitNodes(spec: Spec, visit: (node: AtomicSpec | SpecPart, path: string) => void): void {
  if (isAtomic(spec)) {
    visit(spec, "");
    return;
  }
  if (isComposite(spec)) {
    for (const [partName, part] of Object.entries(spec.parts)) {
      visitPart(part, `parts.${partName}`, visit);
    }
  }
}

function visitPart(
  part: SpecPart,
  path: string,
  visit: (node: SpecPart, path: string) => void,
): void {
  visit(part, path);
  for (const [childName, child] of Object.entries(part.parts ?? {})) {
    visitPart(child, `${path}.parts.${childName}`, visit);
  }
}

// ── Dependency cycles + `@import` allowlist ─────────────────────────────────

/** Detects `dependencies:` cycles across the whole spec set. */
export function checkDependencyCycles(deps: DependencyIndex): Issue[] {
  const issues: Issue[] = [];
  const WHITE = 0;
  const GREY = 1;
  const BLACK = 2;
  const color = new Map<string, number>();
  for (const name of deps.depsByName.keys()) color.set(name, WHITE);

  const visit = (node: string, stack: string[]): void => {
    color.set(node, GREY);
    for (const child of deps.depsByName.get(node) ?? []) {
      const childColor = color.get(child) ?? WHITE;
      if (childColor === GREY) {
        const cycle = [...stack.slice(stack.indexOf(child)), child].join(" -> ");
        issues.push(issue(node, "dependencies", `cycle detected: ${cycle}`));
        continue;
      }
      if (childColor === WHITE && deps.depsByName.has(child)) {
        visit(child, [...stack, child]);
      }
    }
    color.set(node, BLACK);
  };

  for (const name of [...deps.depsByName.keys()].sort()) {
    if ((color.get(name) ?? WHITE) === WHITE) visit(name, [name]);
  }
  return issues;
}

/** Asserts every `@import "../<dep>/<dep>.css"` in the component CSS has its
 * target listed in `dependencies:`. Per `rules/component-shape.md`. */
export function checkCssImportAllowlist(spec: Spec, css: string | undefined): Issue[] {
  const issues: Issue[] = [];
  if (css === undefined) return issues;
  const declared = new Set(spec.dependencies ?? []);
  const importRe = /@import\s+["']\.\.\/([A-Za-z0-9_-]+)\/[A-Za-z0-9_-]+\.css["']/g;
  for (const match of css.matchAll(importRe)) {
    const target = match[1];
    if (target === undefined || target === spec.name) continue;
    if (!declared.has(target)) {
      issues.push(
        issue(
          spec.name,
          "dependencies",
          `CSS @imports '${target}' but it is not listed in spec.dependencies`,
        ),
      );
    }
  }
  return issues;
}

// ── `as:` must be a closed string-union ─────────────────────────────────────

/**
 * The polymorphic `as` prop is a semantic element swap — Button is realistically
 * `button` or `a`, not "any HTML tag." Enforce that a spec declaring an `as`
 * prop also declares `values:` (a curated string-list), `type: string`, and
 * that `values:` covers the fallback element (the node's `element:`, which
 * codegen falls back to via `as ?? element`) and the prop's `default:` if set.
 * Walks composite parts.
 */
export function checkAsIsConstrained(spec: Spec): Issue[] {
  const issues: Issue[] = [];
  visitNodes(spec, (node, path) => {
    const asProp = node.props?.as;
    if (!asProp) return;
    const propPath = path === "" ? "props.as" : `${path}.props.as`;
    if (asProp.type !== "string") {
      issues.push(
        issue(
          spec.name,
          `${propPath}.type`,
          "`as` must be declared as `type: string` so codegen can emit a typed union",
        ),
      );
    }
    if (!asProp.values || asProp.values.length === 0) {
      issues.push(
        issue(
          spec.name,
          `${propPath}.values`,
          "`as` must declare `values:` (a curated list of element names); custom components are not allowed",
        ),
      );
      return;
    }
    if (typeof node.element === "string" && !asProp.values.includes(node.element)) {
      issues.push(
        issue(
          spec.name,
          `${propPath}.values`,
          `must include the fallback element '${node.element}' (codegen falls back to it when \`as\` is omitted)`,
        ),
      );
    }
    if (typeof asProp.default === "string" && !asProp.values.includes(asProp.default)) {
      issues.push(
        issue(
          spec.name,
          `${propPath}.default`,
          `default '${asProp.default}' is not in values: [${asProp.values.join(", ")}]`,
        ),
      );
    }
  });
  return issues;
}

// ── Responsive: explicit per-prop decision (#594) ───────────────────────────

/**
 * Every non-slot prop must declare `responsive:` explicitly (`true` or
 * `false`). Omission silently defaults to non-responsive — making the
 * decision invisible in review. Slot props are exempt: they pass through
 * children / VNodes and have no breakpoint-variant rendering surface.
 * Walks composite parts so `parts.<name>.props.<prop>` is covered too.
 */
export function checkResponsiveExplicit(spec: Spec): Issue[] {
  const issues: Issue[] = [];
  visitNodes(spec, (node, path) => {
    for (const [propName, propDef] of Object.entries(node.props ?? {})) {
      if (propDef.slot === true) continue;
      if (propDef.responsive === undefined) {
        const propPath =
          path === "" ? `props.${propName}.responsive` : `${path}.props.${propName}.responsive`;
        issues.push(
          issue(
            spec.name,
            propPath,
            "non-slot prop must declare `responsive:` explicitly (`true` or `false`)",
          ),
        );
      }
    }
  });
  return issues;
}

// ── `guidance.variantChoice` keys === `spec.variants` exactly ───────────────

export function checkVariantChoiceKeys(spec: Spec): Issue[] {
  const issues: Issue[] = [];
  if (!isAtomic(spec)) return issues;
  const variantChoice = spec.guidance?.variantChoice;
  if (!variantChoice) return issues;
  const variantKeys = new Set(Object.keys(spec.variants ?? {}));
  const guidanceKeys = new Set(Object.keys(variantChoice));
  for (const key of variantKeys) {
    if (!guidanceKeys.has(key)) {
      issues.push(
        issue(
          spec.name,
          `guidance.variantChoice`,
          `variant '${key}' has no entry under guidance.variantChoice`,
        ),
      );
    }
  }
  for (const key of guidanceKeys) {
    if (!variantKeys.has(key)) {
      issues.push(
        issue(spec.name, `guidance.variantChoice.${key}`, `'${key}' is not a declared variant`),
      );
    }
  }
  return issues;
}

// ── Interaction refs ────────────────────────────────────────────────────────

// Canonical state names a rule's `when:` may reference. Today only the
// controllable-boolean state ("open") is wired; extend as new patterns land.
const KNOWN_INTERACTION_STATES = ["open"] as const;

/** Collect every numeric prop name across atomic root props and composite parts. */
function collectNumericPropNames(spec: Spec): Set<string> {
  const names = new Set<string>();
  if (isAtomic(spec)) {
    for (const [name, def] of Object.entries(spec.props ?? {})) {
      if (def.type === "number") names.add(name);
    }
  } else if (isComposite(spec)) {
    for (const part of Object.values(spec.parts ?? {})) {
      for (const [name, def] of Object.entries(part.props ?? {})) {
        if (def.type === "number") names.add(name);
      }
    }
  }
  return names;
}

/**
 * `interactions[].delay` must name a numeric prop in the same spec; `when`
 * must name a known state. Without this both fields accept any string and a
 * typo drops to a silent no-op at runtime.
 */
export function checkInteractionRefs(spec: Spec): Issue[] {
  const rules = spec.interactions ?? [];
  if (rules.length === 0) return [];
  const numericProps = collectNumericPropNames(spec);
  const knownStates = new Set<string>(KNOWN_INTERACTION_STATES);
  const issues: Issue[] = [];
  rules.forEach((rule, i) => {
    if (rule.delay !== undefined && !numericProps.has(rule.delay)) {
      issues.push(
        issue(
          spec.name,
          `interactions[${i}].delay`,
          `'${rule.delay}' is not a declared numeric prop in this spec`,
        ),
      );
    }
    if (rule.when !== undefined && !knownStates.has(rule.when)) {
      issues.push(
        issue(
          spec.name,
          `interactions[${i}].when`,
          `'${rule.when}' is not a known state (allowed: ${[...knownStates].join(", ")})`,
        ),
      );
    }
  });
  return issues;
}

// ── Aggregate ───────────────────────────────────────────────────────────────

export function runSemanticChecks(
  spec: Spec,
  ctx: {
    css?: string;
    vocabulary: Vocabulary;
  },
): Issue[] {
  return [
    ...checkTokenContract(spec, ctx.css),
    ...checkExamplesReferences(spec),
    ...checkConstraintsAgainstExamples(spec),
    ...checkCoverageShape(spec),
    ...checkConstraintsAgainstCoverage(spec),
    ...checkVocabulary(spec, ctx.vocabulary),
    ...checkMotionSymmetry(spec),
    ...checkCssImportAllowlist(spec, ctx.css),
    ...checkVariantChoiceKeys(spec),
    ...checkResponsiveExplicit(spec),
    ...checkAsIsConstrained(spec),
    ...checkInteractionRefs(spec),
  ];
}

export type { CssIndex, DependencyIndex };
