import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { parse as parseYaml } from "yaml";
import type { DocsSpec } from "../src/generators/gen-docs.ts";
import { renderDocsPage } from "../src/generators/gen-docs.ts";
import { flattenSpec } from "../src/lib/flatten.ts";
import { Spec as SpecSchema } from "../src/schema.ts";

const REPO_ROOT = resolve(import.meta.dirname, "..", "..", "..");

async function loadSpec(name: string): Promise<DocsSpec> {
  const raw = await readFile(resolve(REPO_ROOT, "specs", `${name}.yaml`), "utf8");
  const parsed = SpecSchema.parse(parseYaml(raw));
  return flattenSpec(parsed) as DocsSpec;
}

describe("gen-docs", () => {
  test("renders the Button docs page", async () => {
    expect(renderDocsPage(await loadSpec("button"))).toMatchSnapshot();
  });

  test("renders the Stack docs page with responsive examples", async () => {
    expect(renderDocsPage(await loadSpec("stack"))).toMatchSnapshot();
  });

  test("renders the Cluster docs page", async () => {
    expect(renderDocsPage(await loadSpec("cluster"))).toMatchSnapshot();
  });

  test("renders the Tooltip docs page with universal overlay rows", async () => {
    expect(renderDocsPage(await loadSpec("tooltip"))).toMatchSnapshot();
  });

  test("injects Escape + outside-pointer rows for any spec with a popover block", async () => {
    const rendered = renderDocsPage(await loadSpec("tooltip"));
    expect(rendered).toContain("<code>Escape</code>");
    expect(rendered).toContain("Topmost-wins when multiple overlays are open.");
    expect(rendered).toContain("<code>Outside pointer-down</code>");
    expect(rendered).toContain("Pressing outside the content closes the overlay.");
  });

  test("omits the universal overlay rows for non-overlay specs", async () => {
    const rendered = renderDocsPage(await loadSpec("button"));
    expect(rendered).not.toContain("Outside pointer-down");
    expect(rendered).not.toContain("Topmost-wins");
  });

  test("spec-declared keyboard entries win on key collision with overlay rows", () => {
    // A spec that goes out of its way to redeclare an overlay key keeps its
    // wording; the synthetic row for that key is skipped. Other overlay keys
    // still inject normally.
    const spec = {
      name: "fancy-popover",
      kind: "composite",
      popover: {
        anchor: "trigger",
        floating: "content",
        mode: "manual",
        anchorVar: "--t-fancy-popover-anchor",
      },
      a11y: { keyboard: { Escape: "Custom Escape wording from the spec." } },
      examples: [],
    } as unknown as DocsSpec;
    const rendered = renderDocsPage(spec);
    expect(rendered).toContain("Custom Escape wording from the spec.");
    expect(rendered).not.toContain("Topmost-wins when multiple overlays are open.");
    // Outside pointer-down is not redeclared, so the universal row still
    // injects.
    expect(rendered).toContain("<code>Outside pointer-down</code>");
    expect(rendered).toContain("Pressing outside the content closes the overlay.");
  });

  test("is deterministic across runs", async () => {
    const spec = await loadSpec("button");
    expect(renderDocsPage(spec)).toBe(renderDocsPage(spec));
  });
});
