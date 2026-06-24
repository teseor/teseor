import { describe, expect, it } from "vitest";
import type { SpecPart } from "../core/schema.ts";
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

function makeCompositeSpec(parts: Record<string, SpecPart>): FlatSpec {
  return {
    name: "tooltip",
    kind: "composite",
    parts,
    props: {},
    tokens: {},
    visualStates: {},
  };
}

const OVERLAY_BLOCK = {
  anchor: "trigger",
  anchorVar: "--tooltip-anchor",
  mode: "auto" as const,
  modal: false,
};

describe("extractCompositeShape", () => {
  it("returns the shape for a valid spec", () => {
    const spec = makeCompositeSpec({
      trigger: { fromChildren: true },
      content: {
        root: { kind: "static", tag: "div" },
        rootClass: "my-content",
        a11y: { role: "tooltip" },
        overlay: OVERLAY_BLOCK,
      },
    });
    const shape = extractCompositeShape(spec, REACT_OPTS);
    expect(shape.overlaySpec).toEqual(OVERLAY_BLOCK);
    expect(shape.contentPartName).toBe("content");
    expect(shape.triggerClass).toBe("t-tooltip-trigger");
    expect(shape.contentClass).toBe("my-content");
    expect(shape.contentElement).toBe("div");
    expect(shape.contentRole).toBe("tooltip");
  });

  it("defaults contentClass to t-<name> and contentElement to div", () => {
    const spec = makeCompositeSpec({
      trigger: { fromChildren: true },
      content: { overlay: OVERLAY_BLOCK },
    });
    const shape = extractCompositeShape(spec, REACT_OPTS);
    expect(shape.contentClass).toBe("t-tooltip");
    expect(shape.contentElement).toBe("div");
    expect(shape.contentRole).toBeUndefined();
  });

  it("throws when no part declares overlay:", () => {
    const spec = makeCompositeSpec({
      trigger: { fromChildren: true },
      content: {},
    });
    expect(() => extractCompositeShape(spec, REACT_OPTS)).toThrow(
      "composite spec 'tooltip' must declare 'overlay:' on a part",
    );
  });

  it("throws when more than one part declares overlay:", () => {
    const spec = makeCompositeSpec({
      trigger: { fromChildren: true, overlay: OVERLAY_BLOCK },
      content: { overlay: OVERLAY_BLOCK },
    });
    expect(() => extractCompositeShape(spec, REACT_OPTS)).toThrow(
      "declares 'overlay:' on more than one part",
    );
  });

  it("throws when the named anchor part is absent", () => {
    const spec = makeCompositeSpec({ content: { overlay: OVERLAY_BLOCK } });
    expect(() => extractCompositeShape(spec, REACT_OPTS)).toThrow(
      "overlay.anchor 'trigger' is not a declared part",
    );
  });

  it("throws when anchor does not declare fromChildren: true", () => {
    const spec = makeCompositeSpec({
      trigger: {},
      content: { overlay: OVERLAY_BLOCK },
    });
    expect(() => extractCompositeShape(spec, REACT_OPTS)).toThrow(
      "overlay.anchor 'trigger' must declare 'fromChildren: true' (this generator only emits the overlay-with-anchor shape)",
    );
  });

  it("uses the Vue emitterLabel in the anchor-fromChildren error", () => {
    const spec = makeCompositeSpec({
      trigger: {},
      content: { overlay: OVERLAY_BLOCK },
    });
    expect(() => extractCompositeShape(spec, VUE_OPTS)).toThrow(
      "overlay.anchor 'trigger' must declare 'fromChildren: true' (Vue composite emitter only supports the overlay-with-anchor shape)",
    );
  });

  it("throws when content declares fromChildren and React mode forbids it", () => {
    const spec = makeCompositeSpec({
      trigger: { fromChildren: true },
      content: { fromChildren: true, overlay: OVERLAY_BLOCK },
    });
    expect(() => extractCompositeShape(spec, REACT_OPTS)).toThrow(
      "the overlay-declaring part 'content' cannot also declare 'fromChildren: true'",
    );
  });

  it("does NOT throw when content declares fromChildren in Vue mode", () => {
    const spec = makeCompositeSpec({
      trigger: { fromChildren: true },
      content: { fromChildren: true, overlay: OVERLAY_BLOCK },
    });
    expect(() => extractCompositeShape(spec, VUE_OPTS)).not.toThrow();
  });
});
