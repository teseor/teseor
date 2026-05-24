import { describe, expect, test } from "vitest";
import type { DocsSpec } from "../_shared/sections.ts";
import { renderCompositeOverlayDocsPage } from "./composite-overlay.ts";

function compositeSpec(overrides: Partial<DocsSpec> = {}): DocsSpec {
  return {
    name: "tooltip",
    kind: "composite",
    props: {},
    tokens: {},
    states: {},
    ...overrides,
  };
}

describe("renderCompositeOverlayDocsPage", () => {
  test("emits a non-empty Astro page with the component name as the heading", () => {
    const out = renderCompositeOverlayDocsPage(compositeSpec());
    expect(out).toContain("---");
    expect(out).toContain('<Base title="Tooltip — Teseor">');
    expect(out).toContain("<h1>Tooltip</h1>");
  });

  test("imports the component name AND Button from @teseor/react when examples exist", () => {
    const spec = compositeSpec({
      examples: [{ id: "default", props: { text: "Hi" } }],
    });
    const out = renderCompositeOverlayDocsPage(spec);
    expect(out).toContain('import { Tooltip, Button } from "@teseor/react";');
  });

  test("skips the @teseor/react import when there are no examples", () => {
    const out = renderCompositeOverlayDocsPage(compositeSpec());
    expect(out).not.toContain('from "@teseor/react"');
  });

  test("wraps example markup with a Button trigger and hydrates on visibility", () => {
    const spec = compositeSpec({
      examples: [{ id: "default", props: { text: "Hi" } }],
    });
    const out = renderCompositeOverlayDocsPage(spec);
    expect(out).toContain("client:visible");
    expect(out).toContain('<Button variant="solid" intent="primary">Trigger</Button>');
  });
});
