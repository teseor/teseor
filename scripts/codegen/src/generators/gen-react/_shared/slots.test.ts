import { describe, expect, test } from "vitest";
import type { SlotInfo } from "../../../lib/collect-slots.ts";
import type { Spec } from "../../gen-contract.ts";
import { renderBody, renderSlot } from "./slots.ts";

function atomicSpec(overrides: Partial<Spec> = {}): Spec {
  return {
    name: "button",
    kind: "atomic",
    props: {},
    tokens: {},
    states: {},
    ...overrides,
  };
}

describe("renderSlot", () => {
  test("emits a positioned slot wrapper with data-position", () => {
    const slot: SlotInfo = { propName: "iconStart", part: "icon", position: "start" };
    const out = renderSlot(atomicSpec(), slot);
    expect(out).toContain(`{iconStart != null ? (`);
    expect(out).toContain(`<span data-button-icon="" data-position="start">`);
    expect(out).toContain("{iconStart}");
  });

  test("omits data-position when no position is set", () => {
    const slot: SlotInfo = { propName: "icon", part: "icon" };
    const out = renderSlot(atomicSpec(), slot);
    expect(out).not.toContain("data-position");
  });
});

describe("renderBody", () => {
  test("wraps `{children}` in `-label` and appends a spinner when loading", () => {
    const out = renderBody(atomicSpec(), [], true);
    expect(out).toContain(`<span data-button-label="">{children}</span>`);
    expect(out).toContain(`{loading ? <span data-button-spinner=""`);
  });

  test("emits a bare `{children}` line when there is no loading state", () => {
    const out = renderBody(atomicSpec(), [], false);
    expect(out).toBe("      {children}");
  });

  test("orders start slots before {children} and end slots after", () => {
    const slots: SlotInfo[] = [
      { propName: "iconStart", part: "icon", position: "start" },
      { propName: "iconEnd", part: "icon", position: "end" },
    ];
    const out = renderBody(atomicSpec(), slots, false);
    const startIdx = out.indexOf("iconStart");
    const childrenIdx = out.indexOf("{children}");
    const endIdx = out.indexOf("iconEnd");
    expect(startIdx).toBeLessThan(childrenIdx);
    expect(childrenIdx).toBeLessThan(endIdx);
  });
});
