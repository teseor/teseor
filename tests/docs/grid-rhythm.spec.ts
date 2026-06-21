// CI gate for vertical-rhythm at composition. The `rhythm-tokens` static lint
// catches lazy sources (raw px in component CSS); this catches emergent
// drift — border + padding + content rounding into an off-grid height.
import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const SPECS_DIR = resolve(fileURLToPath(import.meta.url), "..", "..", "..", "specs");

const PAGES = readdirSync(SPECS_DIR)
  .filter((f) => f.endsWith(".yaml") && !f.startsWith("_"))
  .map((f) => `/components/${f.slice(0, -".yaml".length)}`)
  .sort();

const SKIP_SELECTORS: string[] = [
  // Decorative parts — small fixed-pixel dimensions that don't carry rhythm.
  ".t-spinner",
  ".t-status__dot",
  ".t-progress__bar",
  ".t-skeleton",
  ".t-avatar",
  ".t-spacer",
  ".t-divider",
  // Known-drift categories surfaced by this audit's baseline run.
  // Each entry tracks an open follow-up; remove the entry when its issue closes.
  "p", // #880
  "li", // #880
  "h1", // #880
  "h2", // #880
  "h3", // #880
  "h4", // #880
  "h5", // #880
  "h6", // #880
  "pre.t-codeblock", // #881
  "table", // #882
  "thead", // #882
  "tbody", // #882
  "tr", // #882
  "th", // #882
  "td", // #882
  ".t-stack", // #883
  ".t-cluster", // #883
];

const INLINE_TAGS = new Set([
  "STRONG",
  "B",
  "EM",
  "I",
  "SMALL",
  "SPAN",
  "A",
  "CODE",
  "ABBR",
  "CITE",
  "Q",
  "SUB",
  "SUP",
  "MARK",
  "BR",
  "WBR",
  "KBD",
  "VAR",
  "SAMP",
  "TIME",
]);

const INTRINSIC_TAGS = new Set(["IMG", "PICTURE", "VIDEO", "IFRAME", "CANVAS", "OBJECT", "EMBED"]);

const SVG_ANCESTORS = new Set(["SVG"]);

for (const path of PAGES) {
  test(`grid-rhythm ${path}`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.ok(), `${path} returned HTTP ${response?.status()}`).toBe(true);
    await page.waitForLoadState("networkidle");

    const violations = await page.evaluate(
      ({ skipSelectors, inlineTags, intrinsicTags, svgAncestors }) => {
        const main = document.querySelector("main");
        if (!main)
          return {
            unit: 0,
            items: [] as { selector: string; height: number; expected: number; offBy: number }[],
          };

        const probe = document.createElement("div");
        probe.style.cssText =
          "position:absolute;left:-9999px;top:0;width:var(--t-unit);height:0;visibility:hidden";
        document.body.appendChild(probe);
        const unit = probe.getBoundingClientRect().width;
        probe.remove();

        if (!unit || unit <= 0) {
          return { unit, items: [], failure: "unit resolved to <= 0" as const };
        }

        const inlineSet = new Set(inlineTags);
        const intrinsicSet = new Set(intrinsicTags);
        const svgSet = new Set(svgAncestors);

        const items: { selector: string; height: number; expected: number; offBy: number }[] = [];

        for (const el of Array.from(main.querySelectorAll<HTMLElement>("*"))) {
          const tag = el.tagName.toUpperCase();
          if (inlineSet.has(tag)) continue;
          if (intrinsicSet.has(tag)) continue;
          if (svgSet.has(tag)) continue;
          if (el.closest("svg")) continue;
          const classes = (el.className?.toString?.() || "").trim();
          if (classes.includes("__")) continue;
          if (skipSelectors.some((sel) => el.matches(sel))) continue;

          const style = getComputedStyle(el);
          if (style.position === "absolute" || style.position === "fixed") continue;
          if (style.aspectRatio && style.aspectRatio !== "auto") continue;

          const height = el.getBoundingClientRect().height;
          if (height === 0 || height < unit / 2) continue;

          const remainder = height % unit;
          const aligned = remainder < 0.01 || remainder > unit - 0.01;
          if (aligned) continue;

          const firstClass = classes.split(/\s+/)[0];
          const expected = Math.round(height / unit) * unit;
          const offBy = Math.min(remainder, unit - remainder);
          items.push({
            selector: `${tag.toLowerCase()}${firstClass ? `.${firstClass}` : ""}`,
            height: Math.round(height * 100) / 100,
            expected: Math.round(expected * 100) / 100,
            offBy: Math.round(offBy * 100) / 100,
          });
        }

        return { unit, items };
      },
      {
        skipSelectors: SKIP_SELECTORS,
        inlineTags: [...INLINE_TAGS],
        intrinsicTags: [...INTRINSIC_TAGS],
        svgAncestors: [...SVG_ANCESTORS],
      },
    );

    if ("failure" in violations && violations.failure) {
      throw new Error(`${path}: ${violations.failure}`);
    }

    const report = violations.items
      .map(
        (v) =>
          `  ${v.selector} — height ${v.height}px (expected ${v.expected}px, off by ${v.offBy}px)`,
      )
      .join("\n");
    expect(
      violations.items,
      `unit=${violations.unit}px, ${violations.items.length} violation(s):\n${report}`,
    ).toEqual([]);
  });
}
