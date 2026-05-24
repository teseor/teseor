// Single source of truth for the React-event vocabulary that
// `useOverlay` understands on `target: "trigger"` interactions.
//
// `EVENT_TO_HANDLER` maps a spec's event name to the React handler prop
// name the runtime attaches to the trigger element. `focusin` /
// `focusout` are deliberately mapped to React's unified `onFocus` /
// `onBlur` synthetic handlers.
//
// The spec-validator (`scripts/codegen/src/lib/react-events.ts`)
// re-exports `REACT_EVENT_VOCABULARY` from here. Adding an event is one
// edit; the validator picks it up automatically.

export const EVENT_TO_HANDLER: Record<string, string> = {
  pointerenter: "onPointerEnter",
  pointerleave: "onPointerLeave",
  pointerdown: "onPointerDown",
  pointerup: "onPointerUp",
  click: "onClick",
  focusin: "onFocus",
  focusout: "onBlur",
  keydown: "onKeyDown",
  keyup: "onKeyUp",
};

/** Frozen view of the supported event names. Order-agnostic; consumers
 *  compare as sets. */
export const REACT_EVENT_VOCABULARY: readonly string[] = Object.freeze(
  Object.keys(EVENT_TO_HANDLER),
);
