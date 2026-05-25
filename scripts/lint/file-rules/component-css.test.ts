import { describe, expect, it } from "vitest";
import { checkComponent } from "./component-css.ts";

const TOKENS = new Map<string, unknown>([
  ["--t-row-2", "2rem"],
  ["--t-row-3", "2.5rem"],
  ["--t-space-3", "0.75rem"],
  ["--t-accent", "oklch(65% 0.18 250deg)"],
  ["--t-motion-scale", "1"],
]);

const FILE = "packages/css/src/components/button/button.css";

function lint(css: string) {
  return checkComponent("button", FILE, css, TOKENS);
}

const VALID = `
@layer components.tokens {
  .t-button {
    --_h: var(--t-row-3);
  }
}
@layer components.styles {
  .t-button {
    box-sizing: border-box;
    margin: 0;
    block-size: var(--_h);
  }
}
`;

describe("checkComponent", () => {
  it("accepts a file that satisfies every rule", () => {
    expect(lint(VALID)).toEqual([]);
  });

  it("rejects var(--t-*) references inside @layer components.styles", () => {
    const css = `
      @layer components.tokens { .t-button { --_h: var(--t-row-3); } }
      @layer components.styles {
        .t-button { box-sizing: border-box; margin: 0; block-size: var(--t-row-3); }
      }
    `;
    const issues = lint(css);
    expect(issues.map((i) => i.message)).toEqual(
      expect.arrayContaining([expect.stringMatching(/--t-row-3.*components\.styles/)]),
    );
  });

  it("allows var(--t-*) references inside @layer components.tokens", () => {
    const css = `
      @layer components.tokens {
        .t-button { --_h: var(--t-row-3); --_bg: var(--t-accent); }
      }
      @layer components.styles {
        .t-button { box-sizing: border-box; margin: 0; }
      }
    `;
    expect(lint(css)).toEqual([]);
  });

  it("rejects a file missing the @layer components.tokens block", () => {
    const css = `
      @layer components.styles {
        .t-button { box-sizing: border-box; margin: 0; }
      }
    `;
    const issues = lint(css);
    expect(issues.map((i) => i.message)).toEqual(
      expect.arrayContaining([expect.stringMatching(/no `@layer components\.tokens`/)]),
    );
  });

  it("rejects a [data-*] modifier that declares a non-var property", () => {
    const css = `
      @layer components.tokens { .t-button { --_h: var(--t-row-3); } }
      @layer components.styles {
        .t-button { box-sizing: border-box; margin: 0; }
        .t-button[data-size="sm"] { color: red; }
      }
    `;
    const issues = lint(css);
    expect(issues.map((i) => i.message)).toEqual(
      expect.arrayContaining([expect.stringMatching(/data-size.*declares `color`/)]),
    );
  });

  it("rejects an unknown --t-* reference that is not the component's own slot", () => {
    const css = `
      @layer components.tokens { .t-button { --_h: var(--t-nonsense); } }
      @layer components.styles { .t-button { box-sizing: border-box; margin: 0; } }
    `;
    const issues = lint(css);
    expect(issues.map((i) => i.message)).toEqual(
      expect.arrayContaining([expect.stringMatching(/--t-nonsense.*neither a token/)]),
    );
  });

  it("allows the component's own --t-{name}-* override slot", () => {
    const css = `
      @layer components.tokens {
        .t-button { --_h: var(--t-button-height, var(--t-row-3)); }
      }
      @layer components.styles { .t-button { box-sizing: border-box; margin: 0; } }
    `;
    expect(lint(css)).toEqual([]);
  });

  it("does not flag `--t-*` substrings that aren't `var(--t-*)` reads", () => {
    const css = `
      @layer components.tokens { .t-button { --_h: var(--t-row-3); } }
      @layer components.styles {
        .t-button {
          box-sizing: border-box;
          margin: 0;
          content: "--t-foo";
        }
      }
    `;
    expect(lint(css)).toEqual([]);
  });

  it("flags a root rule missing box-sizing or margin", () => {
    const css = `
      @layer components.tokens { .t-button { --_h: var(--t-row-3); } }
      @layer components.styles {
        .t-button { block-size: var(--_h); }
      }
    `;
    const issues = lint(css);
    expect(issues.map((i) => i.message)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/must declare `box-sizing`/),
        expect.stringMatching(/must declare `margin`/),
      ]),
    );
  });
});
