#!/usr/bin/env node
import { parseArgs } from "node:util";
import "./generators/index.ts";
import type { GeneratorContext, GeneratorReport } from "./generator-registry.ts";
import { getGenerator, listGenerators } from "./generator-registry.ts";

function formatGeneratorList(): string {
  const registered = listGenerators();
  if (registered.length === 0) {
    return "  (none — register via registerGenerator(name, fn))";
  }
  return registered.map((id) => `  ${id}`).join("\n");
}

function printUsage(): void {
  process.stdout.write(`Usage: pnpm gen <generator> [args]

Available generators:
${formatGeneratorList()}
`);
}

async function runOne(name: string, ctx: GeneratorContext): Promise<GeneratorReport> {
  const fn = getGenerator(name);
  if (!fn) {
    process.stderr.write(`gen: unknown generator "${name}"\n`);
    const registered = listGenerators();
    process.stderr.write(
      `Registered: ${registered.length > 0 ? registered.join(", ") : "(none)"}\n`,
    );
    process.exit(1);
  }
  const report = await fn(ctx);
  for (const note of report.notes) {
    process.stdout.write(`  ${note}\n`);
  }
  process.stdout.write(
    `gen ${name}: ${report.filesWritten.length} file${report.filesWritten.length === 1 ? "" : "s"} written\n`,
  );
  return report;
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    options: {
      help: { type: "boolean", short: "h" },
    },
    strict: false,
    allowPositionals: true,
  });

  if (values.help) {
    printUsage();
    return;
  }

  const argsBag = { ...(values as Record<string, string | undefined>) };
  const requested = positionals[0];

  if (!requested) {
    const registered = listGenerators();
    if (registered.length === 0) {
      printUsage();
      return;
    }
    for (const name of registered) {
      const ctx: GeneratorContext = { args: argsBag, positionals: [] };
      await runOne(name, ctx);
    }
    return;
  }

  const ctx: GeneratorContext = { args: argsBag, positionals: positionals.slice(1) };
  await runOne(requested, ctx);
}

main().catch((err) => {
  process.stderr.write(`gen: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
