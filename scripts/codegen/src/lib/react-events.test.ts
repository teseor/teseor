import { describe, expect, test } from "vitest";
import { REACT_EVENT_VOCABULARY } from "./react-events.ts";

describe("REACT_EVENT_VOCABULARY", () => {
  test("is non-empty", () => {
    expect(REACT_EVENT_VOCABULARY.length).toBeGreaterThan(0);
  });

  test("has no duplicates", () => {
    const set = new Set(REACT_EVENT_VOCABULARY);
    expect(set.size).toBe(REACT_EVENT_VOCABULARY.length);
  });

  test("is sorted alphabetically", () => {
    const sorted = [...REACT_EVENT_VOCABULARY].sort();
    expect(REACT_EVENT_VOCABULARY).toEqual(sorted);
  });

  test("contains the events the validator depends on", () => {
    // Smoke test: the names the validator's failure messages and the existing
    // tooltip spec rely on must be present. Adding events here is fine;
    // removing one is an API break and must come with a vocabulary migration.
    expect(REACT_EVENT_VOCABULARY).toContain("pointerenter");
    expect(REACT_EVENT_VOCABULARY).toContain("pointerleave");
    expect(REACT_EVENT_VOCABULARY).toContain("click");
  });
});
