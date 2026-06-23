// Semantic cross-checks the Zod schema cannot express: the spec ↔ CSS token
// contract (both directions), example references, constraint enforcement
// across `examples:` and the cartesian-expanded `coverage:` cells, vocabulary
// drift with Levenshtein suggestions, motion in/out symmetry, dependency
// cycles, the `@import` allowlist driven by `dependencies:`, and
// `guidance.variantChoice` key equality with `spec.variants`.

import type { Issue } from "./core/check-utils.ts";
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

export type { Issue } from "./core/check-utils.ts";
export { levenshtein, suggest } from "./core/check-utils.ts";

type TokensCss = ReadonlySet<string>;

type CssIndex = {
  /** Spec basename to the CSS source string. */
  cssByName: Map<string, string>;
};

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
