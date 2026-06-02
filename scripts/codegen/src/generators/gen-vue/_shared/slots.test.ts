import { describe, expect, test } from "vitest";
import type { SlotInfo } from "../../../lib/collect-slots.ts";
import type { Spec } from "../../gen-contract.ts";
import { renderBody, renderSlot, renderSlotsType } from "./slots.ts";

function atomicSpec(overrides: Partial<Spec> = {}): Spec {
  return {
    name: "button",
    kind: "atomic",
    props: {},
    tokens: {},
    visualStates: {},
    ...overrides,
  };
}

describe("renderSlotsType", () => {
  test("always includes the `default` slot first", () => {
    const out = renderSlotsType([]);
    expect(out).toBe(["defineSlots<{", "  default?(): VNode[];", "}>();"].join("\n"));
  });

  test("appends one entry per declared slot", () => {
    const slots: SlotInfo[] = [
      { propName: "iconStart", part: "icon", position: "start" },
      { propName: "iconEnd", part: "icon", position: "end" },
    ];
    const out = renderSlotsType(slots);
    expect(out).toContain("  iconStart?(): VNode[];");
    expect(out).toContain("  iconEnd?(): VNode[];");
  });
});

describe("renderSlot", () => {
  test("emits a positioned slot wrapper with data-position", () => {
    const slot: SlotInfo = { propName: "iconStart", part: "icon", position: "start" };
    const out = renderSlot(atomicSpec(), slot);
    expect(out).toContain(
      `<span v-if="$slots.iconStart" data-button-icon="" data-position="start">`,
    );
    expect(out).toContain(`<slot name="iconStart" />`);
  });

  test("omits data-position when no position is set", () => {
    const slot: SlotInfo = { propName: "icon", part: "icon" };
    const out = renderSlot(atomicSpec(), slot);
    expect(out).not.toContain(`data-position`);
  });
});

describe("renderBody", () => {
  test("wraps the default slot in `-label` and appends a spinner when loading", () => {
    const out = renderBody(atomicSpec(), [], true);
    expect(out).toContain(`<span data-button-label=""><slot /></span>`);
    expect(out).toContain(`v-if="loading" data-button-spinner=""`);
  });

  test("emits a bare `<slot />` when there is no loading state", () => {
    const out = renderBody(atomicSpec(), [], false);
    expect(out).toBe("    <slot />");
  });

  test("orders start slots before the default and end slots after", () => {
    const slots: SlotInfo[] = [
      { propName: "iconStart", part: "icon", position: "start" },
      { propName: "iconEnd", part: "icon", position: "end" },
    ];
    const out = renderBody(atomicSpec(), slots, false);
    const startIdx = out.indexOf("iconStart");
    const slotIdx = out.indexOf("<slot />");
    const endIdx = out.indexOf("iconEnd");
    expect(startIdx).toBeLessThan(slotIdx);
    expect(slotIdx).toBeLessThan(endIdx);
  });
});
