import type { FlatSpec } from "./flatten.ts";

/**
 * A spec prop that renders into a named slot position.
 */
export type SlotInfo = { propName: string; part: string; position?: "start" | "end" };

/**
 * Parse a slot prop name. Conventionally `<part>Start` and `<part>End` for
 * positional slots; bare prop name otherwise.
 */
export function parseSlot(propName: string): SlotInfo {
  if (propName.endsWith("Start")) {
    return { propName, part: propName.slice(0, -"Start".length).toLowerCase(), position: "start" };
  }
  if (propName.endsWith("End")) {
    return { propName, part: propName.slice(0, -"End".length).toLowerCase(), position: "end" };
  }
  return { propName, part: propName.toLowerCase() };
}

/**
 * Walk a spec's props and collect every prop marked as a slot.
 */
export function collectSlots(spec: FlatSpec): SlotInfo[] {
  const slots: SlotInfo[] = [];
  for (const [propName, propDef] of Object.entries(spec.props)) {
    if (propDef.slot === true) slots.push(parseSlot(propName));
  }
  return slots;
}
