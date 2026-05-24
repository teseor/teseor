import { describe, expect, test } from "vitest";
import type { DocsSpec } from "../_shared/sections.ts";
import { renderAtomicDocsPage } from "./atomic.ts";

function atomicSpec(overrides: Partial<DocsSpec> = {}): DocsSpec {
  return {
    name: "widget",
    kind: "atomic",
    props: {},
    tokens: {},
    states: {},
    ...overrides,
  };
}

describe("renderAtomicDocsPage", () => {
  test("emits a non-empty Astro page with the component name as the heading", () => {
    const out = renderAtomicDocsPage(atomicSpec());
    expect(out).toContain("---");
    expect(out).toContain('import Base from "../../layouts/Base.astro";');
    expect(out).toContain('<Base title="Widget — Teseor">');
    expect(out).toContain("<h1>Widget</h1>");
  });

  test("imports only the component name from @teseor/react when examples exist", () => {
    const spec = atomicSpec({
      examples: [{ id: "default", props: { variant: "solid" } }],
    });
    const out = renderAtomicDocsPage(spec);
    expect(out).toContain('import { Widget } from "@teseor/react";');
    expect(out).not.toContain("Button");
  });

  test("skips the @teseor/react import when there are no examples", () => {
    const out = renderAtomicDocsPage(atomicSpec());
    expect(out).not.toContain('from "@teseor/react"');
  });

  test("renders the spec description as a paragraph above the sections", () => {
    const out = renderAtomicDocsPage(atomicSpec({ description: "Small widget." }));
    expect(out).toContain("<p>Small widget.</p>");
  });
});
