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
} from "../src/generators/gen-react.ts";
import { flattenSpec } from "../src/lib/flatten.ts";
import { loadVocabulary } from "../src/lib/vocabulary.ts";
import { Spec as SpecSchema } from "../src/schema.ts";
import { BREAKPOINTS } from "./_fixtures.ts";

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

describe("gen-react", () => {
  test("renders the Button wrapper", async () => {
    const spec = await loadSpec("button");
    const vocab = await loadVocabulary();
    expect(renderWrapper(spec, vocab.propDescriptions)).toMatchSnapshot();
  });

  test("renders the Stack wrapper with an enum-typed prop", async () => {
    const spec = await loadSpec("stack");
    const vocab = await loadVocabulary();
    expect(renderWrapper(spec, vocab.propDescriptions)).toMatchSnapshot();
  });

  test("renders the Cluster wrapper with multiple enum-typed props", async () => {
    const spec = await loadSpec("cluster");
    const vocab = await loadVocabulary();
    expect(renderWrapper(spec, vocab.propDescriptions)).toMatchSnapshot();
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
    expect(renderWrapper(spec, vocab.propDescriptions)).toBe(
      renderWrapper(spec, vocab.propDescriptions),
    );
  });

  test("matches the committed Button.tsx", async () => {
    const spec = await loadSpec("button");
    const vocab = await loadVocabulary();
    const generated = renderWrapper(spec, vocab.propDescriptions);
    const committed = await readFile(
      resolve(REPO_ROOT, "packages", "react", "src", "Button.tsx"),
      "utf8",
    );
    expect(generated).toBe(committed);
  });

  test("matches the committed index.ts", async () => {
    const generated = renderBarrel(await listSpecNames());
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

  describe("modal overlay portal", () => {
    function modalOverlayFixture(modal: boolean): Spec {
      const parsed = SpecSchema.parse({
        name: "dialog",
        kind: "composite",
        overlay: {
          anchor: "trigger",
          floating: "content",
          mode: "manual",
          anchorVar: "--t-dialog-anchor",
          modal,
        },
        parts: {
          trigger: {
            fromChildren: true,
            props: {
              open: {
                type: "boolean",
                default: false,
                pattern: "controllable",
                responsive: false,
                description: "Open state.",
              },
            },
          },
          content: {
            element: "div",
            props: {
              title: {
                type: "string",
                slot: true,
                default: null,
                responsive: false,
                description: "Dialog content.",
              },
            },
          },
        },
      });
      return flattenSpec(parsed) as unknown as Spec;
    }

    test("emits createPortal wrap when overlay.modal is true", async () => {
      const spec = modalOverlayFixture(true);
      const vocab = await loadVocabulary();
      const rendered = renderWrapper(spec, vocab.propDescriptions);
      expect(rendered).toContain(`import { createPortal } from "react-dom"`);
      expect(rendered).toContain("createPortal(");
      expect(rendered).toContain("document.body");
    });

    test("does not emit createPortal when overlay.modal is false", async () => {
      const spec = modalOverlayFixture(false);
      const vocab = await loadVocabulary();
      const rendered = renderWrapper(spec, vocab.propDescriptions);
      expect(rendered).not.toContain("createPortal");
      expect(rendered).not.toContain(`from "react-dom"`);
    });
  });
});
