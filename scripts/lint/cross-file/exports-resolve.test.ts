import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { checkPackageExports, flattenExportTargets } from "./exports-resolve.ts";

function makePkg(opts: { files?: Record<string, string>; dirs?: string[] }): string {
  const dir = mkdtempSync(resolve(tmpdir(), "teseor-check-exports-"));
  for (const sub of opts.dirs ?? []) {
    mkdirSync(resolve(dir, sub), { recursive: true });
  }
  for (const [path, content] of Object.entries(opts.files ?? {})) {
    const full = resolve(dir, path);
    mkdirSync(resolve(full, ".."), { recursive: true });
    writeFileSync(full, content);
  }
  return dir;
}

describe("flattenExportTargets", () => {
  it("returns a string value as-is", () => {
    expect(flattenExportTargets("./src/index.ts")).toEqual(["./src/index.ts"]);
  });

  it("returns no targets for a `null` block", () => {
    expect(flattenExportTargets(null)).toEqual([]);
  });

  it("walks a conditional exports object", () => {
    const targets = flattenExportTargets({
      style: "./dist/teseor.css",
      default: "./dist/teseor.css",
    });
    expect(targets).toEqual(["./dist/teseor.css", "./dist/teseor.css"]);
  });

  it("walks nested conditionals", () => {
    const targets = flattenExportTargets({
      node: { import: "./dist/index.js", require: "./dist/index.cjs" },
      default: "./dist/index.js",
    });
    expect(targets).toContain("./dist/index.js");
    expect(targets).toContain("./dist/index.cjs");
  });
});

describe("checkPackageExports", () => {
  it("returns no violations when every target exists", () => {
    const dir = makePkg({ files: { "src/index.ts": "export {};" } });
    const result = checkPackageExports(dir, {
      name: "@test/pkg",
      exports: { ".": "./src/index.ts" },
    });
    expect(result.violations).toEqual([]);
    expect(result.skippedDistPaths).toBe(0);
  });

  it("reports a missing barrel", () => {
    const dir = makePkg({});
    const result = checkPackageExports(dir, {
      name: "@test/pkg",
      exports: { ".": "./src/index.ts" },
    });
    expect(result.violations).toEqual([{ pkg: "@test/pkg", key: ".", target: "./src/index.ts" }]);
  });

  it('ignores `null` denylist entries (e.g. `"./_runtime.test": null`)', () => {
    const dir = makePkg({ files: { "src/index.ts": "export {};" } });
    const result = checkPackageExports(dir, {
      name: "@test/pkg",
      exports: { ".": "./src/index.ts", "./_runtime.test": null },
    });
    expect(result.violations).toEqual([]);
  });

  it("ignores wildcard exports", () => {
    const dir = makePkg({ files: { "src/index.ts": "export {};" } });
    const result = checkPackageExports(dir, {
      name: "@test/pkg",
      exports: { ".": "./src/index.ts", "./*": "./src/*" },
    });
    expect(result.violations).toEqual([]);
  });

  it("walks conditional `style` / `default` targets", () => {
    const dir = makePkg({ dirs: ["dist"], files: { "dist/teseor.css": "" } });
    const result = checkPackageExports(dir, {
      name: "@test/pkg",
      exports: {
        ".": { style: "./dist/teseor.css", default: "./dist/teseor.css" },
      },
    });
    expect(result.violations).toEqual([]);
  });

  it("skips missing dist paths when the dist directory does not exist", () => {
    const dir = makePkg({});
    const result = checkPackageExports(dir, {
      name: "@test/pkg",
      exports: { ".": "./dist/teseor.css" },
    });
    expect(result.violations).toEqual([]);
    expect(result.skippedDistPaths).toBe(1);
  });

  it("DOES flag missing dist paths once the dist directory exists", () => {
    const dir = makePkg({ dirs: ["dist"] });
    const result = checkPackageExports(dir, {
      name: "@test/pkg",
      exports: { ".": "./dist/teseor.css" },
    });
    expect(result.violations).toEqual([
      { pkg: "@test/pkg", key: ".", target: "./dist/teseor.css" },
    ]);
    expect(result.skippedDistPaths).toBe(0);
  });

  it("accepts a directory as a valid target (some packages export `./src/`)", () => {
    const dir = makePkg({
      dirs: ["src"],
      files: { "src/index.ts": "export {};" },
    });
    const result = checkPackageExports(dir, {
      name: "@test/pkg",
      exports: { ".": "./src/index.ts", "./src": "./src" },
    });
    expect(result.violations).toEqual([]);
  });

  it("returns no violations when `exports` is undefined", () => {
    const dir = makePkg({});
    const result = checkPackageExports(dir, { name: "@test/pkg" });
    expect(result.violations).toEqual([]);
  });

  it("walks a single-string `exports` value", () => {
    const dir = makePkg({ files: { "src/index.ts": "export {};" } });
    const result = checkPackageExports(dir, {
      name: "@test/pkg",
      exports: "./src/index.ts",
    });
    expect(result.violations).toEqual([]);
  });
});
