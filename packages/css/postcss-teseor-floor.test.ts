import postcss from "postcss";
import { describe, expect, test } from "vitest";
import { buildForcedColorsTokenMap, buildTokenMap, teseorFloor } from "./postcss-teseor-floor.ts";

const tokens = new Map([
  ["--t-accent", "oklch(65% 0.18 250deg)"],
  ["--t-focus-ring", "oklch(65% 0.18 250deg)"],
  ["--t-surface", "oklch(97% 0 0deg)"],
  ["--t-space-2", "0.5rem"],
]);

const forcedColorsTokens = new Map([
  ["--t-accent", "ButtonText"],
  ["--t-focus-ring", "Highlight"],
  ["--t-surface", "Canvas"],
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
  test("emits one nested forced-colors block at the component root", () => {
    const out = floorWithFC(`
      .t-button {
        --_accent: var(--t-accent);
        &:where([data-intent="primary"]) { --_accent: var(--t-accent); }
        &:focus-visible { outline: 2px solid var(--t-focus-ring); }
      }
    `);
    expect(out.match(/@media \(forced-colors: active\)/g)?.length).toBe(1);
    expect(out).toMatch(/\.t-button[\s\S]*@media \(forced-colors: active\)/);
  });

  test("pairs the synthesised block with forced-color-adjust: none", () => {
    const out = floorWithFC(".t-x { --_accent: var(--t-accent); }");
    expect(out).toMatch(/@media \(forced-colors: active\)\s*{\s*forced-color-adjust:\s*none/);
  });

  test("re-declares the upstream semantic token, not the component-private", () => {
    const out = floorWithFC(".t-x { --_accent: var(--t-accent); }");
    expect(out).toContain("--t-accent: ButtonText");
    expect(out).not.toContain("--_accent: var(--t-accent, ButtonText)");
  });

  test("includes every differing token the file references", () => {
    const out = floorWithFC(`
      .t-x {
        color: var(--t-accent);
        background: var(--t-surface);
        outline: 2px solid var(--t-focus-ring);
      }
    `);
    expect(out).toContain("--t-accent: ButtonText");
    expect(out).toContain("--t-surface: Canvas");
    expect(out).toContain("--t-focus-ring: Highlight");
  });

  test("omits tokens whose forced-colors literal matches the default", () => {
    const out = floorWithFC(".t-x { gap: var(--t-space-2); }");
    expect(out).not.toContain("forced-colors");
  });

  test("emits no block when the file references no differing token", () => {
    const out = floorWithFC(".t-x { gap: var(--t-space-2); padding: var(--t-space-2); }");
    expect(out).not.toContain("forced-colors");
  });

  test("emits no block when no forced-colors token map is given", () => {
    const out = floor(".t-x { color: var(--t-accent); }");
    expect(out).not.toContain("forced-colors");
  });

  test("does not duplicate overrides when a token is referenced from many decls", () => {
    const out = floorWithFC(`
      .t-x {
        --_a: var(--t-accent);
        --_b: var(--t-accent);
        &:hover { --_a: var(--t-accent); }
      }
    `);
    expect(out.match(/--t-accent: ButtonText/g)?.length).toBe(1);
  });

  test("targets the first rule in the file, even when wrapped in @layer", () => {
    const out = floorWithFC(`
      @layer components.tokens {
        .t-button { --_accent: var(--t-accent); }
      }
      @layer components.styles {
        .t-button { color: var(--_accent); }
      }
    `);
    const tokensLayer = out.split("@layer components.styles")[0];
    expect(tokensLayer).toMatch(/@media \(forced-colors: active\)/);
  });
});
