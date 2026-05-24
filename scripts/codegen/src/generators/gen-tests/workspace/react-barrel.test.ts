import { describe, expect, test } from "vitest";
import { renderReactBarrel } from "./react-barrel.ts";

describe("renderReactBarrel", () => {
  test("emits an import per PascalCased spec name", () => {
    const out = renderReactBarrel(["button", "switch"]);
    expect(out).toContain('import { fixtures as buttonFixtures } from "./Button.react.tsx";');
    expect(out).toContain('import { fixtures as switchFixtures } from "./Switch.react.tsx";');
  });

  test("maps each name to its fixtures inside the exported map", () => {
    const out = renderReactBarrel(["button"]);
    expect(out).toContain(
      "export const reactFixtures: Record<string, Record<string, () => ReactNode>>",
    );
    expect(out).toContain("button: buttonFixtures,");
  });

  test("renders an empty record when there are no specs", () => {
    const out = renderReactBarrel([]);
    expect(out).toContain("export const reactFixtures");
    expect(out).not.toContain("Fixtures,\n");
  });
});
