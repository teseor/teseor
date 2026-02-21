# Token Patterns

## Three layers

Every `--_` internal var in `@layer components.tokens` follows one of these patterns:

### 1. Component token (public API) — three-tier

```scss
// @desc Overall height
--_height: var(--ui-button-height, var(--ui-row-2, #{t.$row-2}));
//  ^private   ^PUBLIC TOKEN       ^global fallback  ^SCSS fallback
```

- `--_height` — internal, used in `@layer components.styles`
- `--ui-button-height` — public API, users customize this
- `--ui-row-2` — global design token fallback
- `#{t.$row-2}` — SCSS variable, provides the actual CSS value

`@desc` is required. It documents the public `--ui-*` token. Appears in api.json.

### 2. Global alias — two-tier

```scss
--_ease-default: var(--ui-ease-default, #{t.$ease-default});
//  ^private       ^global token         ^SCSS fallback
```

Shortcut to bring a global token into component scope. No `@desc` needed — the name IS the documentation. Does NOT appear in api.json as a component token.

### 3. Derived value — internal only

```scss
--_bg: var(--_accent);
--_bg-hover: color-mix(in oklch, var(--_accent) 80%, black);
--_circumference: 282.743;
```

Computed from other internal vars or constants. No public token, no `@desc`. Does NOT appear in api.json.

## Scoping rules

### Token scope

Every `--ui-*` token in a component MUST be either:
- Scoped to the current component: `--ui-{componentName}-*`
- A known global token: `--ui-space-*`, `--ui-color-*`, `--ui-font-size-*`, etc.

```scss
// @component badge

// Correct
--_font-size: var(--ui-badge-font-size, var(--ui-font-size-xs, #{t.$font-size-xs}));

// Wrong — different component scope
--_font-size: var(--ui-avatar-font-size, var(--ui-font-size-xs, #{t.$font-size-xs}));

// Wrong — missing component name
--_font-size: var(--ui--font-size, var(--ui-font-size-xs, #{t.$font-size-xs}));
```

### Three-tier completeness

Component tokens must provide all three fallback tiers:

```scss
// Correct — all three tiers
--_height: var(--ui-button-height, var(--ui-row-2, #{t.$row-2}));

// Wrong — missing SCSS fallback
--_height: var(--ui-button-height, var(--ui-row-2));

// Wrong — missing global fallback tier
--_height: var(--ui-button-height, #{t.$row-2});
```

## Enforced by

These rules are enforced by `packages/docgen/src/scss-linter.ts` via the `annotation-completeness` lint.

| Rule | What it checks |
|------|---------------|
| `requireComponentAnnotation` | `// @component <name>` exists |
| `requireElementAnnotation` | `// @element <tag>` exists |
| `requireDescOnVars` | `// @desc` on lines with `--ui-{component}-*` tokens |
| `requireTokenScope` | `--ui-*` tokens scoped to current component or global |
| `requireModifierAnnotations` | `// @modifier` before BEM modifier groups |

## Data flow

```
SCSS (source of truth)
  | @component, @element, @modifier, @desc annotations
  v
api.json (auto-generated: pnpm generate:api)
  | public --ui-* tokens, modifiers, defaults
  v
content.yml (auto-scaffolded: pnpm generate:content)
  | enrichable descriptions, section layout, examples
  v
docs (consumer)
```

Changes to SCSS trigger regeneration of api.json and content.yml via CI lint checks.
