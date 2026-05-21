# Hard rules

Twelve rules. Each one earns its place because breaking it has a known cost. Where a rule overrides a tempting shortcut, the **why** explains the cost.

## Tokens

**1. Three-tier tokens.** Scale (raw) → semantic (alias) → component-private. Components read semantic only. Themes write semantic only. No component reaches into the scale; no theme file contains element selectors.
*Why:* swapping a theme has to be one file. Element selectors in a theme create override wars; reaching into the scale binds components to specific design values.

**2. No raw hex, rgb, or px in components.** Every color and dimension in a component CSS file is `var(--t-…, fallback)`. The fallback may be a hardcoded literal — that's the third tier and it's allowed; raw values without the var wrapper are not.
*Why:* enforced by `stylelint`'s `unit-disallowed-list: ["px"]` and `declaration-property-value-disallowed-list`. The fallback literal exists so the component doesn't visually break if `tokens.css` fails to load.

**3. Specs (`specs/*.yaml`) are source of truth for everything downstream.** Wrappers, docs, types, tests are codegen output. Editing a generated file directly fails CI.
*Why:* the system breaks down the moment two sources of truth disagree. The spec validator + drift CI gates make divergence impossible to ship silently.

## CSS authoring

**4. Every component is self-contained.** `@layer components.tokens { … } @layer components.styles { … }` + `var(--t-…, fallback)` everywhere + scoped reset for child elements + zero `@import` of other components (except composites, which declare their dependencies in `specs/<name>.yaml`).
*Why:* the acid test is "would this file work if it were the only Teseor file loaded?" If no, the file leaks assumptions.

**5. Logical properties only.** `inline-start`, `block-end`, `padding-inline`, etc. `left`, `right`, `top`, `bottom` are forbidden in component CSS — stylelint catches all four. RTL is one `dir="rtl"` away.
*Why:* mirror-correctness is a CI gate per component (every test runs `dir="ltr"` and `dir="rtl"`).

**6. No `!important` outside `@layer themes` and the documented visibility primitives.** The only `!important` declarations the codebase contains are in `@layer themes` (theme overrides) and on `data-hidden-md` / `data-show-md` utilities (where they're the only way to win against responsive media queries reliably).
*Why:* `!important` is the cascade's escape hatch and gets abused as a shortcut. Restricting it to two named slots makes every other use a code-review red flag.

**7. Specificity cap.** `selector-max-specificity: "0,4,2"`, `selector-max-id: 0`, `max-nesting-depth: 3`. No bare top-level element selectors — element selectors may appear only as descendants of a class (e.g. `.t-button svg`) or inside `@layer reset`. Stylelint enforces. Variants are `data-*` attributes (`data-variant="solid"`), wrapped in `:where(...)` to keep selector specificity at 0,1,0 so themes can override without `!important`. Disabled state pairs native and ARIA: `:is([disabled], [aria-disabled="true"])`.
*Why:* low specificity is how `@layer` overrides stay clean. Attribute-based variants (not BEM modifier classes) keep the class API flat — `.t-button` is the only class you write; `data-variant`, `data-intent`, `data-size` carry the modifiers.

**8. `:focus-visible`, never `:focus`.** Stylelint forbids the bare `:focus` pseudo-class.
*Why:* `:focus` shows focus rings on mouse clicks. `:focus-visible` only does so for keyboard. Two decades of "remove the ugly outline" CSS happened because people styled `:focus`.

## Code style

**9. Class names are public API.** `.t-button`, `.t-input`, `data-variant`, `data-size`, `--t-button-height` — once published, a breaking rename requires a major version bump.
*Why:* consumers write `.t-button` in their HTML and CSS overrides. A "harmless" rename to `.t-btn` breaks them silently.

**10. Type safe.** No `any`, no `as` casting, no `@ts-ignore`. `strict: true, noUncheckedIndexedAccess, noImplicitOverride, exactOptionalPropertyTypes`. Internal types strictest possible; consumer-facing types lenient (let consumers pass extra props through to the underlying element).
*Why:* every escape hatch becomes a permanent one.

**11. Named exports only. No default exports.** Conventional file naming: `Button.tsx` exports `Button`. No re-export gymnastics in barrel files; consumers import from the package root and codegen wires that up.
*Why:* default exports rename themselves at import sites. Named exports + tooling = rename refactor that actually catches every site.

## Workflow

**12. One concern per PR.** Each PR closes 1–3 issues, has a changeset entry, conventional-commit message, ≤500 LOC excluding generated code, passes all CI gates, squash-merged. Don't refactor while implementing; don't bundle out-of-scope changes.
*Why:* See `process/pr-shape.md` for the long version. Big PRs hide bugs; small PRs let CI gates do their job.

## Behavior rules (not enforced by lint, enforced in review)

These don't fit lint or CI gates cleanly but get cited in code review:

- **No emojis. No AI references.** Commits, issues, PRs, code comments, docs.
- **Existing patterns first.** Before implementing anything, search the codebase for prior art.
- **UI decisions need approval.** Don't autonomously decide what a new component should look like — reference existing components or ask.
