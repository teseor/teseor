import { describe, expect, test } from "vitest";
import type { Spec } from "../../gen-contract.ts";
import { consumerHandlerPropNames, hasEventsBlock, renderEventHandlerBodies } from "./events.ts";

function specWith(events: Spec["events"]): Spec {
  return {
    name: "modal",
    kind: "composite",
    props: {},
    tokens: {},
    visualStates: {},
    events,
  };
}

describe("renderEventHandlerBodies", () => {
  test("returns empty string when the spec declares no events", () => {
    expect(renderEventHandlerBodies(specWith(undefined), [])).toBe("");
  });

  test("emits a handleDismiss useCallback when events.dismiss declares an enum reason", () => {
    const out = renderEventHandlerBodies(
      specWith({
        dismiss: {
          description: "Closed.",
          payload: { reason: { type: "enum", values: ["outside", "escape", "button"] } },
        },
      }),
      [],
    );
    expect(out).toContain("const handleDismiss = useCallback(");
    expect(out).toContain(`(reason: "outside" | "escape" | "button") =>`);
    expect(out).toContain(`onDismiss?.({ reason });`);
    expect(out).toContain(`onEvent?.({ type: "dismiss", reason });`);
  });

  test("throws when events.dismiss is declared but payload.reason is missing", () => {
    expect(() =>
      renderEventHandlerBodies(specWith({ dismiss: { description: "Closed.", payload: {} } }), []),
    ).toThrow(/events\.dismiss must declare a payload field 'reason' of type enum/);
  });

  test("throws when events.dismiss declares payload.reason with a non-enum type", () => {
    expect(() =>
      renderEventHandlerBodies(
        specWith({
          dismiss: { description: "Closed.", payload: { reason: { type: "string" } } },
        }),
        [],
      ),
    ).toThrow(/events\.dismiss must declare a payload field 'reason' of type enum/);
  });
});

describe("hasEventsBlock", () => {
  test("is false when events is undefined", () => {
    expect(hasEventsBlock(specWith(undefined))).toBe(false);
  });

  test("is false when events is empty", () => {
    expect(hasEventsBlock(specWith({}))).toBe(false);
  });

  test("is true when at least one event is declared", () => {
    expect(hasEventsBlock(specWith({ select: { description: "Selected.", payload: {} } }))).toBe(
      true,
    );
  });
});

describe("consumerHandlerPropNames", () => {
  test("maps each declared event to its `on<Pascal>` prop name", () => {
    const spec = specWith({
      select: { description: "Selected.", payload: {} },
      "input-change": { description: "Input changed.", payload: {} },
    });
    expect(consumerHandlerPropNames(spec)).toEqual(["onSelect", "onInputChange"]);
  });

  test("returns an empty array when the spec declares no events", () => {
    expect(consumerHandlerPropNames(specWith(undefined))).toEqual([]);
  });
});
