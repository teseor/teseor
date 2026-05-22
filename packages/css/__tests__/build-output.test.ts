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

test("shipped component CSS floors every token reference (acid test)", () => {
  const bareToken = /var\(\s*--t-[\w-]+\s*\)/;
  const files = cssFiles(join(distDir, "components"));
  expect(files.length).toBeGreaterThan(0);
  for (const file of files) {
    const css = readFileSync(file, "utf8");
    expect(bareToken.test(css), `${file}: token reference with no literal floor`).toBe(false);
  }
});

test("shipped component CSS inlines the literal resolved from tokens.css", () => {
  const button = readFileSync(join(distDir, "components", "button.css"), "utf8");
  expect(button).toContain("var(--t-accent, oklch(65% 0.18 250deg))");
});
