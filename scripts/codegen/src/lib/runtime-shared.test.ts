import { describe, expect, test } from "vitest";
import { BREAKPOINTS } from "../../__tests__/_fixtures.ts";
import {
  renderSharedPopoverDomHelpers,
  renderSharedResponsiveRuntimePrelude,
  renderSharedResponsiveRuntimeUtilities,
} from "./runtime-shared.ts";

describe("runtime-shared", () => {
  test("renders the shared responsive runtime prelude from the breakpoint registry", () => {
    const rendered = renderSharedResponsiveRuntimePrelude(BREAKPOINTS);
    expect(rendered).toContain(
      'const RESPONSIVE_KEYS = ["base", "md", "lg", "xl", "2xl"] as const;',
    );
    expect(rendered).toContain('  md: "(min-width: 48rem)",');
    expect(rendered).toContain("function readActiveBreakpoint(): Breakpoint");
  });

  test("renders the shared responsive runtime utilities", () => {
    const rendered = renderSharedResponsiveRuntimeUtilities();
    expect(rendered).toContain("export function responsiveDataAttrs(");
    expect(rendered).toContain(
      "export function isActiveAt(value: unknown, bp: Breakpoint): boolean",
    );
  });

  test("renders the shared popover DOM helpers", () => {
    const rendered = renderSharedPopoverDomHelpers();
    expect(rendered).toContain("function sanitizeId(id: string): string");
    expect(rendered).toContain("const SUPPORTS_POPOVER_OPEN_SELECTOR =");
    expect(rendered).toContain("function popoverIsOpen(node: HTMLElement): boolean | undefined");
  });
});
