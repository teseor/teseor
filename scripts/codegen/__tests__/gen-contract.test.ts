import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { parse as parseYaml } from "yaml";
import {
  renderContract,
  renderResponsiveModule,
  type Spec,
} from "../src/generators/gen-contract.ts";
import { BREAKPOINTS } from "./_fixtures.ts";

const REPO_ROOT = resolve(import.meta.dirname, "..", "..", "..");

async function loadSpec(name: string): Promise<Spec> {
  const raw = await readFile(resolve(REPO_ROOT, "specs", `${name}.yaml`), "utf8");
  return parseYaml(raw) as Spec;
}

describe("gen-contract", () => {
  test("renders the Button contract", async () => {
    const spec = await loadSpec("button");
    expect(renderContract(spec)).toMatchSnapshot();
  });

  test("renders the Stack contract with an enum-typed prop", async () => {
    const spec = await loadSpec("stack");
    expect(renderContract(spec)).toMatchSnapshot();
  });

  test("renders the Cluster contract with multiple enum-typed props", async () => {
    const spec = await loadSpec("cluster");
    expect(renderContract(spec)).toMatchSnapshot();
  });

  test("renders identically on repeated calls", async () => {
    const spec = await loadSpec("button");
    expect(renderContract(spec)).toBe(renderContract(spec));
  });

  test("matches the committed Button.ts", async () => {
    const spec = await loadSpec("button");
    const generated = renderContract(spec);
    const committed = await readFile(
      resolve(REPO_ROOT, "packages", "contract", "src", "Button.ts"),
      "utf8",
    );
    expect(generated).toBe(committed);
  });

  test("renders the responsive type module", () => {
    expect(renderResponsiveModule(BREAKPOINTS)).toMatchSnapshot();
  });

  test("matches the committed _responsive.ts", async () => {
    const generated = renderResponsiveModule(BREAKPOINTS);
    const committed = await readFile(
      resolve(REPO_ROOT, "packages", "contract", "src", "_responsive.ts"),
      "utf8",
    );
    expect(generated).toBe(committed);
  });
});
