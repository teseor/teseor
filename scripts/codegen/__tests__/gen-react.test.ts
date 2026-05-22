import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { parse as parseYaml } from "yaml";
import type { Spec } from "../src/generators/gen-contract.ts";
import {
  renderBarrel,
  renderCssShim,
  renderRuntime,
  renderWrapper,
} from "../src/generators/gen-react.ts";

const REPO_ROOT = resolve(import.meta.dirname, "..", "..", "..");
const BREAKPOINTS = ["md", "lg", "xl", "2xl"];

async function loadSpec(name: string): Promise<Spec> {
  const raw = await readFile(resolve(REPO_ROOT, "specs", `${name}.yaml`), "utf8");
  return parseYaml(raw) as Spec;
}

describe("gen-react", () => {
  test("renders the Button wrapper", async () => {
    const spec = await loadSpec("button");
    expect(renderWrapper(spec, BREAKPOINTS)).toMatchSnapshot();
  });

  test("renders the barrel", () => {
    expect(renderBarrel(["button"])).toMatchSnapshot();
  });

  test("renders the runtime helper", () => {
    expect(renderRuntime(BREAKPOINTS)).toMatchSnapshot();
  });

  test("wrapper is identical on repeated calls", async () => {
    const spec = await loadSpec("button");
    expect(renderWrapper(spec, BREAKPOINTS)).toBe(renderWrapper(spec, BREAKPOINTS));
  });

  test("matches the committed Button.tsx", async () => {
    const spec = await loadSpec("button");
    const generated = renderWrapper(spec, BREAKPOINTS);
    const committed = await readFile(
      resolve(REPO_ROOT, "packages", "react", "src", "Button.tsx"),
      "utf8",
    );
    expect(generated).toBe(committed);
  });

  test("matches the committed index.ts", async () => {
    const generated = renderBarrel(["button"]);
    const committed = await readFile(
      resolve(REPO_ROOT, "packages", "react", "src", "index.ts"),
      "utf8",
    );
    expect(generated).toBe(committed);
  });

  test("matches the committed _runtime.ts", async () => {
    const generated = renderRuntime(BREAKPOINTS);
    const committed = await readFile(
      resolve(REPO_ROOT, "packages", "react", "src", "_runtime.ts"),
      "utf8",
    );
    expect(generated).toBe(committed);
  });

  test("matches the committed _css.d.ts", async () => {
    const generated = renderCssShim();
    const committed = await readFile(
      resolve(REPO_ROOT, "packages", "react", "src", "_css.d.ts"),
      "utf8",
    );
    expect(generated).toBe(committed);
  });
});
