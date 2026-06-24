import { describe, expect, test } from "vitest";
import { renderVueBarrel } from "./vue-barrel.ts";

describe("renderVueBarrel", () => {
  test("emits an import per PascalCased spec name", () => {
    const out = renderVueBarrel(["button", "switch"]);
    expect(out).toContain('import { fixtures as buttonFixtures } from "./Button.vue.ts";');
    expect(out).toContain('import { fixtures as switchFixtures } from "./Switch.vue.ts";');
  });

  test("maps each name to its fixtures inside the exported map", () => {
    const out = renderVueBarrel(["button"]);
    expect(out).toContain("export const vueFixtures: Record<string, Record<string, () => VNode>>");
    expect(out).toContain("button: buttonFixtures,");
  });

  test("renders an empty record when there are no specs", () => {
    const out = renderVueBarrel([]);
    expect(out).toContain("export const vueFixtures");
    expect(out).not.toContain("Fixtures,\n");
  });
});
