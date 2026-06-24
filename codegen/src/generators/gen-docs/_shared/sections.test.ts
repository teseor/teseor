import { describe, expect, test } from "vitest";
import type { DocsSpec } from "./sections.ts";
import {
  hasFromChildrenPart,
  renderA11y,
  renderBundleSize,
  renderConstraints,
  renderForcedColors,
  renderFormControlContract,
  renderNamed,
  renderProps,
  renderRepeatingItems,
  renderStateMachineDiagrams,
  renderStates,
  renderTokens,
} from "./sections.ts";

function atomicSpec(overrides: Partial<DocsSpec> = {}): DocsSpec {
  return {
    name: "widget",
    kind: "atomic",
    props: {},
    tokens: {},
    visualStates: {},
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
    expect(out).toContain("<Code>variant</Code>");
    expect(out).toContain("<Code>string</Code>");
    expect(out).toContain("<Code>solid</Code>");
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
    expect(out).toContain("<Code>open</Code>");
    expect(out).toContain("<Code>defaultOpen</Code>");
    expect(out).toContain("<Code>onOpenChange</Code>");
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
      visualStates: {},
      parts: {
        trigger: { fromChildren: true },
      },
    };
    const out = renderProps(spec);
    expect(out).toContain("<Code>asChild</Code>");
  });

  test("appends ref for composite specs with an overlay block", () => {
    const spec: DocsSpec = {
      name: "tooltip",
      kind: "composite",
      props: {
        text: { type: "string", description: "", __part: "" },
      },
      tokens: {},
      visualStates: {},
      parts: {
        trigger: { fromChildren: true },
        content: {
          overlay: {
            anchor: "trigger",
            mode: "manual",
            anchorVar: "--t-tooltip-anchor",
            modal: false,
          },
        },
      },
    };
    const out = renderProps(spec);
    expect(out).toContain("<Code>ref</Code>");
    expect(out).toContain("Forwarded ref to the popover content element.");
    expect(out).toContain("<Code>tooltipRef.value?.contentRef.value</Code>");
  });

  test("ref row interpolates spec.name into the Vue example", () => {
    const spec: DocsSpec = {
      name: "modal",
      kind: "composite",
      props: {
        title: { type: "string", description: "", __part: "" },
      },
      tokens: {},
      visualStates: {},
      parts: {
        trigger: { fromChildren: true },
        content: {
          overlay: {
            anchor: "trigger",
            mode: "manual",
            anchorVar: "--t-modal-anchor",
            modal: true,
          },
        },
      },
    };
    const out = renderProps(spec);
    expect(out).toContain("<Code>modalRef.value?.contentRef.value</Code>");
    expect(out).not.toContain("tooltipRef");
  });

  test("omits ref row when composite has fromChildren but no overlay block", () => {
    const spec: DocsSpec = {
      name: "menu",
      kind: "composite",
      props: {
        label: { type: "string", description: "", __part: "" },
      },
      tokens: {},
      visualStates: {},
      parts: {
        trigger: { fromChildren: true },
      },
    };
    const out = renderProps(spec);
    expect(out).toContain("<Code>asChild</Code>");
    expect(out).not.toContain("<Code>ref</Code>");
    expect(out).not.toContain("Forwarded ref to the popover content element.");
  });

  test("appends asChild for atomic specs with `polymorphic: 'asChild'`", () => {
    const spec: DocsSpec = {
      name: "divider",
      kind: "atomic",
      root: { kind: "static", tag: "div", polymorphic: "asChild" },
      props: {},
      tokens: {},
      visualStates: {},
    };
    const out = renderProps(spec);
    expect(out).toContain("<Code>asChild</Code>");
  });

  test("omits asChild for atomic specs without polymorphic", () => {
    const spec: DocsSpec = {
      name: "divider",
      kind: "atomic",
      root: { kind: "static", tag: "div" },
      props: {},
      tokens: {},
      visualStates: {},
    };
    const out = renderProps(spec);
    expect(out).not.toContain("<Code>asChild</Code>");
  });

  test("appends the tag map to the controlling prop's description for a byProp root", () => {
    const spec: DocsSpec = {
      name: "heading",
      kind: "atomic",
      root: { kind: "byProp", prop: "level", map: { "1": "h1", "2": "h2" } },
      props: {
        level: {
          type: "string",
          values: ["1", "2"],
          description: "Heading level.",
          __part: "",
        },
      },
      tokens: {},
      visualStates: {},
    };
    const out = renderProps(spec);
    expect(out).toContain("Heading level.");
    expect(out).toContain("Renders as");
    expect(out).toContain("<Code>&lt;h1&gt;</Code>");
    expect(out).toContain("<Code>&lt;h2&gt;</Code>");
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
      visualStates: {},
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
      visualStates: {},
      parts: { content: { root: { kind: "static", tag: "div" } } },
    };
    expect(hasFromChildrenPart(spec)).toBe(false);
  });

  test("recurses into nested parts", () => {
    const spec: DocsSpec = {
      name: "x",
      kind: "composite",
      props: {},
      tokens: {},
      visualStates: {},
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
    expect(out).toContain("<Code>solid</Code>");
    expect(out).toContain("Filled.");
  });
});

describe("renderStates", () => {
  test("returns empty string when no states", () => {
    expect(renderStates(atomicSpec())).toBe("");
  });

  test("renders one row per state", () => {
    const spec = atomicSpec({
      visualStates: { hover: { description: "Pointer over.", __part: "" } },
    });
    const out = renderStates(spec);
    expect(out).toContain("<h2>States</h2>");
    expect(out).toContain("<Code>hover</Code>");
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
    expect(out).toContain("<Code>--t-widget-bg</Code>");
    expect(out).toContain("<Code>blue</Code>");
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
    expect(out).toContain("Role: <Code>button</Code>");
  });

  test("renders declared keyboard rows", () => {
    const spec = atomicSpec({ a11y: { keyboard: { Enter: "Activates." } } });
    const out = renderA11y(spec);
    expect(out).toContain("<Code>Enter</Code>");
    expect(out).toContain("Activates.");
  });

  test("injects universal overlay rows for specs with an overlay block", () => {
    const spec: DocsSpec = {
      name: "popover",
      kind: "composite",
      props: {},
      tokens: {},
      visualStates: {},
      parts: {
        content: {
          overlay: {
            anchor: "trigger",
            mode: "manual",
            anchorVar: "--t-popover-anchor",
            modal: false,
          },
        },
      },
    };
    const out = renderA11y(spec);
    expect(out).toContain("<Code>Escape</Code>");
    expect(out).toContain("<Code>Outside pointer-down</Code>");
  });

  test("spec-declared keyboard wins on key collision with overlay rows", () => {
    const spec: DocsSpec = {
      name: "popover",
      kind: "composite",
      props: {},
      tokens: {},
      visualStates: {},
      parts: {
        content: {
          overlay: {
            anchor: "trigger",
            mode: "manual",
            anchorVar: "--t-popover-anchor",
            modal: false,
          },
        },
      },
      a11y: { keyboard: { Escape: "Custom escape wording." } },
    };
    const out = renderA11y(spec);
    expect(out).toContain("Custom escape wording.");
    expect(out).not.toContain("Topmost-wins when multiple overlays are open.");
    expect(out).toContain("<Code>Outside pointer-down</Code>");
  });
});

describe("renderBundleSize", () => {
  test("returns empty string when bundleSizes is unset", () => {
    expect(renderBundleSize(atomicSpec())).toBe("");
  });

  test("renders a one-row table with raw / gzip / brotli columns", () => {
    const spec = atomicSpec({
      name: "button",
      bundleSizes: { raw: 8491, gzip: 1500, brotli: 1350 },
    });
    const out = renderBundleSize(spec);
    expect(out).toContain("<h2>Bundle size</h2>");
    expect(out).toContain("<th>Artifact</th>");
    expect(out).toContain("<th>Raw</th>");
    expect(out).toContain("<th>Gzip</th>");
    expect(out).toContain("<th>Brotli</th>");
    expect(out).toContain("8.29 KB");
    expect(out).toContain("1.46 KB");
    expect(out).toContain("1.32 KB");
    expect(out).toContain("<Code>@teseor/css/components/button.css</Code>");
    expect(out).toContain(
      'href="https://github.com/teseor/teseor/blob/main/packages/css/src/components/button/button.css"',
    );
  });
});

describe("renderForcedColors", () => {
  test("returns empty string when forcedColors is unset", () => {
    expect(renderForcedColors(atomicSpec())).toBe("");
  });

  test("returns empty string when forcedColors is an empty list", () => {
    expect(renderForcedColors(atomicSpec({ forcedColors: [] }))).toBe("");
  });

  test("renders one row per token with default and forced literals", () => {
    const spec = atomicSpec({
      forcedColors: [
        { token: "--t-accent", default: "oklch(65% 0.18 250deg)", forced: "ButtonText" },
        { token: "--t-focus-ring", default: "oklch(65% 0.18 250deg)", forced: "Highlight" },
      ],
    });
    const out = renderForcedColors(spec);
    expect(out).toContain("<h2>Forced colors</h2>");
    expect(out).toContain("<th>Token</th>");
    expect(out).toContain("<th>Default</th>");
    expect(out).toContain("<th>Forced-colors</th>");
    expect(out).toContain("<Code>--t-accent</Code>");
    expect(out).toContain("<Code>ButtonText</Code>");
    expect(out).toContain("<Code>--t-focus-ring</Code>");
    expect(out).toContain("<Code>Highlight</Code>");
  });

  test("renders an intro paragraph explaining the contract", () => {
    const spec = atomicSpec({
      forcedColors: [
        { token: "--t-accent", default: "oklch(65% 0.18 250deg)", forced: "ButtonText" },
      ],
    });
    expect(renderForcedColors(spec)).toContain("Windows High Contrast mode");
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

describe("renderRepeatingItems", () => {
  test("returns empty string when the spec has no repeating parts", () => {
    expect(renderRepeatingItems(atomicSpec())).toBe("");
  });

  test("emits one section per repeating part with the Item type name as the heading", () => {
    const spec: DocsSpec = {
      name: "pagination",
      kind: "composite",
      props: {},
      tokens: {},
      visualStates: {},
      repeating: [
        {
          partName: "page",
          propName: "pages",
          root: { kind: "static", tag: "a" },
          itemProps: {
            label: { type: "string", slot: true, description: "Page label." },
            current: { type: "boolean", description: "Active page." },
          },
        },
      ],
    };
    const out = renderRepeatingItems(spec);
    expect(out).toContain("<h2>PaginationPageItem</h2>");
    expect(out).toContain("<Code>id</Code>");
    expect(out).toContain("<Code>label</Code>");
    expect(out).toContain("<Code>current</Code>");
  });

  test("renderProps appends a row per repeating part", () => {
    const spec: DocsSpec = {
      name: "pagination",
      kind: "composite",
      props: {},
      tokens: {},
      visualStates: {},
      repeating: [
        {
          partName: "page",
          propName: "pages",
          root: { kind: "static", tag: "a" },
          itemProps: { label: { type: "string", slot: true, description: "Label." } },
        },
      ],
    };
    const out = renderProps(spec);
    expect(out).toContain("<Code>pages</Code>");
    expect(out).toContain("ReadonlyArray&lt;PaginationPageItem&gt;");
  });
});

describe("renderStateMachineDiagrams", () => {
  test("returns empty string for atomic specs", () => {
    expect(renderStateMachineDiagrams(atomicSpec())).toBe("");
  });

  test("returns empty string when no part declares `states:`", () => {
    const spec: DocsSpec = {
      name: "stack",
      kind: "composite",
      props: {},
      tokens: {},
      visualStates: {},
      parts: { root: { root: { kind: "static", tag: "div" } } },
    };
    expect(renderStateMachineDiagrams(spec)).toBe("");
  });

  test("emits one transitions table per part with `states:`", () => {
    const spec: DocsSpec = {
      name: "modal",
      kind: "composite",
      props: {},
      tokens: {},
      visualStates: {},
      parts: {
        trigger: { fromChildren: true },
        content: {
          root: { kind: "static", tag: "div" },
          states: {
            closed: { on: { "trigger.click": "open" } },
            open: {
              on: {
                "trigger.click": { to: "closed" },
                "key.escape": { to: "closed" },
              },
            },
          },
        },
      },
    };
    const out = renderStateMachineDiagrams(spec);
    expect(out).toContain("Part: <Code>content</Code>");
    expect(out).toContain("initial: <Code>closed</Code>");
    expect(out).toContain("<th>From</th>");
    expect(out).toContain("<Code>trigger.click</Code>");
    expect(out).toContain("<Code>key.escape</Code>");
    // 3 transitions + 1 header row.
    expect((out.match(/<tr>/g) ?? []).length).toBe(4);
  });

  test("annotates transitions with `after` and `when` modifiers", () => {
    const spec: DocsSpec = {
      name: "tooltip",
      kind: "composite",
      props: {},
      tokens: {},
      visualStates: {},
      parts: {
        trigger: {
          fromChildren: true,
          props: {
            disabled: { type: "boolean", description: "Suppress." },
          },
        },
        content: {
          root: { kind: "static", tag: "div" },
          states: {
            closed: {
              on: {
                "trigger.pointerenter": {
                  to: "open",
                  after: "openDelay",
                  when: "!trigger.disabled",
                },
              },
            },
            open: { on: {} },
          },
        },
      },
    };
    const out = renderStateMachineDiagrams(spec);
    expect(out).toContain("after <Code>openDelay</Code>");
    expect(out).toContain("when <Code>!trigger.disabled</Code>");
  });

  test("walks nested parts", () => {
    const spec: DocsSpec = {
      name: "outer",
      kind: "composite",
      props: {},
      tokens: {},
      visualStates: {},
      parts: {
        root: {
          root: { kind: "static", tag: "div" },
          parts: {
            inner: {
              root: { kind: "static", tag: "div" },
              states: {
                closed: { on: { "root.click": "open" } },
                open: { on: { "root.click": "closed" } },
              },
            },
          },
        },
      },
    };
    const out = renderStateMachineDiagrams(spec);
    expect(out).toContain("Part: <Code>inner</Code>");
  });
});

describe("renderFormControlContract", () => {
  const contract = {
    elements: ["input", "textarea", "select"],
    props: {
      name: { type: "string" as const, description: "HTML form field name." },
      required: { type: "boolean" as const, description: "Required for submission." },
    },
  };

  test("returns empty string when the spec is not a form-control", () => {
    const spec = atomicSpec({ formControlContract: contract });
    expect(renderFormControlContract(spec)).toBe("");
  });

  test("returns empty string when the contract is missing", () => {
    const spec = atomicSpec({ formControl: true });
    expect(renderFormControlContract(spec)).toBe("");
  });

  test("renders one row per shared contract prop on a form-control spec", () => {
    const spec = atomicSpec({ formControl: true, formControlContract: contract });
    const out = renderFormControlContract(spec);
    expect(out).toContain("<h2>Form-control attributes</h2>");
    expect(out).toContain("<Code>name</Code>");
    expect(out).toContain("HTML form field name.");
    expect(out).toContain("<Code>required</Code>");
    expect(out).toContain("Required for submission.");
  });

  test("returns empty string for a composite spec even when formControl is set", () => {
    const compositeSpec = {
      ...atomicSpec(),
      kind: "composite" as const,
      formControl: true,
      formControlContract: contract,
    };
    expect(renderFormControlContract(compositeSpec as DocsSpec)).toBe("");
  });
});
