---
"@teseor/css": patch
---

`postcss-teseor-floor` now pairs the synthesized `@media (forced-colors: active)` block with `forced-color-adjust: none`. Without it, browsers overlay their native-control rendering on top of our explicit system-color mapping for form elements (e.g. `<button>` ended up with a `ButtonFace` interior obscuring the label). The two are emitted as a unit since they only make sense together — the token mapping authorises the opt-out.
