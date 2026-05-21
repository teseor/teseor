#!/usr/bin/env node
import { parseArgs } from "node:util";
import type { GeneratorContext } from "./registry.ts";
import { getGenerator, listGenerators } from "./registry.ts";

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

  const name = positionals[0];
  if (!name) {
    printUsage();
    return;
  }

  const fn = getGenerator(name);
  if (!fn) {
    process.stderr.write(`gen: unknown generator "${name}"\n`);
    const registered = listGenerators();
    process.stderr.write(
      `Registered: ${registered.length > 0 ? registered.join(", ") : "(none)"}\n`,
    );
    process.exit(1);
  }

  const ctx: GeneratorContext = {
    args: { ...(values as Record<string, string | undefined>) },
    positionals: positionals.slice(1),
  };
  const report = await fn(ctx);
  for (const note of report.notes) {
    process.stdout.write(`  ${note}\n`);
  }
  process.stdout.write(
    `gen ${name}: ${report.filesWritten.length} file${report.filesWritten.length === 1 ? "" : "s"} written\n`,
  );
}

main().catch((err) => {
  process.stderr.write(`gen: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
