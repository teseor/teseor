import { describe, expect, test } from "vitest";
import { renderContractHarness } from "./contract-harness.ts";

describe("renderContractHarness", () => {
  test("exports defineContractTests", () => {
    expect(renderContractHarness()).toContain("export function defineContractTests");
  });

  test("declares the ContractTestOptions shape inline", () => {
    const out = renderContractHarness();
    expect(out).toContain("type ContractTestOptions = {");
    expect(out).toMatch(/component:\s*string;/);
    expect(out).toMatch(/rootClass:\s*string;/);
    expect(out).toMatch(/fixtureIds:\s*readonly string\[\];/);
  });

  test("emits one per-fixture cross-framework parity test", () => {
    const out = renderContractHarness();
    expect(out).toContain("React and Vue render identical DOM");
  });

  test("emits a combined DOM snapshot test", () => {
    const out = renderContractHarness();
    expect(out).toContain("combined DOM snapshot");
    expect(out).toContain(".toMatchSnapshot(");
  });

  test("is deterministic", () => {
    expect(renderContractHarness()).toBe(renderContractHarness());
  });
});
