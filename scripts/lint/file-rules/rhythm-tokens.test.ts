import { describe, expect, it } from "vitest";
import { findRhythmViolations, isAcceptableSizingValue } from "./rhythm-tokens.ts";

describe("isAcceptableSizingValue", () => {
  it("accepts var(--t-*) refs", () => {
    expect(isAcceptableSizingValue("var(--t-space-3)")).toBe(true);
    expect(isAcceptableSizingValue("var(--t-row-2)")).toBe(true);
  });

  it("accepts calc() over a token", () => {
    expect(isAcceptableSizingValue("calc(var(--t-space-3) * 2)")).toBe(true);
  });

  it("accepts var(--_*) slot refs (component-css governs the slot value)", () => {
    expect(isAcceptableSizingValue("var(--_pad-x)")).toBe(true);
    expect(isAcceptableSizingValue("var(--_arrow-inset)")).toBe(true);
  });

  it("accepts shorthand mixing tokens and zero", () => {
    expect(isAcceptableSizingValue("0 var(--t-space-3)")).toBe(true);
    expect(isAcceptableSizingValue("0 0 var(--_gap) 0")).toBe(true);
  });

  it("accepts pure keywords", () => {
    expect(isAcceptableSizingValue("0")).toBe(true);
    expect(isAcceptableSizingValue("auto")).toBe(true);
    expect(isAcceptableSizingValue("0 auto")).toBe(true);
    expect(isAcceptableSizingValue("none")).toBe(true);
  });

  it("accepts relative units (em, lh, %, vh)", () => {
    expect(isAcceptableSizingValue("1em")).toBe(true);
    expect(isAcceptableSizingValue("1.5lh")).toBe(true);
    expect(isAcceptableSizingValue("100%")).toBe(true);
    expect(isAcceptableSizingValue("50vh")).toBe(true);
    expect(isAcceptableSizingValue("100dvh")).toBe(true);
  });

  it("rejects raw px in sizing context", () => {
    expect(isAcceptableSizingValue("13px")).toBe(false);
    expect(isAcceptableSizingValue("0.5rem 1rem")).toBe(false);
  });

  it("rejects raw rem", () => {
    expect(isAcceptableSizingValue("20rem")).toBe(false);
  });

  it("rejects raw px even mixed with tokens absent", () => {
    expect(isAcceptableSizingValue("8px 16px")).toBe(false);
  });
});

describe("findRhythmViolations — tokens.css", () => {
  const noComponents: { name: string; rel: string; css: string }[] = [];

  it("accepts derived spatial tokens routed through var(--t-unit)", () => {
    const tokens = `:root {
      --t-unit: 0.25rem;
      --t-space-1: var(--t-unit);
      --t-space-5: calc(var(--t-unit) * 6);
      --t-row-2: calc(var(--t-unit) * 8);
      --t-touch-min: calc(var(--t-unit) * 11);
      --t-radius-sm: var(--t-unit);
    }`;
    expect(findRhythmViolations(tokens, noComponents)).toEqual([]);
  });

  it("accepts literal non-derived tokens (--t-space-0, --t-radius-none, --t-radius-full)", () => {
    const tokens = `:root {
      --t-space-0: 0;
      --t-radius-none: 0;
      --t-radius-full: 9999px;
    }`;
    expect(findRhythmViolations(tokens, noComponents)).toEqual([]);
  });

  it("flags a derived spatial token declared with a literal", () => {
    const tokens = `:root {
      --t-space-3: 0.75rem;
    }`;
    const violations = findRhythmViolations(tokens, noComponents);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain("--t-space-3");
    expect(violations[0]?.message).toContain("var(--t-unit)");
  });

  it("flags a derived radius declared without var(--t-unit)", () => {
    const tokens = `:root {
      --t-radius-md: 0.5rem;
    }`;
    expect(findRhythmViolations(tokens, noComponents)).toHaveLength(1);
  });

  it("does not check --t-text-* or --t-leading-* (Phase 2)", () => {
    const tokens = `:root {
      --t-text-base: 1rem;
      --t-leading-normal: 1.5;
    }`;
    expect(findRhythmViolations(tokens, noComponents)).toEqual([]);
  });
});

describe("findRhythmViolations — component CSS", () => {
  const tokens = ":root { --t-unit: 0.25rem; }";

  it("accepts a component that routes every sizing value through a token", () => {
    const css = `.t-x {
      padding-inline: var(--_pad-x);
      padding-block: 0;
      gap: var(--_gap);
      block-size: var(--_h);
      inline-size: 1em;
      margin: 0;
    }`;
    expect(findRhythmViolations(tokens, [{ name: "x", rel: "x.css", css }])).toEqual([]);
  });

  it("flags a raw rem on a sizing property", () => {
    const css = ".t-x { max-inline-size: 20rem; }";
    const violations = findRhythmViolations(tokens, [{ name: "x", rel: "x.css", css }]);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain("max-inline-size");
    expect(violations[0]?.message).toContain("20rem");
  });

  it("flags a raw px on a sizing property", () => {
    const css = ".t-x { padding-inline: 13px; }";
    expect(findRhythmViolations(tokens, [{ name: "x", rel: "x.css", css }])).toHaveLength(1);
  });

  it("ignores non-sizing properties (font-size, border-width, outline-offset)", () => {
    const css = `.t-x {
      font-size: 14px;
      border-width: 1px;
      outline-offset: 2px;
      box-shadow: 0 1px 2px black;
    }`;
    expect(findRhythmViolations(tokens, [{ name: "x", rel: "x.css", css }])).toEqual([]);
  });
});
