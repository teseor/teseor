---
"@teseor/react": patch
---

Internal refactor: the React event-to-handler map used by `useOverlay`
moved out of `useOverlay.ts` into a dedicated `hooks/_react-events.ts`
module. The spec validator imports the vocabulary from the same module,
so adding an event is a single edit in one place — no drift possible.
No public API change, no behavior change.
