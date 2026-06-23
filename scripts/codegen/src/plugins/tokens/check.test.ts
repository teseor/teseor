import { describe, expect, test } from "vitest";
import type { TokenDictionary } from "../../lib/token-dictionary.ts";
import { Spec } from "../../schema.ts";
import {
  checkCssImportAllowlist,
  checkPrivateTokens,
  checkTokenContract,
  checkTokenFallbacks,
  checkTokenNames,
} from "./check.ts";

const tokenDictionary: TokenDictionary = {
  canonical: new Set(["bg", "fg", "pad", "pad-x", "pad-y", "gap", "radius", "dur", "ease"]),
  synonyms: new Map([
    ["background", "bg"],
    ["color", "fg"],
    ["paddingX", "pad-x"],
    ["borderRadius", "radius"],
  ]),
};

function makeButton(overrides: Partial<Spec> = {}): Spec {
  return Spec.parse({
    name: "button",
    kind: "atomic",
    element: "button",
    rootClass: "t-button",
    variants: { solid: { description: "Filled." }, outline: { description: "Outlined." } },
    intents: {
      primary: { description: "Primary." },
      danger: { description: "Danger." },
    },
    sizes: { sm: { description: "Small." }, md: { description: "Medium." } },
    tokens: {
      bg: { fallback: "--t-accent", desc: "Background." },
      fg: { fallback: "--t-on-accent", desc: "Foreground." },
    },
    ...overrides,
  });
}

function makeSpec(s: unknown): Spec {
  return Spec.parse(s);
}

describe("checkTokenContract", () => {
  test("returns no issues when both directions agree", () => {
    const css = `.t-button { background: var(--t-button-bg, var(--t-accent)); color: var(--t-button-fg, var(--t-on-accent)); }`;
    expect(checkTokenContract(makeButton(), css)).toEqual([]);
  });

  test("flags a spec token that is never read in the CSS", () => {
    const css = `.t-button { background: var(--t-button-bg, var(--t-accent)); }`;
    const issues = checkTokenContract(makeButton(), css);
    expect(issues.map((i) => i.path)).toEqual(["tokens.fg"]);
  });

  test("flags a CSS slot that is missing from spec.tokens", () => {
    const css = `.t-button {
      background: var(--t-button-bg, var(--t-accent));
      color: var(--t-button-fg, var(--t-on-accent));
      padding-inline: var(--t-button-pad-x, var(--t-space-4));
    }`;
    const issues = checkTokenContract(makeButton(), css);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toMatch(/pad-x/);
  });

  test("flags spec tokens declared without a CSS file", () => {
    const issues = checkTokenContract(makeButton(), undefined);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toMatch(/missing or unreadable/);
  });

  test("treats a spec name with regex metacharacters as a literal", () => {
    const spec = makeSpec({ ...makeButton(), name: "a.b" });
    const css = `.t-a-b { background: var(--t-a-b-bg, var(--t-accent)); color: var(--t-a-b-fg, var(--t-on-accent)); }`;
    const issues = checkTokenContract(spec, css);
    expect(issues.length).toBeGreaterThan(0);
  });

  test("matches a slot key that contains an underscore", () => {
    const spec = makeButton({
      tokens: {
        font_size: { fallback: "--t-text-base", desc: "Font size." },
      },
    });
    const css = `.t-button { font-size: var(--t-button-font_size, var(--t-text-base)); }`;
    expect(checkTokenContract(spec, css)).toEqual([]);
  });

  test("ignores a CSS read that resolves to a global token sharing the spec-name prefix", () => {
    const spec = makeSpec({ ...makeButton(), name: "text", tokens: {} });
    const css = `.t-text { font-size: var(--t-text-xs); }`;
    const tokensCss = new Set(["--t-text-xs", "--t-text-sm"]);
    expect(checkTokenContract(spec, css, tokensCss)).toEqual([]);
    const issues = checkTokenContract(spec, css);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toMatch(/--t-text-xs/);
  });
});

describe("checkTokenFallbacks", () => {
  const tokensCss = new Set(["--t-accent", "--t-on-accent", "--t-bg", "--t-space-3", "--t-row-3"]);

  test("passes a fallback that resolves to a known token", () => {
    const spec = makeButton({
      tokens: { bg: { fallback: "--t-accent", desc: "Background." } },
    });
    expect(checkTokenFallbacks(spec, tokensCss)).toEqual([]);
  });

  test("flags a fallback that points to a non-existent token", () => {
    const spec = makeButton({
      tokens: { bg: { fallback: "--t-acent", desc: "Background typo." } },
    });
    const issues = checkTokenFallbacks(spec, tokensCss);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toMatch(/--t-acent.*not a token/);
  });

  test("allows literal CSS values (non-token fallbacks)", () => {
    const spec = makeButton({
      tokens: { align: { fallback: "stretch", desc: "Alignment default." } },
    });
    expect(checkTokenFallbacks(spec, tokensCss)).toEqual([]);
  });

  test("flags a `--*` custom property that isn't a known token (missing `t-` prefix)", () => {
    const spec = makeButton({
      tokens: { bg: { fallback: "--acent", desc: "Background, mis-prefixed." } },
    });
    const issues = checkTokenFallbacks(spec, tokensCss);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toMatch(/--acent.*not a token/);
  });

  test("allows the component's own override slot as a fallback", () => {
    const spec = makeButton({
      tokens: { custom: { fallback: "--t-button-other", desc: "Self-referential." } },
    });
    expect(checkTokenFallbacks(spec, tokensCss)).toEqual([]);
  });

  test("flags an intent-token override pointing to a non-existent token", () => {
    const spec = makeButton({
      intents: {
        primary: {
          description: "Primary.",
          tokens: { bg: "--t-acent" },
        },
      },
    });
    const issues = checkTokenFallbacks(spec, tokensCss);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("intents.primary.tokens.bg");
  });

  test("flags a size-token override pointing to a non-existent token", () => {
    const spec = makeButton({
      sizes: {
        sm: {
          description: "Small.",
          tokens: { height: "--t-row-99" },
        },
      },
    });
    const issues = checkTokenFallbacks(spec, tokensCss);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("sizes.sm.tokens.height");
  });

  test("walks composite parts", () => {
    const spec = makeSpec({
      name: "tooltip",
      kind: "composite",
      parts: {
        content: {
          element: "div",
          rootClass: "t-tooltip",
          tokens: {
            bg: { fallback: "--t-acent", desc: "Bad ref." },
            fg: { fallback: "--t-bg", desc: "Good ref." },
          },
        },
      },
    });
    const issues = checkTokenFallbacks(spec, tokensCss);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("parts.content.tokens.bg.fallback");
  });
});

describe("checkPrivateTokens", () => {
  test("passes when every --_* slot is enumerated", () => {
    const spec = makeButton({
      privateTokens: ["--_h", "--_bg", "--_fg"],
    });
    const css = `.t-button { --_h: 1rem; --_bg: red; --_fg: white; }`;
    expect(checkPrivateTokens(spec, css)).toEqual([]);
  });

  test("flags a slot declared in CSS but not listed", () => {
    const spec = makeButton({ privateTokens: ["--_h"] });
    const css = `.t-button { --_h: 1rem; --_bg: red; }`;
    const issues = checkPrivateTokens(spec, css);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toMatch(/declares '--_bg'/);
  });

  test("flags a slot listed but not declared in CSS", () => {
    const spec = makeButton({ privateTokens: ["--_h", "--_unused"] });
    const css = `.t-button { --_h: 1rem; }`;
    const issues = checkPrivateTokens(spec, css);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toMatch(/'--_unused'.*never declared/);
  });

  test("walks composite parts (per-rootClass)", () => {
    const spec = makeSpec({
      name: "tooltip",
      kind: "composite",
      parts: {
        trigger: {
          fromChildren: true,
          rootClass: "t-tooltip-trigger",
          privateTokens: ["--_anchor"],
        },
        content: {
          element: "div",
          rootClass: "t-tooltip",
          privateTokens: ["--_bg", "--_fg"],
        },
      },
    });
    const css = `.t-tooltip-trigger { --_anchor: none; } .t-tooltip { --_bg: red; --_fg: white; }`;
    expect(checkPrivateTokens(spec, css)).toEqual([]);
  });

  test("ignores --_* references on the RHS (only the declaration LHS counts)", () => {
    const spec = makeButton({ privateTokens: ["--_h"] });
    const css = `.t-button { --_h: 1rem; block-size: var(--_h); }`;
    expect(checkPrivateTokens(spec, css)).toEqual([]);
  });

  test("attributes slots declared inside @media blocks to the enclosing root rule", () => {
    const spec = makeButton({ privateTokens: ["--_h", "--_bp-only"] });
    const css = `.t-button {
      --_h: 1rem;
      @media (min-width: 48rem) {
        &:where([data-size-md="sm"]) {
          --_bp-only: 0.5rem;
        }
      }
    }`;
    expect(checkPrivateTokens(spec, css)).toEqual([]);
  });
});

describe("checkTokenNames", () => {
  test("passes canonical token names", () => {
    const spec = makeButton({
      tokens: {
        bg: { fallback: "--t-accent", desc: "Background." },
        fg: { fallback: "--t-on-accent", desc: "Foreground." },
        "pad-x": { fallback: "--t-space-4", desc: "Inline padding." },
      },
    });
    expect(checkTokenNames(spec, tokenDictionary)).toEqual([]);
  });

  test("passes component-specific names that are not close to a canonical", () => {
    const spec = makeButton({
      tokens: {
        bg: { fallback: "--t-accent", desc: "Background." },
        "arrow-bg": { fallback: "--t-neutral-90", desc: "Arrow fill." },
        anchor: { fallback: "none", desc: "Anchor name." },
      },
    });
    expect(checkTokenNames(spec, tokenDictionary)).toEqual([]);
  });

  test("rejects a synonym with a 'use canonical X' hint", () => {
    const spec = makeButton({
      tokens: {
        background: { fallback: "--t-accent", desc: "Background." },
      },
    });
    const issues = checkTokenNames(spec, tokenDictionary);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toMatch(/use canonical 'bg' instead of 'background'/);
    expect(issues[0]?.path).toBe("tokens.background");
  });

  test("rejects a close typo of a canonical name", () => {
    const spec = makeButton({
      tokens: {
        bgg: { fallback: "--t-accent", desc: "Background typo." },
      },
    });
    const issues = checkTokenNames(spec, tokenDictionary);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toMatch(/looks like a typo of canonical token 'bg'/);
  });

  test("walks composite parts", () => {
    const spec = makeSpec({
      name: "tooltip",
      kind: "composite",
      parts: {
        content: {
          element: "div",
          rootClass: "t-tooltip",
          tokens: {
            background: { fallback: "--t-neutral-90", desc: "Bad longhand." },
            "arrow-bg": { fallback: "--t-neutral-90", desc: "Arrow fill." },
          },
        },
      },
    });
    const issues = checkTokenNames(spec, tokenDictionary);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("parts.content.tokens.background");
  });
});

describe("checkCssImportAllowlist", () => {
  test("flags an @import target that is not declared", () => {
    const spec = makeButton({ dependencies: [] });
    const css = `@import "../icon/icon.css";\n.t-button {}`;
    const issues = checkCssImportAllowlist(spec, css);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toMatch(/'icon' but it is not listed/);
  });

  test("accepts a declared dependency", () => {
    const spec = makeButton({ dependencies: ["icon"] });
    const css = `@import "../icon/icon.css";\n.t-button {}`;
    expect(checkCssImportAllowlist(spec, css)).toEqual([]);
  });
});
