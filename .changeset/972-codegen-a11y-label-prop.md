---
"@teseor/react": patch
"@teseor/vue": patch
---

Add `a11y.labelProp` substrate for decorative-by-default atomic specs. Names a `type: string`, non-responsive prop whose presence flips the root from decorative (`aria-hidden="true"`, role overridden to `"none"`) to meaningful (`aria-label={prop}`, declared role intact). Mirror of `decorativeProp` but inverted — opt-in to meaningful instead of opt-in to decorative. Mutually exclusive with `decorativeProp`. No diff for existing specs; unblocks Dot (#950) and Icon (#952).
