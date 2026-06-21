---
"@teseor/css": patch
---

Collapse Button per-intent slot pairs to a single `--_accent` per intent with foreground derived inline via the RFC-0004 phase-4 OKLCH threshold formula. Output colors are identical; intent slot count drops from 12 to 6; adding a new intent now costs one slot declaration and one selector line. Bundle drops 8.92→7.36 KB raw (1.83→1.69 KB gz).
