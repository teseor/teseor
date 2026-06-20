import { describe, expect, it } from "vitest";
import { collectSlots, parseSlot } from "./collect-slots.ts";
import type { FlatProp, FlatSpec } from "./flatten.ts";

describe("parseSlot", () => {
  it("parses `<part>Start` as a start-positioned slot", () => {
    expect(parseSlot("iconStart")).toEqual({
      propName: "iconStart",
      part: "icon",
      position: "start",
    });
  });

  it("parses `<part>End` as an end-positioned slot", () => {
    expect(parseSlot("iconEnd")).toEqual({
      propName: "iconEnd",
      part: "icon",
      position: "end",
    });
  });

  it("parses a bare slot name with no position", () => {
    expect(parseSlot("text")).toEqual({
      propName: "text",
      part: "text",
    });
  });
});

function makeSpec(props: Record<string, FlatProp>): FlatSpec {
  return {
    name: "demo",
    kind: "atomic",
    element: "div",
    props,
    tokens: {},
    visualStates: {},
  };
}

const slotProp: FlatProp = { type: "string", description: "", slot: true, __part: "" };
const plainProp: FlatProp = { type: "string", description: "", __part: "" };
const boolProp: FlatProp = { type: "boolean", description: "", __part: "" };

describe("collectSlots", () => {
  it("returns only props marked as slots", () => {
    const spec = makeSpec({
      iconStart: slotProp,
      iconEnd: slotProp,
      label: plainProp,
    });
    expect(collectSlots(spec)).toEqual([
      { propName: "iconStart", part: "icon", position: "start" },
      { propName: "iconEnd", part: "icon", position: "end" },
    ]);
  });

  it("returns an empty array when no props are slots", () => {
    const spec = makeSpec({
      label: plainProp,
      disabled: boolProp,
    });
    expect(collectSlots(spec)).toEqual([]);
  });

  it("returns an empty array when the spec has no props", () => {
    const spec = makeSpec({});
    expect(collectSlots(spec)).toEqual([]);
  });
});
