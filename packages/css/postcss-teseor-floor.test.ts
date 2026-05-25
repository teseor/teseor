import postcss from "postcss";
import { describe, expect, test } from "vitest";
import { buildForcedColorsTokenMap, buildTokenMap, teseorFloor } from "./postcss-teseor-floor.ts";

const tokens = new Map([
  ["--t-accent", "oklch(65% 0.18 250deg)"],
  ["--t-space-2", "0.5rem"],
]);

const forcedColorsTokens = new Map([
  ["--t-accent", "ButtonText"],
  ["--t-space-2", "0.5rem"],
]);

function floor(css: string): string {
  return postcss([teseorFloor({ tokens })]).process(css, { from: undefined }).css;
}

function floorWithFC(css: string): string {
  return postcss([teseorFloor({ tokens, forcedColorsTokens })]).process(css, {
    from: undefined,
  }).css;
}

describe("buildTokenMap", () => {
  const tokensCss = `
    @layer tokens.scale {
      :root {
        --t-accent-500: oklch(65% 0.18 250deg);
        --t-space-2: 0.5rem;
        --t-motion-scale: 1;
      }
      @media (prefers-reduced-motion: reduce) {
        :root { --t-motion-scale: 0; }
      }
    }
    @layer tokens.semantic {
      :root { --t-accent: var(--t-accent-500); }
      @media (forced-colors: active) {
        :root { --t-accent: ButtonText; }
      }
    }
  `;

  test("keeps a scale literal as-is", () => {
    expect(buildTokenMap(tokensCss).get("--t-space-2")).toBe("0.5rem");
  });

  test("resolves a semantic alias to its terminal literal", () => {
    expect(buildTokenMap(tokensCss).get("--t-accent")).toBe("oklch(65% 0.18 250deg)");
  });

  test("reads the default :root, not the forced-colors branch", () => {
    expect(buildTokenMap(tokensCss).get("--t-accent")).not.toBe("ButtonText");
  });

  test("reads the default :root, not the reduced-motion branch", () => {
    expect(buildTokenMap(tokensCss).get("--t-motion-scale")).toBe("1");
  });
});

describe("buildForcedColorsTokenMap", () => {
  const tokensCss = `
    @layer tokens.scale {
      :root {
        --t-accent-500: oklch(65% 0.18 250deg);
        --t-space-2: 0.5rem;
      }
    }
    @layer tokens.semantic {
      :root {
        --t-accent: var(--t-accent-500);
        --t-focus-ring: var(--t-accent-500);
      }
      @media (forced-colors: active) {
        :root {
          --t-accent: ButtonText;
          --t-focus-ring: Highlight;
        }
      }
    }
  `;

  test("applies the forced-colors override", () => {
    expect(buildForcedColorsTokenMap(tokensCss).get("--t-accent")).toBe("ButtonText");
  });

  test("applies the override for every token in the branch", () => {
    expect(buildForcedColorsTokenMap(tokensCss).get("--t-focus-ring")).toBe("Highlight");
  });

  test("leaves a token without a forced-colors entry unchanged", () => {
    expect(buildForcedColorsTokenMap(tokensCss).get("--t-space-2")).toBe("0.5rem");
  });

  test("ignores compound forced-colors queries", () => {
    const compound = `
      :root { --t-accent: oklch(65% 0.18 250deg); }
      @media (forced-colors: active) and (prefers-color-scheme: dark) {
        :root { --t-accent: ButtonText; }
      }
    `;
    expect(buildForcedColorsTokenMap(compound).get("--t-accent")).toBe("oklch(65% 0.18 250deg)");
  });
});

describe("teseorFloor", () => {
  test("appends a literal floor to a fallback-less token reference", () => {
    expect(floor(".t-x { gap: var(--t-space-2); }")).toContain("var(--t-space-2, 0.5rem)");
  });

  test("floors the inner token of a two-level var() chain", () => {
    expect(floor(".t-x { color: var(--t-button-fg, var(--t-accent)); }")).toContain(
      "var(--t-button-fg, var(--t-accent, oklch(65% 0.18 250deg)))",
    );
  });

  test("leaves --_ private references untouched", () => {
    expect(floor(".t-x { color: var(--_bg); }")).toContain("var(--_bg)");
  });

  test("leaves token definitions untouched", () => {
    expect(floor(":root { --t-foo: var(--t-space-2); }")).not.toContain("0.5rem");
  });

  test("respects a hand-written fallback", () => {
    expect(floor(".t-x { color: var(--t-accent, red); }")).toContain("var(--t-accent, red)");
  });

  test("throws when a token is not declared in tokens.css", () => {
    expect(() => floor(".t-x { color: var(--t-missing); }")).toThrow(/not declared in tokens\.css/);
  });
});

describe("teseorFloor — forced-colors synthesis", () => {
  test("emits a nested forced-colors block when the chain resolves differently", () => {
    const out = floorWithFC(".t-x { color: var(--t-accent); }");
    expect(out).toContain("color: var(--t-accent, oklch(65% 0.18 250deg))");
    expect(out).toMatch(
      /@media \(forced-colors: active\)\s*{\s*color: var\(--t-accent, ButtonText\)/,
    );
  });

  test("synthesizes for the inner token of a two-level chain", () => {
    const out = floorWithFC(".t-x { color: var(--t-button-fg, var(--t-accent)); }");
    expect(out).toContain("color: var(--t-button-fg, var(--t-accent, oklch(65% 0.18 250deg)))");
    expect(out).toContain("var(--t-button-fg, var(--t-accent, ButtonText))");
  });

  test("emits no forced-colors block when the chain resolves identically", () => {
    const out = floorWithFC(".t-x { gap: var(--t-space-2); }");
    expect(out).toContain("var(--t-space-2, 0.5rem)");
    expect(out).not.toContain("forced-colors");
  });

  test("emits no forced-colors block for declarations without any --t-* reference", () => {
    const out = floorWithFC(".t-x { color: red; }");
    expect(out).not.toContain("forced-colors");
  });

  test("does not nest a forced-colors block inside a hand-written forced-colors block", () => {
    const out = floorWithFC(`
      @media (forced-colors: active) {
        .t-x { color: var(--t-accent); }
      }
    `);
    expect(out).toContain("var(--t-accent, ButtonText)");
    // exactly one @media occurrence: the hand-written one, no nested copy
    expect(out.match(/@media \(forced-colors: active\)/g)?.length).toBe(1);
  });

  test("uses the forced-colors map for flooring inside a hand-written forced-colors block", () => {
    const out = floorWithFC(`
      @media (forced-colors: active) {
        .t-x { color: var(--t-accent); }
      }
    `);
    expect(out).toContain("var(--t-accent, ButtonText)");
    expect(out).not.toContain("oklch(65% 0.18 250deg)");
  });

  test("appends overrides at the same nesting level as the original declaration", () => {
    const out = floorWithFC(`
      .t-x {
        color: var(--t-accent);
        &:hover { background: var(--t-accent); }
      }
    `);
    // both the root rule and the &:hover nested rule get their own forced-colors block
    expect(out.match(/@media \(forced-colors: active\)/g)?.length).toBe(2);
  });

  test("is a no-op when no forced-colors token map is provided", () => {
    const out = floor(".t-x { color: var(--t-accent); }");
    expect(out).not.toContain("forced-colors");
  });
});
