import { describe, expect, it } from "vitest";
import { extractImports, pluginOf, resolveImport } from "./codegen-import-direction.ts";

describe("pluginOf", () => {
  it("returns the plugin folder name for a file under plugins/<name>/", () => {
    expect(pluginOf("codegen/src/plugins/events/check.ts")).toBe("events");
  });

  it("returns the plugin folder name for a nested file", () => {
    expect(pluginOf("codegen/src/plugins/events/check/runtime-support.ts")).toBe("events");
  });

  it("returns undefined for non-plugin paths", () => {
    expect(pluginOf("codegen/src/core/registry.ts")).toBeUndefined();
  });

  it("returns undefined for the plugins root itself", () => {
    expect(pluginOf("codegen/src/plugins")).toBeUndefined();
  });
});

describe("extractImports", () => {
  it("captures plain string imports", () => {
    expect(extractImports(`import { x } from "./a.ts";`)).toEqual(["./a.ts"]);
  });

  it("captures type-only imports", () => {
    expect(extractImports(`import type { X } from "../core/schema.ts";`)).toEqual([
      "../core/schema.ts",
    ]);
  });

  it("captures re-exports", () => {
    expect(extractImports(`export { x } from "./helpers.ts";`)).toEqual(["./helpers.ts"]);
  });

  it("captures multiple imports", () => {
    const source = `
      import { a } from "./a.ts";
      import { b } from "../core/b.ts";
      import { c } from "zod";
    `;
    expect(extractImports(source)).toEqual(["./a.ts", "../core/b.ts", "zod"]);
  });
});

describe("resolveImport", () => {
  it("resolves a sibling import", () => {
    const target = resolveImport("codegen/src/plugins/events/check.ts", "./schema.ts");
    expect(target).toBe("codegen/src/plugins/events/schema.ts");
  });

  it("resolves a parent-folder import", () => {
    const target = resolveImport("codegen/src/plugins/events/check.ts", "../../core/schema.ts");
    expect(target).toBe("codegen/src/core/schema.ts");
  });

  it("resolves a nested-file parent-folder import", () => {
    const target = resolveImport(
      "codegen/src/plugins/events/check/index.ts",
      "../../../core/schema.ts",
    );
    expect(target).toBe("codegen/src/core/schema.ts");
  });

  it("returns undefined for npm-package imports", () => {
    expect(resolveImport("codegen/src/plugins/events/check.ts", "zod")).toBeUndefined();
  });

  it("flags a sibling-plugin path when resolving plugin → plugin", () => {
    const target = resolveImport("codegen/src/plugins/events/check.ts", "../parts/check.ts");
    expect(target).toBe("codegen/src/plugins/parts/check.ts");
  });
});
