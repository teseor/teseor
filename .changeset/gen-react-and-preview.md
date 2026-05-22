---
"@teseor/react": minor
"@teseor/contract": minor
"@teseor/css": patch
---

Add the React wrapper generator and the @teseor/react package. The generated Button.tsx renders the t-button class plus data-attributes, supports the value-or-object responsive API for size and block, polymorphic root via as, ReactNode slots for iconStart and iconEnd, native ref-as-prop (React 19), Readonly props, "use client" directive, className merge, and aria-busy on loading. Shared dataAttrs runtime so the helper ships once per bundle, not per component.

Contract gains a slot field on props (emitted as unknown for non-React consumers); rootClass field is now recognized at the spec level.

Button CSS gains the responsive selector set for size and block across md, lg, xl, and 2xl breakpoints.
