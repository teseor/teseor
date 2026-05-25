---
"@teseor/react": minor
"@teseor/vue": minor
"@teseor/contract": minor
"@teseor/css": minor
---

Add `Code` (inline) and `Codeblock` (block) atomic components. Code renders a single `<code>` element for short spans in prose. Codeblock renders `<pre><code>...</code></pre>` with monospace font, padding, and `overflow-x: auto` for multi-line code. Both ship CSS-only with the `--t-font-mono` token and per-component overrides via `--t-code-*` / `--t-codeblock-*`. Syntax highlighting is consumer-driven — children accept any node, so pre-highlighted JSX from Shiki / Prism / etc. drops in directly.

The atomic spec format gains an optional `slotElement` field: when set, the generator wraps slot content in a nested element (used by Codeblock to emit `<pre><code>` from a single atomic spec). Atomic specs without `slotElement` are unchanged.
