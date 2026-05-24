import { describe, expect, it } from "vitest";
import type { SpecPart } from "../schema.ts";
import { type CompositeShapeOptions, extractCompositeShape } from "./composite-shape.ts";
import type { FlatSpec } from "./flatten.ts";

const REACT_OPTS: CompositeShapeOptions = {
  emitterLabel: "this generator only emits the overlay-with-anchor shape",
  separateMissingPartErrors: true,
  forbidContentFromChildren: true,
};

const VUE_OPTS: CompositeShapeOptions = {
  emitterLabel: "Vue composite emitter only supports the overlay-with-anchor shape",
  separateMissingPartErrors: false,
  forbidContentFromChildren: false,
};

function makeCompositeSpec(parts: Record<string, SpecPart>, overlayPresent = true): FlatSpec {
  return {
    name: "tooltip",
    kind: "composite",
    overlay: overlayPresent
      ? {
          anchor: "trigger",
          floating: "content",
          mode: "auto",
          anchorVar: "--tooltip-anchor",
          modal: false,
        }
      : undefined,
    parts,
    props: {},
    tokens: {},
    states: {},
  };
}

describe("extractCompositeShape", () => {
  it("returns the shape for a valid spec", () => {
    const spec = makeCompositeSpec({
      trigger: { fromChildren: true },
      content: { element: "div", rootClass: "my-content", a11y: { role: "tooltip" } },
    });
    const shape = extractCompositeShape(spec, REACT_OPTS);
    expect(shape.overlaySpec).toEqual({
      anchor: "trigger",
      floating: "content",
      mode: "auto",
      anchorVar: "--tooltip-anchor",
      modal: false,
    });
    expect(shape.triggerClass).toBe("t-tooltip-trigger");
    expect(shape.contentClass).toBe("my-content");
    expect(shape.contentElement).toBe("div");
    expect(shape.contentRole).toBe("tooltip");
  });

  it("defaults contentClass to t-<name> and contentElement to div", () => {
    const spec = makeCompositeSpec({
      trigger: { fromChildren: true },
      content: {},
    });
    const shape = extractCompositeShape(spec, REACT_OPTS);
    expect(shape.contentClass).toBe("t-tooltip");
    expect(shape.contentElement).toBe("div");
    expect(shape.contentRole).toBeUndefined();
  });

  it("throws when spec.overlay is absent", () => {
    const spec = makeCompositeSpec(
      {
        trigger: { fromChildren: true },
        content: {},
      },
      false,
    );
    expect(() => extractCompositeShape(spec, REACT_OPTS)).toThrow(
      "composite spec 'tooltip' must declare 'overlay:' for the overlay-with-anchor shape",
    );
  });

  it("throws separate errors for missing anchor/floating in React mode", () => {
    const noAnchor = makeCompositeSpec({ content: {} });
    expect(() => extractCompositeShape(noAnchor, REACT_OPTS)).toThrow(
      "overlay.anchor 'trigger' is not a declared part",
    );
    const noFloating = makeCompositeSpec({ trigger: { fromChildren: true } });
    expect(() => extractCompositeShape(noFloating, REACT_OPTS)).toThrow(
      "overlay.floating 'content' is not a declared part",
    );
  });

  it("throws a combined error for missing parts in Vue mode", () => {
    const spec = makeCompositeSpec({ content: {} });
    expect(() => extractCompositeShape(spec, VUE_OPTS)).toThrow(
      "overlay.anchor 'trigger' or overlay.floating 'content' is not a declared part",
    );
  });

  it("throws when anchor does not declare fromChildren: true", () => {
    const spec = makeCompositeSpec({
      trigger: {},
      content: {},
    });
    expect(() => extractCompositeShape(spec, REACT_OPTS)).toThrow(
      "overlay.anchor 'trigger' must declare 'fromChildren: true' (this generator only emits the overlay-with-anchor shape)",
    );
  });

  it("uses the Vue emitterLabel in the anchor-fromChildren error", () => {
    const spec = makeCompositeSpec({
      trigger: {},
      content: {},
    });
    expect(() => extractCompositeShape(spec, VUE_OPTS)).toThrow(
      "overlay.anchor 'trigger' must declare 'fromChildren: true' (Vue composite emitter only supports the overlay-with-anchor shape)",
    );
  });

  it("throws when content declares fromChildren and React mode forbids it", () => {
    const spec = makeCompositeSpec({
      trigger: { fromChildren: true },
      content: { fromChildren: true },
    });
    expect(() => extractCompositeShape(spec, REACT_OPTS)).toThrow(
      "overlay.floating 'content' cannot declare 'fromChildren: true'",
    );
  });

  it("does NOT throw when content declares fromChildren in Vue mode", () => {
    const spec = makeCompositeSpec({
      trigger: { fromChildren: true },
      content: { fromChildren: true },
    });
    expect(() => extractCompositeShape(spec, VUE_OPTS)).not.toThrow();
  });
});
