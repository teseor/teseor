#!/usr/bin/env node
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
import postcssCustomMedia from "postcss-custom-media";
import postcssEach from "postcss-each";
import postcssImport from "postcss-import";
import { buildTokenMap, teseorFloor } from "./postcss-teseor-floor.ts";

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(ROOT, "src");
const DIST = resolve(ROOT, "dist");
const COMPONENTS_SRC = resolve(SRC, "components");
const COMPONENTS_DIST = resolve(DIST, "components");

// Prepended to every emitted file. CSS @layer precedence is fixed by first
// encounter, so each file must declare the full order — otherwise whichever
// loads first decides it. Idempotent across files.
const LAYER_ORDER =
  "@layer reset, tokens.scale, tokens.semantic, base, primitives, components.tokens, components.styles, utilities, themes;";

const TOP_LEVEL_ENTRIES = [
  { from: "teseor.css", to: "teseor.css" },
  { from: "tokens.css", to: "tokens.css" },
  { from: "reset.css", to: "reset.css" },
  { from: "base.css", to: "base.css" },
  { from: "utilities.css", to: "utilities.css" },
  { from: "tailwind.css", to: "tailwind.css" },
];

// Pass 1 expands @import/@each/@custom-media. Pass 2 (postcss-teseor-floor)
// then sees concrete var() chains and appends each token's literal floor.
async function buildOne(inputPath, outputPath, tokens) {
  const css = await readFile(inputPath, "utf8");
  const expanded = await postcss([postcssImport(), postcssEach(), postcssCustomMedia()]).process(
    css,
    { from: inputPath, to: outputPath, map: false },
  );
  const floored = await postcss([teseorFloor({ tokens })]).process(expanded.css, {
    from: inputPath,
    to: outputPath,
    map: false,
  });
  for (const warn of [...expanded.warnings(), ...floored.warnings()]) {
    process.stderr.write(`build-css ${inputPath}: ${warn.toString()}\n`);
  }
  await writeFile(outputPath, `${LAYER_ORDER}\n\n${floored.css.trimEnd()}\n`, "utf8");
}

async function listComponents() {
  let entries;
  try {
    entries = await readdir(COMPONENTS_SRC, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

async function main() {
  await mkdir(DIST, { recursive: true });
  const tokens = buildTokenMap(await readFile(resolve(SRC, "tokens.css"), "utf8"));
  for (const entry of TOP_LEVEL_ENTRIES) {
    const inputPath = resolve(SRC, entry.from);
    const outputPath = resolve(DIST, entry.to);
    await buildOne(inputPath, outputPath, tokens);
    process.stdout.write(`build-css: ${entry.from} -> dist/${entry.to}\n`);
  }

  const components = await listComponents();
  if (components.length > 0) {
    await mkdir(COMPONENTS_DIST, { recursive: true });
    for (const name of components) {
      const inputPath = resolve(COMPONENTS_SRC, name, `${name}.css`);
      const outputPath = resolve(COMPONENTS_DIST, `${name}.css`);
      await buildOne(inputPath, outputPath, tokens);
      process.stdout.write(
        `build-css: components/${name}/${name}.css -> dist/components/${name}.css\n`,
      );
    }
  }
}

main().catch((err) => {
  process.stderr.write(`build-css: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
