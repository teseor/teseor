import { describe, expect, it } from "vitest";
import {
  catalogMismatches,
  catalogScriptNames,
  invalidScriptNames,
} from "./check-script-catalog.ts";

describe("invalidScriptNames", () => {
  it("accepts <verb>:<scope> names", () => {
    expect(invalidScriptNames(["dev", "build:css", "verify:no-dev-leak"])).toEqual([]);
  });

  it("flags names that break the pattern", () => {
    expect(invalidScriptNames(["Build", "test_unit", "lint:"])).toEqual([
      "Build",
      "test_unit",
      "lint:",
    ]);
  });
});

describe("catalogScriptNames", () => {
  it("extracts the base script name from catalog rows", () => {
    const md =
      "## Script catalog\n| `pnpm dev` | x | y | z |\n| `pnpm gen --component=<name>` | a | b | c |\n";
    expect([...catalogScriptNames(md)]).toEqual(["dev", "gen"]);
  });
});

describe("catalogMismatches", () => {
  it("reports a script with no catalog row", () => {
    const result = catalogMismatches(["dev", "build"], new Set(["dev"]));
    expect(result.missing).toEqual(["build"]);
    expect(result.orphan).toEqual([]);
  });

  it("reports a catalog row with no script", () => {
    const result = catalogMismatches(["dev"], new Set(["dev", "ghost"]));
    expect(result.missing).toEqual([]);
    expect(result.orphan).toEqual(["ghost"]);
  });
});
