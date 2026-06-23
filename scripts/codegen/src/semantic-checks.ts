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
import {
  checkConstraintsAgainstCoverage,
  checkConstraintsAgainstExamples,
} from "./plugins/constraints/check.ts";
import { checkCoverageShape } from "./plugins/coverage/check.ts";
import { checkElementByProp } from "./plugins/elementByProp/check.ts";
import { checkEvents, checkEventsRuntimeSupport } from "./plugins/events/check.ts";
import { checkExamplesPresent } from "./plugins/examples/check.ts";
import { checkFormControl } from "./plugins/formControl/check.ts";
import { checkImperativeProps } from "./plugins/imperativeProps/check.ts";
import { checkMotion } from "./plugins/motion/check.ts";
import { checkRepeatingParts } from "./plugins/parts/check.ts";
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
import { checkVocabulary } from "./plugins/vocabulary/check.ts";
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

type CompositeSpec = Spec & { kind: "composite" };

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

export { checkA11yRefs };

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
export {
  checkConstraintsAgainstCoverage,
  checkConstraintsAgainstExamples,
} from "./plugins/constraints/check.ts";
export { checkCoverageShape } from "./plugins/coverage/check.ts";
export type { DependencyIndex } from "./plugins/dependencies/check.ts";
export { checkDependencyCycles } from "./plugins/dependencies/check.ts";
export { checkElementByProp } from "./plugins/elementByProp/check.ts";
export { checkEvents, checkEventsRuntimeSupport } from "./plugins/events/check.ts";
export { checkExamplesPresent } from "./plugins/examples/check.ts";
export { checkFormControl } from "./plugins/formControl/check.ts";
export { checkImperativeProps } from "./plugins/imperativeProps/check.ts";
export { checkRepeatingParts } from "./plugins/parts/check.ts";
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
export { checkVocabulary } from "./plugins/vocabulary/check.ts";
export { checkVoidElementConstraints } from "./plugins/voidElements/check.ts";

export type { CssIndex };
