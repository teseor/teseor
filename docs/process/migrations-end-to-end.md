# Migrations end-to-end

A worked example of a breaking change, from the spec edit to the consumer
upgrade command. Reference for anyone authoring a rename, removing a prop,
or changing a default that consumers depend on.

Worked rename: **`.t-btn` → `.t-button`**. The class is API; renaming it is
a major bump. The same shape applies to token renames, prop renames, and
removed variants.

## 0. Decide whether to do it at all

Class names land in consumer markup. Tokens land in consumer themes and
overrides. Props land in consumer code. Every breaking rename is a tax on
every consumer that's adopted that surface. The bar is:

- The current name is actively wrong (typo, ambiguous, conflicts with a
  reserved keyword in a target framework).
- The current name blocks a future addition (no room to expand without
  ambiguity).
- A migration costs the consumer less than living with the wrong name
  forever.

If the rename is purely aesthetic ("`.t-btn` feels short to me"), close the
issue. Breaking changes accumulate frustration consumers don't see in the
PR — they hit it later, when they try to upgrade.

## 1. Edit the spec

The spec is the source of truth. Change it first.

```yaml
# specs/button.yaml
name: button
rootClass: t-button        # was: t-btn
file: components/button/button.css
```

`validate-spec.ts` runs on every save (via lefthook and the lint CI gate).
It compares `rootClass` against the class actually declared in
`packages/css/src/components/button/button.css`. Spec and CSS are out of
sync until step 2.

## 2. Run the schema migrator

For trivial renames the spec edit + a search-replace in the component CSS
is enough. For non-trivial schema shifts (a prop changes shape, a variant
splits into two) the repo ships `scripts/repo/migrate-specs.ts` as a
registry-driven runner: a migrator is a `{ id, description, run }` object
registered via `registerMigrator()`. The migrator that implements the
breaking change lands in the same PR — usually as a new `migrations/<id>.ts`
that imports `migrate-specs.ts` and calls `registerMigrator(...)`. The
runner's `REGISTRY` is currently empty until a real migration drives
the first entry; the CLI surface and `--from/--to/--rule` argument shape
are stable.

For the class rename, the migrator step is two commands:

```bash
# Rename the class in the component CSS file
pnpm migrate:specs --rule class-rename --from t-btn --to t-button

# Verify spec + CSS now agree
pnpm lint
```

The migrator updates `packages/css/src/components/button/button.css` and
any sibling files that referenced `t-btn` (sub-elements like
`.t-btn__icon` get the same suffix substitution). It leaves consumer-facing
files (showcase apps, docs site source) untouched — those go through the
codemod path in step 4.

## 3. Regenerate wrappers + contract + docs + tests

```bash
pnpm gen
```

This re-runs every generator listed in `architecture/codegen-pipeline.md`:
React/Vue/Svelte/Angular/webc wrappers, the TypeScript contract, the docs
site's components data, the Playwright scaffolds, and `teseor-ast.json`.
Every file that referenced `t-btn` now references `t-button` because the
spec did.

Commit the regenerated output. `gen-drift` is a CI gate; it runs
`pnpm gen && git diff --exit-code` and fails the PR if the committed
output differs from a fresh regeneration.

## 4. Write the changeset

```bash
pnpm changeset
```

Pick the affected packages (the whole `@teseor/*` fixed group bumps
together — see `process/release.md`). Pick **major**. Write the
changeset entry with a `migration:` block:

````md
---
"@teseor/css": major
"@teseor/react": major
"@teseor/vue": major
"@teseor/svelte": major
"@teseor/angular": major
"@teseor/webc": major
migration: |
  ## `.t-btn` → `.t-button`

  The Button root class is renamed for consistency with the spec contract
  (every component's `rootClass` is now `t-<spec-name>`). Search-replace
  in consumer HTML and CSS.

  Codemod available:

  ```bash
  npx @teseor/codemods/<from>-to-<to> --rule=class-rename
  ```

  The codemod rewrites `.t-btn` occurrences in `.html`, `.tsx`, `.jsx`,
  `.vue`, `.svelte`, and `.css` files under the working directory.
---

Renames the Button root class to align with the spec contract.
````

The build step concatenates every breaking changeset's `migration:` block
into one document at `docs/migrations/v<from>-to-v<to>.md` on release. See
`process/versioning.md` § "Migration guides" for the full assembly.

## 5. Author the codemod

The codemod is a separate file under `packages/codemods/`. It ships in the
same PR as the breaking change, so consumers can run it the moment the new
version publishes.

```text
packages/codemods/
├── src/
│   └── <from>-to-<to>/
│       ├── class-rename.ts          # the transform
│       ├── index.ts                 # registers the rule
│       └── README.md                # what rules exist, how to run
└── test/
    └── <from>-to-<to>/
        └── class-rename/
            ├── input.html
            ├── output.html
            ├── input.tsx
            ├── output.tsx
            └── input.css
            └── output.css
```

The transform itself is small — a regex over class attribute values for
HTML/JSX, a regex over class selectors for CSS. Use `jscodeshift` for
JS/TS so AST scoping is right; use the in-house CSS transformer for
`.css` and `.scss`. Both are wired up in `packages/codemods/src/runner.ts`.

### Testing

Two fixtures per file type: one input that should change, one input that
shouldn't (idempotency). The test runner asserts:

```ts
expect(transform(input)).toEqual(output);
expect(transform(output)).toEqual(output);  // idempotent
```

Running the codemod twice is a no-op. This matters because consumers may
run it once, hit an unrelated error, fix the error, and re-run.

## 6. Release notes

`changesets/action` writes the npm release notes from the changeset entries
plus the assembled migration guide. The published notes include:

- The version (`@teseor/*@<to>.0.0`).
- The migration guide URL (`teseor.dev/migrations/v<from>-to-v<to>`).
- The codemod command (`npx @teseor/codemods/<from>-to-<to>`).
- The list of changes at this version.

The release-notes shape isn't hand-authored — it falls out of the
mechanism. See `process/release.md`.

## 7. Consumer upgrades

The consumer-facing flow, from the upgrade prompt to a working app:

```bash
# 1. Update the package versions
pnpm up "@teseor/*"

# 2. Run the codemod against the source tree
npx @teseor/codemods/<from>-to-<to>

# 3. Or scope to a single rule
npx @teseor/codemods/<from>-to-<to> --rule=class-rename
```

The codemod walks the working directory, applies every registered rule for
the `<from>-to-<to>` pair, prints a summary, and exits. Unchanged files
aren't touched. Files with un-rewritable patterns (e.g. dynamically
constructed class names) emit a warning with the file path and line.

## Deprecation window

Removal is preceded by deprecation. The lifecycle is **2 minor releases**
between `deprecated: true` in the spec and the actual removal. Version-
based, not time-based, because release cadence varies and version
arithmetic doesn't. See `process/versioning.md` § "Deprecation lifecycle".

For the class rename:

| Version | State |
| --- | --- |
| current | `.t-btn` is the documented class. |
| current + 1 minor | `.t-button` ships as the new name. `.t-btn` still works (CSS aliases) and is marked `deprecated: true` in the spec. IDE shows the deprecation; docs page shows a banner. |
| current + 2 minors | Reminder warnings; consumer apps that build with strict mode see the deprecation in their lint output. |
| current + 3 minors (= next major) | `.t-btn` is removed. The codemod ships with the major release. |

The migration is *announced* over three minors; the *removal* is a single
major. Consumers who upgrade incrementally never get surprised.

**Fast path.** When a rename can't wait — security fix, blocking bug,
conflict with a new browser feature — the deprecation window can be
collapsed to zero, but the change still rides a major and ships a codemod.
The migration guide explicitly notes "no deprecation cycle" in that case
so consumers know to expect the change in a single jump.

## Testing the codemod against a real project

Beyond the fixture tests inside the repo, run the codemod against a real
consumer-shaped project before publishing.

```bash
# In the design-system repo
pnpm --filter "@teseor/codemods" build

# In a consumer-shaped sandbox
git clone <a-real-app-using-teseor>  ./sandbox
cd sandbox
npx /path/to/teseor/packages/codemods/dist/<from>-to-<to>
git diff   # review the rewrite
pnpm build # confirm the app still builds
```

The sandbox can be one of the showcase apps in the same monorepo — they
consume the design system end-to-end, which is what consumers are doing.
A codemod that breaks a showcase app is shipping broken.

## When a codemod isn't possible

Some breaking changes can't be transformed. They require human judgment.
Examples:

- A component's *behavior* changes even though the API surface looks the
  same. Modal used to focus the first focusable child on open; now it
  focuses the trigger after close. A codemod can't rewrite the user's
  intent.
- A component is split into two. `Dropdown` becomes `Menu` (action picker)
  and `Select` (form control). The right replacement depends on what the
  consumer was using it for.
- A prop's *semantics* shift. `size: lg` used to be a `40px` row; it now
  refers to a token that resolves to `44px`. Some consumers want the
  new value; others were targeting the old one numerically.

The migration guide covers these cases as prose, with concrete examples
of "if your code looks like X, change it to Y." No codemod ships for them.
The migration guide section header is `## <change> (manual)` so consumers
running the codemod know it doesn't cover this case.

## The full PR shape

A breaking-change PR carries:

- Spec edit (1 file).
- Component CSS edit (1 file).
- Regenerated wrappers + contract + docs + tests (many files, but they
  come out of `pnpm gen` — they don't count against the 500-LOC budget;
  see `process/pr-shape.md`).
- A changeset with the `migration:` block.
- A codemod transform + fixtures + README in `packages/codemods/`.
- A changelog entry will fall out of the changeset on release; you don't
  hand-write one.

Closes 1–3 issues — usually one tracking issue for the breaking change
plus the codemod issue if filed separately. Two reviewers minimum
post-v1.0; the maintainer self-merges before that.

## Escape hatch: when none of this fits

If you've hit a case where the spec-driven flow above doesn't apply —
something CSS can't express, a behavior that has to be hand-authored, a
removal with no successor — open an RFC (`process/contribution-paths.md`
§ "RFC"). The RFC documents what doesn't fit and proposes a new shape.
Don't ship the breaking change against the existing process; the
discipline exists so consumers can predict upgrades.

This document is the path the discipline supports. Everything else is an
RFC.
