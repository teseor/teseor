// Spec-time vocabulary for `interactions[].on.event` against React-handler-
// bound targets (today: `target: "trigger"`). The runtime mapping that turns
// these names into React handler props (`pointerenter` → `onPointerEnter`,
// etc.) lives in `packages/react/src/hooks/useOverlay.ts` as
// `EVENT_TO_HANDLER`. This file holds just the keys — the validator only
// needs to assert "the name is known", not to construct handlers.
//
// Drift between this file and `useOverlay.ts` is caught by
// `scripts/lint/cross-file/react-event-vocabulary-sync.ts`. Add an event
// here AND in the runtime map (or remove from both); the lint will not let
// one side drift.
//
// `document` and `window` targets accept any event name and are not bound
// to React's synthetic-event vocabulary — they use native `addEventListener`
// and bypass this check.

export const REACT_EVENT_VOCABULARY = [
  "click",
  "focusin",
  "focusout",
  "keydown",
  "keyup",
  "pointerdown",
  "pointerenter",
  "pointerleave",
  "pointerup",
] as const;

export type ReactEventName = (typeof REACT_EVENT_VOCABULARY)[number];
