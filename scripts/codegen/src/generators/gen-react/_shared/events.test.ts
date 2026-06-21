import { describe, expect, test } from "vitest";
import type { Spec } from "../../gen-contract.ts";
import { renderEventHandlerBodies } from "./events.ts";

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
