import { describe, expect, test } from "vitest";
import { EVENT_TO_HANDLER, REACT_EVENT_VOCABULARY } from "./_react-events.ts";

describe("EVENT_TO_HANDLER", () => {
  test("is non-empty", () => {
    expect(Object.keys(EVENT_TO_HANDLER).length).toBeGreaterThan(0);
  });

  test("maps focusin / focusout to React's unified handlers", () => {
    // React intentionally collapses native focusin/focusout to onFocus/onBlur.
    // Lock the mapping so a future edit doesn't silently regress it.
    expect(EVENT_TO_HANDLER.focusin).toBe("onFocus");
    expect(EVENT_TO_HANDLER.focusout).toBe("onBlur");
  });

  test("values are React handler prop names (`on<Capitalized>`)", () => {
    for (const handler of Object.values(EVENT_TO_HANDLER)) {
      expect(handler).toMatch(/^on[A-Z][a-zA-Z]*$/);
    }
  });
});

describe("REACT_EVENT_VOCABULARY", () => {
  test("is the key set of EVENT_TO_HANDLER", () => {
    expect([...REACT_EVENT_VOCABULARY].sort()).toEqual(Object.keys(EVENT_TO_HANDLER).sort());
  });

  test("has no duplicates", () => {
    expect(new Set(REACT_EVENT_VOCABULARY).size).toBe(REACT_EVENT_VOCABULARY.length);
  });
});
