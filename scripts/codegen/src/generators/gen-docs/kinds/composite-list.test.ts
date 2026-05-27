import { describe, expect, test } from "vitest";
import type { DocsSpec } from "../_shared/sections.ts";
import { renderCompositeListDocsPage } from "./composite-list.ts";

function paginationSpec(overrides: Partial<DocsSpec> = {}): DocsSpec {
  return {
    name: "pagination",
    kind: "composite",
    props: {},
    tokens: {},
    states: {},
    repeating: [
      {
        partName: "page",
        propName: "pages",
        element: "span",
        rootClass: "t-pagination-page",
        itemProps: {
          label: { type: "string", slot: true, description: "Page label." },
          current: { type: "boolean", description: "Active page." },
        },
      },
    ],
    ...overrides,
  };
}

describe("renderCompositeListDocsPage", () => {
  test("emits a non-empty Astro page with the component name as the heading", () => {
    const out = renderCompositeListDocsPage(paginationSpec());
    expect(out).toContain("---");
    expect(out).toContain('<Base title="Pagination — Teseor">');
    expect(out).toContain("<h1>Pagination</h1>");
  });

  test("imports the component itself when examples exist, but NOT Button (list shape has no trigger)", () => {
    const spec = paginationSpec({
      examples: [
        {
          id: "three-pages",
          props: { pages: [{ id: "1", label: "1" }] },
        },
      ],
    });
    const out = renderCompositeListDocsPage(spec);
    expect(out).toContain('import { Pagination, Code, Codeblock } from "@teseor/react";');
    expect(out).not.toContain("Button");
  });

  test("imports Code and Codeblock even without examples (props/items tables use Code)", () => {
    const out = renderCompositeListDocsPage(paginationSpec());
    expect(out).toContain('import { Code, Codeblock } from "@teseor/react";');
    expect(out).not.toContain("Pagination, ");
  });

  test("renders examples as self-closing tags without `client:visible` (list specs have no JS runtime to hydrate)", () => {
    const spec = paginationSpec({
      examples: [
        {
          id: "three-pages",
          props: { pages: [{ id: "1", label: "1" }] },
        },
      ],
    });
    const out = renderCompositeListDocsPage(spec);
    expect(out).toContain("<Pagination");
    expect(out).toContain("/>");
    expect(out).not.toContain("client:visible");
  });

  test("renders a per-item shape section for each repeating part", () => {
    const out = renderCompositeListDocsPage(paginationSpec());
    expect(out).toContain("<h2>PaginationPageItem</h2>");
    expect(out).toContain("<Code>id</Code>");
    expect(out).toContain("<Code>label</Code>");
    expect(out).toContain("<Code>current</Code>");
  });

  test("renders the synthesized array prop in the main Props table", () => {
    const out = renderCompositeListDocsPage(paginationSpec());
    expect(out).toContain("<Code>pages</Code>");
    expect(out).toContain("ReadonlyArray&lt;PaginationPageItem&gt;");
  });
});
