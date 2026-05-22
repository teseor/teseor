# Contribution paths

Each contribution kind has its own shape. Pick the right path before you open
a PR — the wrong path triggers the wrong gates and slows review down.

| Path | What you file | What gets reviewed | Typical turnaround |
| --- | --- | --- | --- |
| [Component](#component) | spec + CSS + tests | spec coverage, CSS rules, visual + a11y output | 1–2 review cycles |
| [Theme](#theme) | one token-only CSS file | token-set completeness, contrast, fallback chain | 1 cycle |
| [Vocabulary addition](#vocabulary-addition) | PR against `_vocabulary.yaml` | term necessity, naming consistency | 1 cycle |
| [Codemod](#codemod) | new transform in `packages/codemods/` | transform correctness, fixtures, idempotency | 1–2 cycles |
| [RFC](#rfc) | a doc in `docs/RFC/` from the template | shape of the proposal, motivation, alternatives | 1 cycle to land in `proposed`; weeks to `accepted` |

If you're not sure which path applies, file an issue first and ask. The wrong
path is recoverable; an unscoped PR is not.

## Component

When the change introduces a new component, or adds variants/intents/sizes to
an existing one.

### Component — what to file

- `specs/<name>.yaml` — declares variants, intents, sizes, props, tokens, a11y
  contract, examples, motion. See `architecture/codegen-pipeline.md` for the
  full schema.
- `packages/css/src/components/<name>/<name>.css` — the handwritten CSS.
  Token contract in the spec must match every `--t-<name>-*` declared in CSS
  (validator enforces both directions).
- `pnpm gen` regenerates wrappers, contract types, docs data, and test
  scaffolds. Commit the regenerated output — `gen-drift` CI fails if it's
  missing.
- A Playwright example per `spec.examples[]` entry. Default scaffold from
  `gen-tests.ts` is the starting point; add assertions beyond rendering when
  the behavior calls for it.
- A changeset — `pnpm changeset` — at the level dictated by the change:
  new component → minor, new variant → minor, bug fix → patch.

### Component — what gets reviewed

- Spec follows the schema and uses canonical vocabulary (`_vocabulary.yaml`).
- CSS obeys hard rules (`rules/hard-rules.md`), motion rules
  (`rules/motion.md`), and the responsive contract (`rules/responsive.md`).
- a11y: keyboard map + ARIA contract listed in spec match what the Playwright
  - axe tests assert.
- Visual snapshots: new examples have baselines; existing baselines unchanged.
- Bundle delta is reasonable for the added surface.

### Component — out of scope

Refactors of unrelated components, token additions, or theme tweaks. Bundle
those separately.

## Theme

When the change adds or updates a `[data-theme="…"]` skin.

### Theme — what to file

- One file at `themes/<theme>.css` (or edits to an existing one).
- Token-only. The Stylelint theme-purity rule blocks any declaration that
  isn't a `--t-*` custom property. Allowed selectors are `:root`,
  `[data-theme="<id>"]`, the mode-pair `[data-theme="<id>"][data-mode="…"]`,
  and the `@media (prefers-color-scheme: …)` form. See
  `architecture/themes.md` for the canonical file shape.
- A changeset (minor — a new theme is consumer-facing surface).

### Theme — what gets reviewed

- Every token in the public contract has a value (no missing variables once
  the theme is active).
- Contrast pairs documented in `rules/accessibility.md` clear the WCAG floor.
- No class selectors, element selectors, `@import`, or `!important`.
- The fallback chain still resolves when the theme is partially supported
  (older browsers).

### Theme — out of scope

Component-shape changes, new tokens. Theme files consume the token contract;
they don't extend it. Adding a token is a separate PR against `tokens.css`.

## Vocabulary addition

When the change adds a term to the shared vocabulary (variant names, intent
names, size names, prop names, slot names).

### Vocabulary addition — what to file

- A PR against `specs/_vocabulary.yaml` adding the term and a one-line
  rationale.
- If the term lands a new value in an existing axis (e.g. a sixth size), the
  PRs that adopt the value follow — but the vocabulary PR is independent and
  reviewable on its own.

### Vocabulary addition — what gets reviewed

- The term doesn't already exist under a different name.
- It composes with the rest of the vocabulary (a new intent should pair with
  every variant; a new size should slot into the existing scale).
- Naming follows `rules/naming.md` — short, lowercase, kebab where multi-word,
  no abbreviations that aren't already in the vocabulary.

### Vocabulary addition — out of scope

Adopting the new term in components. Land vocabulary first, then the
component PRs that use it. This keeps each PR small and reverts clean.

## Codemod

When a breaking change ships and a mechanical rewrite covers most consumer
code paths.

### Codemod — what to file

- A new transform in `packages/codemods/src/<from>-to-<to>/<rule>.ts`.
- Fixtures: paired `input.<ext>` / `output.<ext>` in
  `packages/codemods/test/<from>-to-<to>/<rule>/`. The test runner asserts
  `transform(input) === output` and `transform(output) === output`
  (idempotency).
- A README at `packages/codemods/src/<from>-to-<to>/README.md` listing the
  available rules.
- A changeset against `@teseor/codemods` (minor or patch — codemods don't
  bump the design-system version).

### Codemod — what gets reviewed

- Transform covers the documented cases (the migration guide lists them).
- Tests include at least one fixture where the transform is a no-op
  (proving idempotency).
- The rule is named after the *change*, not the version
  (`--rule=class-rename`, not `--rule=v0-6`).
- Edge cases that can't be transformed are detected and reported, not silently
  passed through.

### Codemod — out of scope

Judgment-required transformations — anything that changes the *meaning* of
the code rather than just renaming or restructuring it. Those go into the
migration guide as prose, not as a codemod.

### Codemod — see also

`process/versioning.md` § "Codemods" for the mechanical / judgment-required
split, and `process/migrations-end-to-end.md` for the full lifecycle of a
breaking change.

## RFC

When the change is a design or process proposal that deserves discussion
before implementation. Use the RFC path when:

- The change touches the public API contract beyond a single component.
- The change adopts or replaces a tool that the whole codebase depends on.
- The change introduces a new architectural concept (a new package, a new
  generator, a new build pipeline).
- Reasonable contributors might disagree on the right shape.

### RFC — what to file

- Copy `docs/RFC/_template.md` to `docs/RFC/<NNNN>-<short-slug>.md`. Pick the
  next free number.
- Fill every section. "Unresolved questions" can be substantive — RFCs land
  in `status: draft` and graduate.
- Open a PR. The PR's only purpose is landing the RFC in `draft` (or
  `proposed`); implementation is a follow-up PR.

### RFC — what gets reviewed

- Motivation is concrete (a problem someone has hit, not "we should be more
  consistent").
- "Alternatives" lists at least one realistic option that was considered and
  rejected.
- "Adoption strategy" answers the question "what does this look like for
  someone using Teseor today" — migration window, codemod or guide, default
  vs opt-in.
- The proposal is bounded. "What this *doesn't* propose" is as important as
  what it does.

### After landing in `draft`

- Discussion happens on the PR (or, if it's settled, on follow-up PRs that
  reference the RFC by file path — never by number, since RFCs renumber on
  merge conflicts).
- The author or a maintainer moves it to `proposed` when the design is
  stable, then to `accepted` when implementation lands, then to `superseded`
  if a later RFC replaces it. `rejected` is a valid terminal state — closed
  RFCs are kept, not deleted, so the reasoning survives.

### RFC — out of scope

Implementation. Land the RFC first, file the implementation issue from it,
then ship the implementation in a normal component / theme / codemod PR.

## When none of the above fits

Tooling changes, repo-scoped configuration, CI tweaks, dev-script edits —
file an issue with the `type:chore` label and propose the change. These
don't need a dedicated path because the surface is small and the review is
"does this work locally and in CI."

If the chore PR turns out to be larger than expected (touches more than
~3 files of substance, or changes contributor workflow), pause it and open
an RFC instead. The path you started on isn't binding — switching paths is
cheap; landing a big change on the wrong path is not.
