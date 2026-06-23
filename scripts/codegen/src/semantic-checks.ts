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
import { checkStateMachines } from "./plugins/states/check.ts";
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
import type { Spec } from "./schema.ts";

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

export { checkA11yRefs };

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
export { checkStateMachines } from "./plugins/states/check.ts";
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
