import postcss from "postcss";
import { describe, expect, test } from "vitest";
import { buildTokenMap, teseorFloor } from "./postcss-teseor-floor.ts";

const tokens = new Map([
  ["--t-accent", "oklch(65% 0.18 250deg)"],
  ["--t-space-2", "0.5rem"],
]);

function floor(css: string): string {
  return postcss([teseorFloor({ tokens })]).process(css, { from: undefined }).css;
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
