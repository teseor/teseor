// Validator-side view of the React-event vocabulary. The source of truth
// is the runtime hook's handler map in
// `packages/react/src/hooks/_react-events.ts`; adding an event there
// makes it valid at spec time automatically — no drift possible.

export { REACT_EVENT_VOCABULARY } from "../../../../packages/react/src/hooks/_react-events.ts";
