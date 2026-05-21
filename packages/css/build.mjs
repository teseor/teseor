#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
import postcssCustomMedia from "postcss-custom-media";
import postcssEach from "postcss-each";
import postcssImport from "postcss-import";

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(ROOT, "src");
const DIST = resolve(ROOT, "dist");

const ENTRIES = [
  { from: "teseor.css", to: "teseor.css" },
  { from: "tokens.css", to: "tokens.css" },
  { from: "utilities.css", to: "utilities.css" },
  { from: "tailwind.css", to: "tailwind.css" },
];

function buildPlugins() {
  return [postcssImport(), postcssEach(), postcssCustomMedia()];
}

async function buildOne({ from, to }) {
  const inputPath = resolve(SRC, from);
  const outputPath = resolve(DIST, to);
  const css = await readFile(inputPath, "utf8");
  const result = await postcss(buildPlugins()).process(css, {
    from: inputPath,
    to: outputPath,
    map: false,
  });
  for (const warn of result.warnings()) {
    process.stderr.write(`build-css ${from}: ${warn.toString()}\n`);
  }
  await writeFile(outputPath, `${result.css.trimEnd()}\n`, "utf8");
  process.stdout.write(`build-css: ${from} -> dist/${to}\n`);
}

async function main() {
  await mkdir(DIST, { recursive: true });
  for (const entry of ENTRIES) {
    await buildOne(entry);
  }
}

main().catch((err) => {
  process.stderr.write(`build-css: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
