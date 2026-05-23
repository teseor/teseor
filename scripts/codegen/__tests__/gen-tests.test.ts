import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { parse as parseYaml } from "yaml";
import type { Spec } from "../src/generators/gen-contract.ts";
import {
  renderContractHarness,
  renderReactBarrel,
  renderReactFixtureFile,
  renderSpecFile,
  renderVueBarrel,
  renderVueFixtureFile,
} from "../src/generators/gen-tests.ts";

const REPO_ROOT = resolve(import.meta.dirname, "..", "..", "..");

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

describe("gen-tests", () => {
  test("renders the React fixtures file", async () => {
    const spec = await loadSpec("button");
    expect(renderReactFixtureFile(spec)).toMatchSnapshot();
  });

  test("renders the Vue fixtures file", async () => {
    const spec = await loadSpec("button");
    expect(renderVueFixtureFile(spec)).toMatchSnapshot();
  });

  test("renders the Playwright spec", async () => {
    const spec = await loadSpec("button");
    expect(renderSpecFile(spec)).toMatchSnapshot();
  });

  test("renders the contract harness", () => {
    expect(renderContractHarness()).toMatchSnapshot();
  });

  test("renders the React fixtures barrel", () => {
    expect(renderReactBarrel(["button"])).toMatchSnapshot();
  });

  test("renders the Vue fixtures barrel", () => {
    expect(renderVueBarrel(["button"])).toMatchSnapshot();
  });

  test("React fixtures are identical on repeated calls", async () => {
    const spec = await loadSpec("button");
    expect(renderReactFixtureFile(spec)).toBe(renderReactFixtureFile(spec));
  });

  test("matches the committed Button.react.tsx", async () => {
    const spec = await loadSpec("button");
    const generated = renderReactFixtureFile(spec);
    const committed = await readFile(
      resolve(REPO_ROOT, "apps", "harness", "src", "fixtures", "Button.react.tsx"),
      "utf8",
    );
    expect(generated).toBe(committed);
  });

  test("matches the committed Button.vue.ts", async () => {
    const spec = await loadSpec("button");
    const generated = renderVueFixtureFile(spec);
    const committed = await readFile(
      resolve(REPO_ROOT, "apps", "harness", "src", "fixtures", "Button.vue.ts"),
      "utf8",
    );
    expect(generated).toBe(committed);
  });

  test("matches the committed button.spec.ts", async () => {
    const spec = await loadSpec("button");
    const generated = renderSpecFile(spec);
    const committed = await readFile(
      resolve(REPO_ROOT, "tests", "contract", "button.spec.ts"),
      "utf8",
    );
    expect(generated).toBe(committed);
  });

  test("matches the committed _contract.ts", async () => {
    const generated = renderContractHarness();
    const committed = await readFile(
      resolve(REPO_ROOT, "tests", "contract", "_contract.ts"),
      "utf8",
    );
    expect(generated).toBe(committed);
  });

  test("matches the committed index.react.ts", async () => {
    const generated = renderReactBarrel(await listSpecNames());
    const committed = await readFile(
      resolve(REPO_ROOT, "apps", "harness", "src", "fixtures", "index.react.ts"),
      "utf8",
    );
    expect(generated).toBe(committed);
  });

  test("matches the committed index.vue.ts", async () => {
    const generated = renderVueBarrel(await listSpecNames());
    const committed = await readFile(
      resolve(REPO_ROOT, "apps", "harness", "src", "fixtures", "index.vue.ts"),
      "utf8",
    );
    expect(generated).toBe(committed);
  });

  test("fixture files never declare a helper they don't use", async () => {
    const names = await listSpecNames();
    for (const name of names) {
      const spec = await loadSpec(name);
      const react = renderReactFixtureFile(spec);
      const vue = renderVueFixtureFile(spec);
      for (const [framework, content] of [
        ["react", react],
        ["vue", vue],
      ] as const) {
        for (const helper of ["SLOT", "LABEL"]) {
          const declared = new RegExp(`\\bconst ${helper}\\b`).test(content);
          if (!declared) continue;
          const body = content.replace(new RegExp(`const ${helper}[^\\n]*\\n`), "");
          const used = new RegExp(`\\b${helper}\\b`).test(body);
          expect(
            used,
            `${framework} fixtures for "${name}" declare ${helper} but never use it`,
          ).toBe(true);
        }
      }
    }
  });
});
