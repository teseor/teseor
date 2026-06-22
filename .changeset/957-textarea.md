---
"@teseor/react": minor
"@teseor/vue": minor
"@teseor/css": minor
"@teseor/contract": minor
---

Add `Textarea` atomic — styled `<textarea>` with token-driven defaults, `outline` / `subtle` / `plain` visual variants, `sm` / `md` / `lg` sizes, and a `resize` prop (`none` / `vertical` / `horizontal` / `both`) that maps to CSS. The `invalid` prop emits `data-invalid="true"` for styling. Second consumer of the `formControl: true` substrate — `name`, `form`, `required`, `readOnly`, `disabled` pass through via native HTML attribute fallthrough.

Codegen substrate fixes folded in:

- **Textarea content-forbidden**: `<textarea>` is not HTML-void, but its value comes from `value` / `defaultValue` props, not children. Codegen now treats it as childless — `children?: never` on the wrapper type, self-closing JSX, no `<slot />` in the Vue template. Lives in `scripts/codegen/src/lib/html-void-elements.ts` as a separate `CHILDLESS_FOR_CODEGEN` set; `isVoidElement` and `HTML_VOID_ELEMENTS` (consumed by semantic checks) stay HTML-void-only.
- **Data-attr emission for non-responsive string-enum props**: a declared prop with `type: string` + `values:` + `responsive: false` now emits `data-{name}={value}` on the root (previously dropped silently). The `as` polymorphic prop, the `elementByProp` controlling prop, ariaProps, and slot props are excluded.
- **Docs Props table includes block-derived props**: `variant`, `intent`, and `size` rows now appear in every component's Props table, with the responsive flag derived from the new `RESPONSIVE_BLOCK_PROPS` shared constant (single source of truth for gen-react / gen-vue / gen-docs).
