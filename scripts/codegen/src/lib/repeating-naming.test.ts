import { describe, expect, test } from "vitest";
import type { FlatRepeatingPart } from "./flatten.ts";
import { itemTypeName } from "./repeating-naming.ts";

function part(overrides: Partial<FlatRepeatingPart>): FlatRepeatingPart {
  return {
    partName: "page",
    propName: "pages",
    itemProps: {},
    ...overrides,
  };
}

describe("itemTypeName", () => {
  test("ungrouped: uses partName + Item", () => {
    expect(itemTypeName("Pagination", part({ partName: "page" }))).toBe("PaginationPageItem");
  });

  test("grouped with `items`: collapses doubled suffix to `<Name>Item`", () => {
    expect(itemTypeName("Tablist", part({ groupKey: "items" }))).toBe("TablistItem");
  });

  test("grouped with non-item-shape: uses groupKey verbatim + Item", () => {
    expect(itemTypeName("Tabs", part({ groupKey: "tabs" }))).toBe("TabsTabsItem");
    expect(itemTypeName("Pagination", part({ groupKey: "pages" }))).toBe("PaginationPagesItem");
  });

  test("collision case from Copilot: grouped `pages` and ungrouped `page` produce distinct names", () => {
    const grouped = itemTypeName("Xxx", part({ partName: "x", groupKey: "pages" }));
    const ungrouped = itemTypeName("Xxx", part({ partName: "page" }));
    expect(grouped).toBe("XxxPagesItem");
    expect(ungrouped).toBe("XxxPageItem");
    expect(grouped).not.toBe(ungrouped);
  });
});
