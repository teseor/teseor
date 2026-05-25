import { describe, expect, test } from "vitest";
import type { DocsSpec } from "./sections.ts";
import {
  hasFromChildrenPart,
  renderA11y,
  renderConstraints,
  renderNamed,
  renderProps,
  renderStates,
  renderTokens,
} from "./sections.ts";

function atomicSpec(overrides: Partial<DocsSpec> = {}): DocsSpec {
  return {
    name: "widget",
    kind: "atomic",
    props: {},
    tokens: {},
    states: {},
    ...overrides,
  };
}

describe("renderProps", () => {
  test("returns empty string when no props", () => {
    expect(renderProps(atomicSpec())).toBe("");
  });

  test("renders one row per prop with type, default, and description", () => {
    const spec = atomicSpec({
      props: {
        variant: {
          type: "string",
          default: "solid",
          description: "Visual style.",
          __part: "",
        },
      },
    });
    const out = renderProps(spec);
    expect(out).toContain("<h2>Props</h2>");
    expect(out).toContain("<code>variant</code>");
    expect(out).toContain("<code>string</code>");
    expect(out).toContain("<code>solid</code>");
    expect(out).toContain("Visual style.");
  });

  test("expands `pattern: controllable` boolean into a triple", () => {
    const spec = atomicSpec({
      props: {
        open: {
          type: "boolean",
          pattern: "controllable",
          default: false,
          description: "Controlled open state.",
          __part: "",
        },
      },
    });
    const out = renderProps(spec);
    expect(out).toContain("<code>open</code>");
    expect(out).toContain("<code>defaultOpen</code>");
    expect(out).toContain("<code>onOpenChange</code>");
    expect(out).toContain("Fires when the open state changes.");
  });

  test("appends asChild for composite specs with a fromChildren part", () => {
    const spec: DocsSpec = {
      name: "tooltip",
      kind: "composite",
      props: {
        text: { type: "string", description: "", __part: "" },
      },
      tokens: {},
      states: {},
      parts: {
        trigger: { fromChildren: true },
      },
    };
    const out = renderProps(spec);
    expect(out).toContain("<code>asChild</code>");
  });

  test("appends ref for composite specs with a fromChildren part", () => {
    const spec: DocsSpec = {
      name: "tooltip",
      kind: "composite",
      props: {
        text: { type: "string", description: "", __part: "" },
      },
      tokens: {},
      states: {},
      parts: {
        trigger: { fromChildren: true },
      },
    };
    const out = renderProps(spec);
    expect(out).toContain("<code>ref</code>");
    expect(out).toContain("Forwarded ref to the popover content element.");
  });
});

describe("hasFromChildrenPart", () => {
  test("returns false for atomic specs", () => {
    expect(hasFromChildrenPart(atomicSpec())).toBe(false);
  });

  test("returns true when any part has fromChildren", () => {
    const spec: DocsSpec = {
      name: "x",
      kind: "composite",
      props: {},
      tokens: {},
      states: {},
      parts: { trigger: { fromChildren: true } },
    };
    expect(hasFromChildrenPart(spec)).toBe(true);
  });

  test("returns false when no part has fromChildren", () => {
    const spec: DocsSpec = {
      name: "x",
      kind: "composite",
      props: {},
      tokens: {},
      states: {},
      parts: { content: { element: "div" } },
    };
    expect(hasFromChildrenPart(spec)).toBe(false);
  });

  test("recurses into nested parts", () => {
    const spec: DocsSpec = {
      name: "x",
      kind: "composite",
      props: {},
      tokens: {},
      states: {},
      parts: {
        outer: { parts: { inner: { fromChildren: true } } },
      },
    };
    expect(hasFromChildrenPart(spec)).toBe(true);
  });
});

describe("renderNamed", () => {
  test("returns empty string when entries are missing or empty", () => {
    expect(renderNamed("Variants", undefined)).toBe("");
    expect(renderNamed("Variants", {})).toBe("");
  });

  test("renders one row per entry", () => {
    const out = renderNamed("Variants", { solid: { description: "Filled." } });
    expect(out).toContain("<h2>Variants</h2>");
    expect(out).toContain("<code>solid</code>");
    expect(out).toContain("Filled.");
  });
});

describe("renderStates", () => {
  test("returns empty string when no states", () => {
    expect(renderStates(atomicSpec())).toBe("");
  });

  test("renders one row per state", () => {
    const spec = atomicSpec({
      states: { hover: { description: "Pointer over.", __part: "" } },
    });
    const out = renderStates(spec);
    expect(out).toContain("<h2>States</h2>");
    expect(out).toContain("<code>hover</code>");
    expect(out).toContain("Pointer over.");
  });
});

describe("renderTokens", () => {
  test("returns empty string when no tokens", () => {
    expect(renderTokens(atomicSpec())).toBe("");
  });

  test("renders the `--t-<spec>-<token>` name with fallback", () => {
    const spec = atomicSpec({
      tokens: { bg: { fallback: "blue", desc: "Background.", __part: "" } },
    });
    const out = renderTokens(spec);
    expect(out).toContain("<code>--t-widget-bg</code>");
    expect(out).toContain("<code>blue</code>");
    expect(out).toContain("Background.");
  });
});

describe("renderA11y", () => {
  test("returns empty string when no role and no keyboard", () => {
    expect(renderA11y(atomicSpec())).toBe("");
  });

  test("renders the role when present", () => {
    const spec = atomicSpec({ a11y: { role: "button" } });
    const out = renderA11y(spec);
    expect(out).toContain("Role: <code>button</code>");
  });

  test("renders declared keyboard rows", () => {
    const spec = atomicSpec({ a11y: { keyboard: { Enter: "Activates." } } });
    const out = renderA11y(spec);
    expect(out).toContain("<code>Enter</code>");
    expect(out).toContain("Activates.");
  });

  test("injects universal overlay rows for specs with an overlay block", () => {
    const spec: DocsSpec = {
      name: "popover",
      kind: "composite",
      props: {},
      tokens: {},
      states: {},
      overlay: {
        anchor: "trigger",
        floating: "content",
        mode: "manual",
        anchorVar: "--t-popover-anchor",
        modal: false,
      },
    };
    const out = renderA11y(spec);
    expect(out).toContain("<code>Escape</code>");
    expect(out).toContain("<code>Outside pointer-down</code>");
  });

  test("spec-declared keyboard wins on key collision with overlay rows", () => {
    const spec: DocsSpec = {
      name: "popover",
      kind: "composite",
      props: {},
      tokens: {},
      states: {},
      overlay: {
        anchor: "trigger",
        floating: "content",
        mode: "manual",
        anchorVar: "--t-popover-anchor",
        modal: false,
      },
      a11y: { keyboard: { Escape: "Custom escape wording." } },
    };
    const out = renderA11y(spec);
    expect(out).toContain("Custom escape wording.");
    expect(out).not.toContain("Topmost-wins when multiple overlays are open.");
    expect(out).toContain("<code>Outside pointer-down</code>");
  });
});

describe("renderConstraints", () => {
  test("returns empty string when no constraints", () => {
    expect(renderConstraints(atomicSpec())).toBe("");
  });

  test("renders one list item per constraint with a reason", () => {
    const spec = atomicSpec({
      constraints: [
        { when: { a: 1 }, forbid: { b: 2 }, reason: "Because." },
        { when: { a: 1 }, forbid: { b: 2 }, reason: "Reason two." },
      ],
    });
    const out = renderConstraints(spec);
    expect(out).toContain("<h2>Constraints</h2>");
    expect(out).toContain("<li>Because.</li>");
    expect(out).toContain("<li>Reason two.</li>");
  });
});
