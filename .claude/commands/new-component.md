Scaffold a new component spec + CSS file + placeholder tests. Argument: the component name (PascalCase).

## Workflow

1. Read `docs/rules/component-shape.md` and `specs/_vocabulary.yaml` live —
   never rely on a remembered template.
2. Ask the user: `kind: atomic | composite`, plus any other contextual
   choices the component requires (initial variants, intents, etc.).
3. Confirm the slugged name (kebab-case) is in the canonical vocabulary
   (`specs/_vocabulary.yaml` `components:` list). If not, ask the user
   whether to add it to vocabulary first — do not silently mint a new name.
4. Create files:
   - `specs/<name>.yaml` — required fields per `component-shape.md`,
     canonical vocabulary applied
   - `packages/css/src/components/<name>/<name>.css` — skeleton with both
     `@layer components.tokens` and `@layer components.styles` sublayers,
     scoped reset for child elements, third-tier fallback chain on every
     `var(--t-*)` reference
   - Placeholder Vitest unit test + Playwright visual test under
     `tests/<name>/` so the test runners pick the component up later
5. Do NOT run codegen — that is a separate maintainer action (`pnpm gen`)
   once the spec + CSS are reviewed.
6. Surface the created files to the user.

## Failure modes

- **Name not in `specs/_vocabulary.yaml`**: stop and confirm with the user
  whether to extend vocabulary first.
- **`packages/css/src/components/<name>/` already exists**: stop. Surface
  the existing files; do not overwrite. The user can rename or pick a
  different name.
- **`component-shape.md` references a field the spec validator doesn't
  recognise yet**: surface the gap; do not invent fields.
- **CSS skeleton references a token that does not exist in `tokens.css`**:
  the `build:css` gate will reject. Either reuse an existing token or
  propose adding one in a separate PR.
