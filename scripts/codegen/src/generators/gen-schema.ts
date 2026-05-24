// Emits `schemas/spec.schema.json` — a JSON Schema (draft-2020-12) artifact
// derived from the Zod spec via `z.toJSONSchema`. Powers the Red Hat YAML
// extension in editors: autocomplete, hover docs, and shape validation as
// authors type `specs/<name>.yaml`. Cross-field rules (`kind: composite`
// requires `parts:`, etc.) stay in Zod's `.refine()` / `semantic-checks.ts`
// — the JSON Schema only covers shape, enums, and recursion.
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import type { GeneratorContext, GeneratorReport } from "../registry.ts";
import { registerGenerator } from "../registry.ts";
import { Spec as SpecSchema } from "../schema.ts";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const SCHEMA_PATH = resolve(REPO_ROOT, "schemas", "spec.schema.json");

async function schemaGenerator(_ctx: GeneratorContext): Promise<GeneratorReport> {
  // Metadata (descriptions, titles) from `.describe()` / `.meta()` calls in
  // `schema.ts` is sourced from Zod's global registry by default — passing
  // `metadata` explicitly is for custom registries only.
  const jsonSchema = z.toJSONSchema(SpecSchema, {
    target: "draft-2020-12",
  });
  const body = `${JSON.stringify(jsonSchema, null, 2)}\n`;
  await mkdir(dirname(SCHEMA_PATH), { recursive: true });
  await writeFile(SCHEMA_PATH, body, "utf8");
  return {
    filesWritten: [SCHEMA_PATH],
    notes: [`schema: spec -> ${SCHEMA_PATH.replace(`${REPO_ROOT}/`, "")}`],
  };
}

registerGenerator("schema", schemaGenerator);
