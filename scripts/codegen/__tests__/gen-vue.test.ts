import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { parse as parseYaml } from "yaml";
import type { Spec } from "../src/generators/gen-contract.ts";
import {
  renderBarrel,
  renderCssShim,
  renderRuntime,
  renderWrapper,
} from "../src/generators/gen-vue.ts";
import { loadVocabulary } from "../src/lib/vocabulary.ts";

const REPO_ROOT = resolve(import.meta.dirname, "..", "..", "..");
const BREAKPOINTS = ["md", "lg", "xl", "2xl"];

async function loadSpec(name: string): Promise<Spec> {
  const raw = await readFile(resolve(REPO_ROOT, "specs", `${name}.yaml`), "utf8");
  return parseYaml(raw) as Spec;
}

async function listSpecNames(): Promise<string[]> {
  const entries = await readdir(resolve(REPO_ROOT, "specs"));
  return entries
    .filter((f) => f.endsWith(".yaml") && !f.startsWith("_"))
    .map((f) => f.slice(0, -5))
    .sort();
}

describe("gen-vue", () => {
  test("renders the Button SFC", async () => {
    const spec = await loadSpec("button");
    const vocab = await loadVocabulary();
    expect(renderWrapper(spec, BREAKPOINTS, vocab.propDescriptions)).toMatchSnapshot();
  });

  test("renders the barrel", () => {
    expect(renderBarrel(["button"])).toMatchSnapshot();
  });

  test("renders the runtime helper", () => {
    expect(renderRuntime(BREAKPOINTS)).toMatchSnapshot();
  });

  test("wrapper is identical on repeated calls", async () => {
    const spec = await loadSpec("button");
    const vocab = await loadVocabulary();
    expect(renderWrapper(spec, BREAKPOINTS, vocab.propDescriptions)).toBe(
      renderWrapper(spec, BREAKPOINTS, vocab.propDescriptions),
    );
  });

  test("matches the committed Button.vue", async () => {
    const spec = await loadSpec("button");
    const vocab = await loadVocabulary();
    const generated = renderWrapper(spec, BREAKPOINTS, vocab.propDescriptions);
    const committed = await readFile(
      resolve(REPO_ROOT, "packages", "vue", "src", "Button.vue"),
      "utf8",
    );
    expect(generated).toBe(committed);
  });

  test("matches the committed index.ts", async () => {
    const generated = renderBarrel(await listSpecNames());
    const committed = await readFile(
      resolve(REPO_ROOT, "packages", "vue", "src", "index.ts"),
      "utf8",
    );
    expect(generated).toBe(committed);
  });

  test("matches the committed _runtime.ts", async () => {
    const generated = renderRuntime(BREAKPOINTS);
    const committed = await readFile(
      resolve(REPO_ROOT, "packages", "vue", "src", "_runtime.ts"),
      "utf8",
    );
    expect(generated).toBe(committed);
  });

  test("matches the committed _css.d.ts", async () => {
    const generated = renderCssShim();
    const committed = await readFile(
      resolve(REPO_ROOT, "packages", "vue", "src", "_css.d.ts"),
      "utf8",
    );
    expect(generated).toBe(committed);
  });
});
