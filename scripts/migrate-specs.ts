#!/usr/bin/env node
import { parseArgs } from "node:util";

type MigratorContext = {
  from: string;
  to: string;
  rule?: string;
  args: Record<string, string | undefined>;
};

type Migrator = {
  id: string;
  description: string;
  run: (ctx: MigratorContext) => Promise<MigrationReport> | MigrationReport;
};

type MigrationReport = {
  filesChanged: string[];
  notes: string[];
};

const REGISTRY: Migrator[] = [];

function registerMigrator(m: Migrator): void {
  REGISTRY.push(m);
}

export type { MigrationReport, Migrator, MigratorContext };
export { registerMigrator };

function printUsage(): void {
  process.stdout.write(`Usage: pnpm migrate-specs --from <oldSchema> --to <newSchema> [--rule <id>] [extra args]

Examples:
  pnpm migrate-specs --from 0.5 --to 0.6 --rule class-rename --old t-btn --new t-button

Available migrators:
${
  REGISTRY.length === 0
    ? "  (none — register migrators by importing this file and calling registerMigrator())"
    : REGISTRY.map((m) => `  ${m.id} — ${m.description}`).join("\n")
}

Notes:
  - Schema change + migrator + gen-drift catch-up land in a single PR.
  - Migrators are idempotent. Running twice is a no-op.
`);
}

function parseCli(): {
  from?: string;
  to?: string;
  rule?: string;
  rest: Record<string, string | undefined>;
} {
  const { values } = parseArgs({
    options: {
      from: { type: "string" },
      to: { type: "string" },
      rule: { type: "string" },
      old: { type: "string" },
      new: { type: "string" },
      help: { type: "boolean", short: "h" },
    },
    strict: false,
    allowPositionals: true,
  });
  if (values.help) {
    printUsage();
    process.exit(0);
  }
  return {
    from: values.from as string | undefined,
    to: values.to as string | undefined,
    rule: values.rule as string | undefined,
    rest: values as Record<string, string | undefined>,
  };
}

async function main(): Promise<void> {
  const { from, to, rule, rest } = parseCli();

  if (!from || !to) {
    printUsage();
    process.exit(from || to ? 1 : 0);
  }

  if (REGISTRY.length === 0) {
    process.stdout.write(
      `migrate-specs: no migrators registered. from=${from} to=${to}${rule ? ` rule=${rule}` : ""}\n`,
    );
    process.stdout.write("Nothing to do. Register a migrator before running.\n");
    process.exit(0);
  }

  const ctx: MigratorContext = { from, to, rule, args: rest };
  const selected = rule ? REGISTRY.filter((m) => m.id === rule) : REGISTRY;

  if (selected.length === 0) {
    process.stderr.write(`migrate-specs: no migrator matches rule="${rule}"\n`);
    process.stderr.write(`Registered: ${REGISTRY.map((m) => m.id).join(", ")}\n`);
    process.exit(1);
  }

  const totalChanges: string[] = [];
  for (const migrator of selected) {
    process.stdout.write(`migrate-specs: running ${migrator.id}\n`);
    const report = await migrator.run(ctx);
    totalChanges.push(...report.filesChanged);
    for (const note of report.notes) process.stdout.write(`  ${note}\n`);
  }

  process.stdout.write(
    `\nmigrate-specs: ${totalChanges.length} file${totalChanges.length === 1 ? "" : "s"} changed\n`,
  );
  if (totalChanges.length > 0) {
    process.stdout.write("Run pnpm gen and commit the regenerated output.\n");
  }
}

main().catch((err) => {
  process.stderr.write(`migrate-specs: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
