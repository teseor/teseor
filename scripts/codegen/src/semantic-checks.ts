// Semantic cross-checks the Zod schema cannot express: the spec ↔ CSS token
// contract (both directions), example references, constraint enforcement
// across `examples:` and the cartesian-expanded `coverage:` cells, vocabulary
// drift with Levenshtein suggestions, motion in/out symmetry, dependency
// cycles, the `@import` allowlist driven by `dependencies:`, and
// `guidance.variantChoice` key equality with `spec.variants`.
import postcss from "postcss";
import postcssEach from "postcss-each";
import { isVoidElement } from "./lib/html-void-elements.ts";
import { pascalCase } from "./lib/pascal-case.ts";
import type { TokenDictionary } from "./lib/token-dictionary.ts";
import type { Vocabulary } from "./lib/vocabulary.ts";
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

/** Build the map from expected public-slot suffix → spec path that declared it.
 *  For atomic specs: `tokens.bg` → `bg`. For composite specs: `parts.content.tokens.bg`
 *  → `bg` when unique, or `parts.content.tokens.bg` → `content-bg` when the
 *  token name collides across parts (matches flattenSpec's namespacing). */
function declaredPublicSlots(spec: Spec): Map<string, string> {
  const out = new Map<string, string>();
  if (isAtomic(spec)) {
    for (const key of Object.keys(spec.tokens ?? {})) {
      out.set(key, `tokens.${key}`);
    }
    return out;
  }
  if (!isComposite(spec)) return out;
  const counts = new Map<string, number>();
  const countTokens = (parts: Record<string, SpecPart>): void => {
    for (const part of Object.values(parts)) {
      for (const key of Object.keys(part.tokens ?? {})) {
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      if (part.parts) countTokens(part.parts);
    }
  };
  countTokens(spec.parts);
  const visit = (parts: Record<string, SpecPart>, partPath: string): void => {
    for (const [partName, part] of Object.entries(parts)) {
      const path = partPath === "" ? partName : `${partPath}.${partName}`;
      for (const key of Object.keys(part.tokens ?? {})) {
        const suffix = (counts.get(key) ?? 0) > 1 ? `${path.replace(/\./g, "-")}-${key}` : key;
        out.set(suffix, `parts.${path}.tokens.${key}`);
      }
      if (part.parts) visit(part.parts, path);
    }
  };
  visit(spec.parts, "");
  return out;
}

/** Overlay-bearing parts declare their anchor custom-property via
 *  `overlay.anchorVar` (a `--t-{name}-anchor`-shaped name). Recognize it as a
 *  public slot so the contract check doesn't flag it as drift. */
function overlayAnchorSlot(spec: Spec): { suffix: string; path: string } | undefined {
  if (spec.kind !== "composite") return undefined;
  for (const [partName, part] of Object.entries(spec.parts)) {
    const anchorVar = part.overlay?.anchorVar;
    if (!anchorVar) continue;
    const prefix = `--t-${spec.name}-`;
    if (!anchorVar.startsWith(prefix)) continue;
    return {
      suffix: anchorVar.slice(prefix.length),
      path: `parts.${partName}.overlay.anchorVar`,
    };
  }
  return undefined;
}

export function checkTokenContract(spec: Spec, css: string | undefined): Issue[] {
  const issues: Issue[] = [];
  const declared = declaredPublicSlots(spec);
  const anchor = overlayAnchorSlot(spec);
  if (anchor) declared.set(anchor.suffix, anchor.path);
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
  for (const [suffix, path] of declared) {
    if (!slots.has(suffix)) {
      issues.push(
        issue(
          spec.name,
          path,
          `token slot is declared in the spec but never read in the CSS as --t-${spec.name}-${suffix}`,
        ),
      );
    }
  }
  for (const suffix of slots) {
    if (!declared.has(suffix)) {
      issues.push(
        issue(
          spec.name,
          "tokens",
          `CSS reads --t-${spec.name}-${suffix} but no matching token is declared in the spec`,
        ),
      );
    }
  }
  return issues;
}

// ── Token fallback values ↔ tokens.css ──────────────────────────────────────

/**
 * Every `spec.tokens.X.fallback`, every `intents.X.tokens.Y`, every
 * `sizes.X.tokens.Y` value names a `--t-*` token. Assert each name exists
 * in `tokens.css` (or matches the component's own `--t-{name}-*` override
 * slot, the only escape-hatch). Walks composite parts. Without this, a
 * typo'd `--t-acent` passes the schema and silently resolves to the
 * literal floor at runtime.
 */
export function checkTokenFallbacks(spec: Spec, tokensCss: TokensCss): Issue[] {
  const issues: Issue[] = [];
  const ownSlotPrefix = `--t-${spec.name}-`;
  const validate = (fallback: string, path: string): void => {
    // Literal CSS values (`stretch`, `flex-start`, …) are allowed for layout
    // primitives where the default isn't a theme token. Any `--*` custom
    // property reference must resolve to a known token; a typo like `--acent`
    // (missing the `t-`) would otherwise silently pass as a "literal".
    if (!fallback.startsWith("--")) return;
    if (tokensCss.has(fallback)) return;
    if (fallback.startsWith(ownSlotPrefix)) return;
    issues.push(
      issue(spec.name, path, `fallback '${fallback}' is not a token declared in tokens.css`),
    );
  };
  const visitNode = (node: AtomicSpec | SpecPart, basePath: string): void => {
    for (const [key, def] of Object.entries(node.tokens ?? {})) {
      validate(def.fallback, `${basePath}tokens.${key}.fallback`);
    }
    for (const [intentName, intent] of Object.entries(node.intents ?? {})) {
      for (const [tokenKey, fallback] of Object.entries(intent.tokens ?? {})) {
        validate(fallback, `${basePath}intents.${intentName}.tokens.${tokenKey}`);
      }
    }
    for (const [sizeName, size] of Object.entries(node.sizes ?? {})) {
      for (const [tokenKey, fallback] of Object.entries(size.tokens ?? {})) {
        validate(fallback, `${basePath}sizes.${sizeName}.tokens.${tokenKey}`);
      }
    }
  };
  if (isAtomic(spec)) {
    visitNode(spec, "");
  } else if (isComposite(spec)) {
    const walk = (parts: Record<string, SpecPart>, basePath: string): void => {
      for (const [partName, part] of Object.entries(parts)) {
        const partPath = basePath === "" ? `parts.${partName}` : `${basePath}.parts.${partName}`;
        visitNode(part, `${partPath}.`);
        if (part.parts) walk(part.parts, partPath);
      }
    };
    walk(spec.parts, "");
  }
  return issues;
}

// ── Private-token slots (`--_*`) ↔ CSS declarations ─────────────────────────

/** Climb a rule's parent chain to the top-level rule (the one directly under
 *  an `@layer` block). For nested selectors like `&:where([data-size="sm"])`
 *  AND for rules nested inside `@media` / `@supports` atrules (responsive
 *  modifiers), the climb passes through atrules so the slot attributes to
 *  the enclosing `.t-foo` rule that owns the slot namespace. */
function rootRule(rule: postcss.Rule): postcss.Rule {
  let current: postcss.Rule = rule;
  let parent = current.parent;
  while (parent) {
    if (parent.type === "rule") {
      current = parent as postcss.Rule;
      parent = current.parent;
    } else if (parent.type === "atrule") {
      parent = parent.parent;
    } else {
      break;
    }
  }
  return current;
}

/** Walk the CSS and group every `--_*` declaration by its enclosing
 *  top-level selector (a stripped class name like `t-tooltip`). */
function privateSlotsBySelector(css: string): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  const root = postcss([postcssEach()]).process(css, { from: undefined }).root;
  root.walkDecls(/^--_/, (decl) => {
    const parent = decl.parent;
    if (parent === undefined || parent.type !== "rule") return;
    const top = rootRule(parent as postcss.Rule);
    const cls = top.selector.match(/^\.([A-Za-z0-9_-]+)/)?.[1];
    if (cls === undefined) return;
    const set = out.get(cls) ?? new Set<string>();
    set.add(decl.prop);
    out.set(cls, set);
  });
  return out;
}

/**
 * Asserts every `--_*` slot the component CSS declares is enumerated in the
 * appropriate `privateTokens` list, and vice versa. For atomic specs the
 * single `spec.privateTokens` list owns every slot. For composite specs each
 * part's `privateTokens` list owns the slots declared under that part's
 * `rootClass` — drift across parts is caught (a slot declared on the
 * `.t-tooltip-trigger` rule but listed under `parts.content.privateTokens`
 * fails on both ends).
 */
export function checkPrivateTokens(spec: Spec, css: string | undefined): Issue[] {
  const issues: Issue[] = [];
  if (css === undefined) return issues;
  const slotsBySelector = privateSlotsBySelector(css);

  const checkOne = (
    declared: ReadonlyArray<string>,
    cls: string | undefined,
    path: string,
  ): void => {
    const used = cls === undefined ? new Set<string>() : (slotsBySelector.get(cls) ?? new Set());
    const declaredSet = new Set(declared);
    for (const slot of declaredSet) {
      if (!used.has(slot)) {
        issues.push(
          issue(
            spec.name,
            path,
            cls === undefined
              ? `'${slot}' is listed in privateTokens but never declared in the CSS`
              : `'${slot}' is listed in ${path} but never declared under .${cls} in the CSS`,
          ),
        );
      }
    }
    if (cls !== undefined) {
      for (const slot of used) {
        if (!declaredSet.has(slot)) {
          issues.push(
            issue(spec.name, path, `.${cls} declares '${slot}' but it is not listed in ${path}`),
          );
        }
      }
    }
  };

  if (isAtomic(spec)) {
    checkOne(spec.privateTokens ?? [], spec.rootClass, "privateTokens");
    // Catch slot decls under selectors that don't match the root class
    // (most components ship one class; if a stray class appears, surface it).
    for (const [cls, slots] of slotsBySelector) {
      if (cls === spec.rootClass) continue;
      for (const slot of slots) {
        issues.push(
          issue(
            spec.name,
            "privateTokens",
            `.${cls} declares '${slot}' but no part with that rootClass is declared`,
          ),
        );
      }
    }
    return issues;
  }

  if (isComposite(spec)) {
    const seen = new Set<string>();
    const walk = (parts: Record<string, SpecPart>, prefix: string): void => {
      for (const [partName, part] of Object.entries(parts)) {
        const path = prefix === "" ? `parts.${partName}` : `${prefix}.parts.${partName}`;
        checkOne(part.privateTokens ?? [], part.rootClass, `${path}.privateTokens`);
        if (part.rootClass) seen.add(part.rootClass);
        if (part.parts) walk(part.parts, path);
      }
    };
    walk(spec.parts, "");
    for (const [cls, slots] of slotsBySelector) {
      if (seen.has(cls)) continue;
      for (const slot of slots) {
        issues.push(
          issue(
            spec.name,
            "privateTokens",
            `.${cls} declares '${slot}' but no part with that rootClass is declared`,
          ),
        );
      }
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
    case "visualStates":
      return Object.keys(spec.visualStates ?? {});
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

// ── Token name dictionary (`specs/_tokens.yaml`) ────────────────────────────

/**
 * Walks every `tokens:` block (atomic root + composite parts) and asserts
 * each key is either canonical (in the dictionary) or a component-specific
 * name (e.g. Tooltip's `arrow-bg`). Longhand spellings of canonical names
 * (`background`, `borderRadius`) are rejected via the synonym map.
 * Close-but-not-equal typos of canonical names are flagged too.
 */
export function checkTokenNames(spec: Spec, dictionary: TokenDictionary): Issue[] {
  const issues: Issue[] = [];
  const canonicalList = [...dictionary.canonical];
  const visit = (tokens: Record<string, unknown> | undefined, path: string): void => {
    for (const key of Object.keys(tokens ?? {})) {
      if (dictionary.canonical.has(key)) continue;
      const synonymTarget = dictionary.synonyms.get(key);
      if (synonymTarget) {
        issues.push(
          issue(
            spec.name,
            `${path}.${key}`,
            `use canonical '${synonymTarget}' instead of '${key}' (specs/_tokens.yaml synonyms)`,
          ),
        );
        continue;
      }
      const hint = suggest(key, canonicalList, 1);
      if (hint && hint !== key) {
        issues.push(
          issue(
            spec.name,
            `${path}.${key}`,
            `'${key}' looks like a typo of canonical token '${hint}'`,
          ),
        );
      }
    }
  };
  if (isAtomic(spec)) {
    visit(spec.tokens, "tokens");
    return issues;
  }
  if (isComposite(spec)) {
    const walk = (parts: Record<string, SpecPart>, basePath: string): void => {
      for (const [partName, part] of Object.entries(parts)) {
        visit(part.tokens, `${basePath}.${partName}.tokens`);
        if (part.parts) walk(part.parts, `${basePath}.${partName}.parts`);
      }
    };
    walk(spec.parts, "parts");
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

// ── `elementByProp` constraints ────────────────────────────────────────────

/**
 * `elementByProp` resolves the rendered tag at runtime from a controlling
 * prop's value. Four rules keep the generator output sound:
 *
 * - Mutually exclusive with sibling `element` (the tag has one source).
 * - The named prop must exist on the same node.
 * - The named prop must be `type: 'string'` — boolean / number / responsive
 *   prop types are out of scope for the v1 surface.
 * - The named prop's `values:` must enumerate exactly the map's keys (any
 *   value the consumer can pass must hit the map; every map key must be a
 *   valid prop value).
 *
 * Walks atomic root + composite parts via `visitNodes`.
 */
export function checkElementByProp(spec: Spec): Issue[] {
  const issues: Issue[] = [];
  visitNodes(spec, (node, path) => {
    const ebp = node.elementByProp;
    if (!ebp) return;
    const base = path === "" ? "elementByProp" : `${path}.elementByProp`;
    if (node.element) {
      issues.push(
        issue(
          spec.name,
          base,
          "`elementByProp` and `element` are mutually exclusive — the rendered tag has one source",
        ),
      );
    }
    const controllingProp = node.props?.[ebp.prop];
    if (!controllingProp) {
      issues.push(
        issue(spec.name, `${base}.prop`, `prop '${ebp.prop}' is not declared on this node`),
      );
      return;
    }
    if (controllingProp.type !== "string") {
      issues.push(
        issue(
          spec.name,
          `${base}.prop`,
          `prop '${ebp.prop}' must be \`type: 'string'\`; got '${controllingProp.type}'`,
        ),
      );
    }
    const mapKeys = Object.keys(ebp.map).sort();
    const values = (controllingProp.values ?? []).slice().sort();
    if (mapKeys.length === 0) {
      issues.push(issue(spec.name, `${base}.map`, "`map` must declare at least one entry"));
    }
    const missingFromMap = values.filter((v) => !Object.hasOwn(ebp.map, v));
    const missingFromValues = mapKeys.filter((k) => !values.includes(k));
    if (missingFromMap.length > 0) {
      issues.push(
        issue(
          spec.name,
          `${base}.map`,
          `prop value(s) [${missingFromMap.join(", ")}] are not in the map`,
        ),
      );
    }
    if (missingFromValues.length > 0) {
      issues.push(
        issue(
          spec.name,
          `${base}.map`,
          `map key(s) [${missingFromValues.join(", ")}] are not declared in \`${ebp.prop}.values\``,
        ),
      );
    }
  });
  return issues;
}

// ── Atomic `polymorphic: 'asChild'` constraints ────────────────────────────

/**
 * Atomic specs may opt into Slot-based polymorphism with
 * `polymorphic: 'asChild'`. Two combinations are rejected:
 *
 * - `polymorphic` + a sibling `as` prop. `as` is the rejected pattern per
 *   the patterns doc §1.6; the two are mutually exclusive — declaring both
 *   on the same spec is a spec authoring error.
 * - `polymorphic` on a void-element root (`hr`, `img`, …). Slot expects a
 *   single child element to clone into; a void root has no children path,
 *   so Slot would always warn.
 */
export function checkPolymorphicAtomic(spec: Spec): Issue[] {
  if (!isAtomic(spec)) return [];
  if (spec.polymorphic !== "asChild") return [];
  const issues: Issue[] = [];
  if (spec.props && "as" in spec.props) {
    issues.push(
      issue(
        spec.name,
        "polymorphic",
        "`polymorphic: 'asChild'` is mutually exclusive with a sibling `as` prop — pick one polymorphism strategy",
      ),
    );
  }
  if (spec.props && "asChild" in spec.props) {
    issues.push(
      issue(
        spec.name,
        "props.asChild",
        "`asChild` is emitted automatically by the polymorphic flag; remove the declared prop or drop `polymorphic`",
      ),
    );
  }
  if (spec.element && isVoidElement(spec.element)) {
    issues.push(
      issue(
        spec.name,
        "polymorphic",
        `\`polymorphic: 'asChild'\` requires a child-bearing root element; '${spec.element}' is a void element`,
      ),
    );
  }
  return issues;
}

// ── Void HTML elements reject child-bearing prop declarations ───────────────

/**
 * Void elements (`hr`, `img`, `input`, `br`, …) cannot have children, so
 * codegen emits the self-closing form. A spec author who declares slot props,
 * `loading`, or `as` on a void element gets no compile-time signal — the
 * codegen silently ignores them. Flag at spec-validation time so the dead
 * fields surface in review. `disabled` is rejected on non-form-control voids
 * (where it is a no-op) but accepted on `input` (where it carries native
 * semantics). Walks composite parts.
 */
const FORM_CONTROL_VOIDS = new Set(["input"]);

export function checkVoidElementConstraints(spec: Spec): Issue[] {
  const issues: Issue[] = [];
  visitNodes(spec, (node, path) => {
    if (!node.element || !isVoidElement(node.element)) return;
    const tag = node.element;
    // `isVoidElement` lowercases its input; compare the FORM_CONTROL_VOIDS
    // membership the same way so `element: INPUT` is treated as `element: input`.
    const tagLower = tag.toLowerCase();
    const propsPath = (key: string) => (path === "" ? `props.${key}` : `${path}.props.${key}`);
    const slotProps = Object.entries(node.props ?? {})
      .filter(([, d]) => d.slot === true)
      .map(([n]) => n);
    for (const slot of slotProps) {
      issues.push(
        issue(spec.name, propsPath(slot), `void element <${tag}> cannot host slot props`),
      );
    }
    if ("loading" in (node.props ?? {})) {
      issues.push(
        issue(
          spec.name,
          propsPath("loading"),
          `void element <${tag}> cannot render a loading spinner child`,
        ),
      );
    }
    if ("as" in (node.props ?? {})) {
      issues.push(
        issue(
          spec.name,
          propsPath("as"),
          `void element <${tag}> cannot declare \`as\` — polymorphism to a non-void element breaks codegen-time void detection`,
        ),
      );
    }
    if ("disabled" in (node.props ?? {}) && !FORM_CONTROL_VOIDS.has(tagLower)) {
      issues.push(
        issue(
          spec.name,
          propsPath("disabled"),
          `void element <${tag}> ignores \`disabled\` (only form-control voids like <input> honor it)`,
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

// ── Events block ────────────────────────────────────────────────────────────

const CAMEL_TAIL_RE = /[A-Z][a-zA-Z0-9]*$/;

function eventVerb(name: string): string {
  const match = name.match(CAMEL_TAIL_RE);
  return match ? match[0].toLowerCase() : name.toLowerCase();
}

function visitPayload(
  entry: PayloadEntry,
  path: string,
  visit: (p: PayloadEntry, path: string) => void,
): void {
  visit(entry, path);
  if (entry.type === "array") visitPayload(entry.of, `${path}.of`, visit);
}

function collectControllableProps(spec: Spec): string[] {
  const names: string[] = [];
  visitNodes(spec, (node) => {
    for (const [propName, def] of Object.entries(node.props ?? {})) {
      if (def.pattern === "controllable") names.push(propName);
    }
  });
  return names;
}

/**
 * Validates `events:` declarations against the vocab + the spec's own
 * `generics:` and controllable props:
 *
 *  - Name doesn't match the vocab pattern.
 *  - Last camelCase token isn't a registered verb (Levenshtein suggestion).
 *  - Name's verb is a synonym for a canonical verb.
 *  - Name's verb is a synonym whose canonical is '—' (controllable).
 *  - Payload `generic.ref` not in this spec's `generics:` block.
 *  - Payload `builtin.name` not in vocab `events.builtins`.
 *  - Event name collides with a `<prop>Change` callback emitted by a
 *    controllable prop on this spec.
 *
 * Sub-part declarations fall out of the schema: `events:` lives on
 * `identityFields`, so a part-level declaration fails strictObject
 * with an "Unrecognized key" before semantic checks run.
 */
// Generic names that would shadow codegen-emitted globals when used as a
// type parameter. Two sources:
//  - Codegen helpers / imports: `Array` (array payload), `Record`
//    (empty-props sentinel), `Partial`, `ReadonlyArray` (repeating-part
//    prop type), `Responsive` (responsive-helper import).
//  - Closed-vocab event builtins (`File`, `Date`, `MouseEvent`, …) added
//    at check time from vocabulary.events.builtins.
const RESERVED_GENERIC_NAMES_BASE = new Set([
  "Array",
  "Record",
  "Partial",
  "ReadonlyArray",
  "Responsive",
]);

/**
 * Spec-local type aliases gen-contract emits for this spec. A generic
 * parameter named the same as one of these would shadow the alias inside
 * the Props/Event body, silently widening the contract.
 */
function collectSpecLocalAliases(spec: Spec): Set<string> {
  const Name = pascalCase(spec.name);
  const aliases = new Set<string>([`${Name}Props`]);
  if (spec.events && Object.keys(spec.events).length > 0) aliases.add(`${Name}Event`);

  // Mirror the contract printer: it reads FlatSpec, which drops repeating
  // parts from `variants`/`intents`/`sizes`/`props` and renders item-prop
  // value unions inline inside the generated item type — no standalone
  // `<Name><Prop>` alias is emitted for repeating-item props. Skipping
  // repeating parts here keeps the reserved set in sync with what's
  // actually emitted.
  if (isAtomic(spec)) {
    addNodeAliases(spec, Name, aliases);
  } else if (isComposite(spec)) {
    const visit = (parts: Record<string, SpecPart>): void => {
      for (const [partName, part] of Object.entries(parts)) {
        if (part.repeating === true) {
          aliases.add(repeatingItemTypeName(Name, part, partName));
          continue;
        }
        addNodeAliases(part, Name, aliases);
        if (part.parts) visit(part.parts);
      }
    };
    visit(spec.parts);
  }

  return aliases;
}

function addNodeAliases(
  node: {
    variants?: object;
    intents?: object;
    sizes?: object;
    props?: Record<string, { values?: string[] }>;
  },
  Name: string,
  aliases: Set<string>,
): void {
  if (node.variants && Object.keys(node.variants).length > 0) aliases.add(`${Name}Variant`);
  if (node.intents && Object.keys(node.intents).length > 0) aliases.add(`${Name}Intent`);
  if (node.sizes && Object.keys(node.sizes).length > 0) aliases.add(`${Name}Size`);
  for (const [propName, def] of Object.entries(node.props ?? {})) {
    if (def.values && def.values.length > 0) {
      aliases.add(`${Name}${pascalCase(propName)}`);
    }
  }
}

function repeatingItemTypeName(componentName: string, part: SpecPart, partName: string): string {
  if (typeof part.groupKey === "string") {
    if (part.groupKey.toLowerCase() === "items") return `${componentName}Item`;
    return `${componentName}${pascalCase(part.groupKey)}Item`;
  }
  return `${componentName}${pascalCase(partName)}Item`;
}

export function checkEvents(spec: Spec, vocabulary: Vocabulary): Issue[] {
  const issues: Issue[] = [];
  const { verbs, synonyms, pattern, builtins } = vocabulary.events;
  const reservedGenericNames = new Set<string>(RESERVED_GENERIC_NAMES_BASE);
  for (const builtin of Object.keys(builtins)) reservedGenericNames.add(builtin);
  for (const alias of collectSpecLocalAliases(spec)) reservedGenericNames.add(alias);

  // Generic-name validation runs regardless of whether `events:` is declared:
  // `<Spec>Props` carries the generic parameter list even when no events exist.
  const seenGenericNames = new Set<string>();
  for (const generic of spec.generics ?? []) {
    const gPath = `generics.${generic.name}`;
    if (reservedGenericNames.has(generic.name)) {
      issues.push(
        issue(
          spec.name,
          gPath,
          `'${generic.name}' is reserved; using it as a generic parameter would shadow the global/codegen-emitted type of the same name. Pick a distinct name.`,
        ),
      );
    }
    if (seenGenericNames.has(generic.name)) {
      issues.push(
        issue(
          spec.name,
          gPath,
          `'${generic.name}' is declared more than once in generics:. Each generic name must be unique.`,
        ),
      );
    }
    seenGenericNames.add(generic.name);
  }

  const events = spec.events;
  if (!events || Object.keys(events).length === 0) return issues;

  const nameRe = new RegExp(pattern);
  const verbList = Object.keys(verbs);
  const declaredGenerics = new Set((spec.generics ?? []).map((g) => g.name));
  const controllableCallbacks = new Set(collectControllableProps(spec).map((p) => `${p}Change`));

  // Codegen-emitted handler/channel prop names that must not collide with
  // consumer-declared props. The channel prop is always `onEvent` when any
  // event is declared; per-event handlers are `on<PascalCase(eventName)>`.
  // Repeating-part props surface inside the generated `Item` type, not on
  // the root `Props` surface — skip them so an item prop named `onDismiss`
  // doesn't trip a false collision.
  const declaredPropNames = new Set<string>();
  if (isAtomic(spec)) {
    for (const propName of Object.keys(spec.props ?? {})) declaredPropNames.add(propName);
  } else if (isComposite(spec)) {
    const walk = (parts: Record<string, SpecPart>): void => {
      for (const part of Object.values(parts)) {
        if (part.repeating === true) continue;
        for (const propName of Object.keys(part.props ?? {})) declaredPropNames.add(propName);
        if (part.parts) walk(part.parts);
      }
    };
    walk(spec.parts);
  }
  if (declaredPropNames.has("onEvent")) {
    issues.push(
      issue(
        spec.name,
        "props.onEvent",
        `'onEvent' is reserved — codegen emits an aggregated channel prop with that name on every spec that declares events:. Rename the prop or remove the events: block.`,
      ),
    );
  }

  for (const [name, entry] of Object.entries(events)) {
    const path = `events.${name}`;

    if (!nameRe.test(name)) {
      issues.push(
        issue(
          spec.name,
          path,
          `'${name}' is not a valid event name. Use camelCase: '<verb>' or '<subjectNoun><Verb>'.`,
        ),
      );
      continue;
    }

    const verb = eventVerb(name);

    if (Object.hasOwn(synonyms, verb)) {
      const canonical = synonyms[verb];
      if (canonical === "—") {
        issues.push(
          issue(
            spec.name,
            path,
            `'${name}' uses the state-mirror verb '${verb}'. Declare \`pattern: "controllable"\` on the '${verb}' prop instead of declaring an event.`,
          ),
        );
      } else {
        issues.push(
          issue(
            spec.name,
            path,
            `'${verb}' is registered as a synonym for '${canonical}'. Use '${canonical}' to keep event names consistent across components.`,
          ),
        );
      }
    } else if (!Object.hasOwn(verbs, verb)) {
      issues.push(
        issue(
          spec.name,
          path,
          `'${name}' verb '${verb}' is not registered.${suggestionFragment(verb, verbList)}`,
        ),
      );
    }

    if (controllableCallbacks.has(name)) {
      const propName = name.slice(0, -"Change".length);
      issues.push(
        issue(
          spec.name,
          path,
          `'${name}' collides with the on${propName[0]?.toUpperCase()}${propName.slice(1)}Change callback emitted by \`pattern: "controllable"\` on prop '${propName}'. Pick a distinct event name or remove the controllable pattern.`,
        ),
      );
    }

    const handlerName = `on${name[0]?.toUpperCase() ?? ""}${name.slice(1)}`;
    if (declaredPropNames.has(handlerName)) {
      issues.push(
        issue(
          spec.name,
          path,
          `event '${name}' would emit a '${handlerName}' prop, which is already declared on this spec. Rename the prop or the event.`,
        ),
      );
    }

    for (const [field, payload] of Object.entries(entry.payload)) {
      if (!JS_IDENTIFIER_RE.test(field)) {
        issues.push(
          issue(
            spec.name,
            `${path}.payload.${field}`,
            `'${field}' is not a valid payload field name. Codegen emits it as a property identifier; use letters/digits/_/$ (must not start with a digit).`,
          ),
        );
        continue;
      }
      if (field === "type") {
        issues.push(
          issue(
            spec.name,
            `${path}.payload.${field}`,
            `'type' is reserved as the channel discriminator on the generated event union. Rename the payload field.`,
          ),
        );
        continue;
      }
      visitPayload(payload, `${path}.payload.${field}`, (p, payloadPath) => {
        if (p.type === "generic" && !declaredGenerics.has(p.ref)) {
          issues.push(
            issue(
              spec.name,
              payloadPath,
              `'${name}' payload references generic '${p.ref}' which is not declared in this spec's generics: block.`,
            ),
          );
        }
        if (p.type === "builtin" && !Object.hasOwn(builtins, p.name)) {
          issues.push(
            issue(
              spec.name,
              payloadPath,
              `'${name}' payload references built-in type '${p.name}' which is not registered. Add it to specs/_vocabulary.yaml events.builtins.`,
            ),
          );
        }
      });
    }
  }
  return issues;
}

/**
 * Runtime-source check for declared events.
 *
 * `gen-contract` produces type surfaces for any declared event, but a
 * wrapper-runtime auto-fire path exists only for a small subset today. The
 * audit principle:
 * either the generator fires the event, or the semantic check rejects the
 * declaration. Without this rule, a spec can declare `select` /
 * `inputChange` / `rowClick`; consumers see the per-event prop on the
 * surface; the prop never fires from the wrapper.
 *
 * v1 supports `dismiss` only, only on overlay composites. Other declared
 * events must wait until their runtime source ships in the matching
 * `gen-*` template.
 */
export function checkEventsRuntimeSupport(spec: Spec): Issue[] {
  const events = spec.events;
  if (!events || Object.keys(events).length === 0) return [];
  const issues: Issue[] = [];

  // Today's runtime-supported event sources, scoped to spec shapes the
  // generator actually emits firing code for. Extending this set means
  // adding the firing path in the matching generator template + updating
  // this list in the same change. `supportsGenerics` tracks whether the
  // generated wrapper declares type parameters on its props / signature —
  // composite-overlay wrappers don't today, so a spec with `events:` AND
  // `generics:` would emit references to undeclared identifiers.
  const SUPPORTED_BY_SHAPE: ReadonlyArray<{
    matches: (s: Spec) => boolean;
    events: ReadonlyArray<string>;
    shape: string;
    supportsGenerics: boolean;
  }> = [
    {
      matches: (s) => isComposite(s) && Object.values(s.parts).some((p) => p.overlay !== undefined),
      events: ["dismiss"],
      shape: "composite-overlay",
      supportsGenerics: false,
    },
  ];

  // Per-event runtime payload contract — the closed-set values the wrapper
  // runtime actually fires. A spec whose payload diverges from this set
  // would produce a generated wrapper whose handler signature can't be
  // passed to the runtime hook (TS error downstream). Reject at the spec
  // layer with a clear path.
  const REQUIRED_REASON_VALUES: Record<string, ReadonlySet<string>> = {
    dismiss: new Set(["outside", "escape", "button"]),
  };

  const shape = SUPPORTED_BY_SHAPE.find((s) => s.matches(spec));

  // Generics + events combo: the wrapper template must declare the generic
  // parameters on its props and component signature for the emitted type
  // references to resolve. Until each shape's template gains that support,
  // reject the combination here so consumers don't ship a contract that
  // compiles in isolation but fails in the wrapper.
  const hasGenerics = (spec.generics ?? []).length > 0;
  if (shape && hasGenerics && !shape.supportsGenerics) {
    issues.push(
      issue(
        spec.name,
        "generics",
        `${shape.shape} wrappers do not declare generic type parameters yet, so an events: block together with generics: would emit undeclared identifiers in the React wrapper. Remove generics: or wait for the wrapper-template generic-parameter pass.`,
      ),
    );
  }

  for (const name of Object.keys(events)) {
    if (!shape) {
      issues.push(
        issue(
          spec.name,
          `events.${name}`,
          `Declared events are not supported on this spec shape yet. v1 supports composite-overlay specs and the 'dismiss' event only. Remove the events: block or migrate the spec to an overlay composite.`,
        ),
      );
      continue;
    }
    if (!shape.events.includes(name)) {
      const supported = shape.events.map((e) => `'${e}'`).join(", ");
      issues.push(
        issue(
          spec.name,
          `events.${name}`,
          `Event '${name}' has no wrapper-runtime source on ${shape.shape} specs (v1 supports ${supported} only). Extend the generator template to fire the event before re-declaring it here.`,
        ),
      );
      continue;
    }
    const expectedReasons = REQUIRED_REASON_VALUES[name];
    if (!expectedReasons) continue;
    const entry = events[name];
    const reasonEntry = entry?.payload?.reason;
    const expectedList = [...expectedReasons].map((v) => `'${v}'`).join(", ");
    if (reasonEntry?.type !== "enum") {
      issues.push(
        issue(
          spec.name,
          `events.${name}.payload.reason`,
          `event '${name}' must declare a 'reason' field of type 'enum' with values matching the wrapper-runtime contract (${expectedList}).`,
        ),
      );
      continue;
    }
    const declared = new Set(reasonEntry.values);
    const exact =
      declared.size === expectedReasons.size && [...expectedReasons].every((v) => declared.has(v));
    if (!exact) {
      issues.push(
        issue(
          spec.name,
          `events.${name}.payload.reason`,
          `event '${name}'.payload.reason.values must match the wrapper-runtime contract exactly. Required: [${expectedList}]; declared: [${[...declared].map((v) => `'${v}'`).join(", ")}].`,
        ),
      );
    }
  }
  return issues;
}

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

// ── Examples presence ───────────────────────────────────────────────────────

/**
 * Every spec must declare at least one entry in `examples:`. A spec without
 * examples produces a docs page that lists props and types but renders no
 * actual component — consumers can't see the thing they're documenting.
 * The empty case has no positive value and is almost always a forgotten
 * authoring step.
 */
export function checkExamplesPresent(spec: Spec): Issue[] {
  if (spec.examples && spec.examples.length > 0) return [];
  return [
    issue(
      spec.name,
      "examples",
      `spec must declare at least one entry in \`examples:\` — components without examples produce empty docs pages.`,
    ),
  ];
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
    ...checkTokenContract(spec, ctx.css),
    ...checkTokenFallbacks(spec, ctx.tokensCss),
    ...checkPrivateTokens(spec, ctx.css),
    ...checkTokenNames(spec, ctx.tokenDictionary),
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
    ...checkElementByProp(spec),
    ...checkPolymorphicAtomic(spec),
    ...checkVoidElementConstraints(spec),
    ...checkRepeatingParts(spec),
    ...checkExamplesPresent(spec),
    ...checkEvents(spec, ctx.vocabulary),
    ...checkEventsRuntimeSupport(spec),
    ...checkStateMachines(spec, ctx.vocabulary),
  ];
}

export type { CssIndex, DependencyIndex };
