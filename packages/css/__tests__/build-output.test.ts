import { execSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { beforeAll, expect, test } from "vitest";

const cssRoot = resolve(import.meta.dirname, "..");
const distDir = resolve(cssRoot, "dist");

const LAYER_ORDER =
  "@layer reset, tokens.scale, tokens.semantic, base, primitives, components.tokens, components.styles, utilities, themes;";

function cssFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...cssFiles(full));
    } else if (entry.name.endsWith(".css")) {
      out.push(full);
    }
  }
  return out;
}

beforeAll(() => {
  execSync("node build.mjs", { cwd: cssRoot, stdio: "ignore" });
});

test("every emitted CSS file declares the full @layer order first", () => {
  const files = cssFiles(distDir);
  expect(files.length).toBeGreaterThan(0);
  for (const file of files) {
    const content = readFileSync(file, "utf8");
    expect(content.startsWith(LAYER_ORDER), file).toBe(true);
  }
});
