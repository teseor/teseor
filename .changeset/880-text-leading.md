---
"@teseor/css": patch
---

Drop the `text-box-trim` block from `base.css`. The trim was meant to make `padding-block` produce the visually-expected gap, but it shrinks bare `<p>` and `<li>` to the font's ascent/descent extent (18px on system-ui at the base font size) instead of the rounded leading (24px). Without trim these elements land on the `--t-unit` grid again, restoring the rhythm contract surfaced by the docs grid-rhythm audit.
