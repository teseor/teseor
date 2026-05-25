import { execSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { beforeAll, expect, test } from "vitest";

const cssRoot = resolve(import.meta.dirname, "..");
// Build into a per-process temp dir — `pnpm -r` runs this file under two
// vitest invocations in parallel; a shared dist/ would race.
const distDir = mkdtempSync(join(tmpdir(), "teseor-css-dist-"));

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
  execSync("node build.mjs", {
    cwd: cssRoot,
    stdio: "ignore",
    env: { ...process.env, TESEOR_CSS_DIST: distDir },
  });
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

test("shipped component CSS carries a forced-colors floor for color tokens", () => {
  const button = readFileSync(join(distDir, "components", "button.css"), "utf8");
  expect(button).toMatch(/@media \(forced-colors: active\)/);
  expect(button).toContain("var(--t-accent, ButtonText)");
  expect(button).toContain("var(--t-focus-ring, Highlight)");
});

test("motion.css ships keyframes and a reduced-motion block", () => {
  const motion = readFileSync(join(distDir, "motion.css"), "utf8");
  expect(motion).toContain("@keyframes spin");
  expect(motion).toContain("@keyframes fade-in");
  expect(motion).toContain("@media (prefers-reduced-motion: reduce)");
});

test("the bundle includes the motion keyframes", () => {
  const bundle = readFileSync(join(distDir, "teseor.css"), "utf8");
  expect(bundle).toContain("@keyframes scale-in");
});
