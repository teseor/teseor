import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { parse as parseYaml } from "yaml";
import type { DocsSpec } from "../src/generators/gen-docs.ts";
import { renderDocsPage } from "../src/generators/gen-docs.ts";

const REPO_ROOT = resolve(import.meta.dirname, "..", "..", "..");

async function loadSpec(name: string): Promise<DocsSpec> {
  const raw = await readFile(resolve(REPO_ROOT, "specs", `${name}.yaml`), "utf8");
  return parseYaml(raw);
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

  test("is deterministic across runs", async () => {
    const spec = await loadSpec("button");
    expect(renderDocsPage(spec)).toBe(renderDocsPage(spec));
  });
});
