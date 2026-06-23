import { describe, expect, it } from "vitest";
import { APPEND_SLOTS, DECORATE_SLOTS, EXCLUSIVE_SLOTS, slotKind } from "./slots.ts";

describe("slot enumeration", () => {
  it("has no overlap between kinds", () => {
    const all = [...APPEND_SLOTS, ...EXCLUSIVE_SLOTS, ...DECORATE_SLOTS];
    expect(new Set(all).size).toBe(all.length);
  });
  it("classifies each slot correctly", () => {
    for (const s of APPEND_SLOTS) expect(slotKind(s)).toBe("append");
    for (const s of EXCLUSIVE_SLOTS) expect(slotKind(s)).toBe("exclusive");
    for (const s of DECORATE_SLOTS) expect(slotKind(s)).toBe("decorate");
  });
});
