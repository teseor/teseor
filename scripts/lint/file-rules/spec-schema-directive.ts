// Requires every `specs/<component>.yaml` to declare the JSON Schema mapping
// on the first line so the Red Hat YAML extension picks it up. Without the
// directive, editors fall back to no schema and authors lose autocomplete /
// validation — the artifact stays correct but the authoring loop regresses
// silently. Exempt: `_breakpoints.yaml` and `_vocabulary.yaml` use different
// schemas.
import type { FileRule } from "../registry.ts";

const DIRECTIVE_PREFIX = "# yaml-language-server: $schema=";
const EXEMPT = new Set(["specs/_breakpoints.yaml", "specs/_vocabulary.yaml"]);

/** Returns true when the file's first line declares a yaml-language-server schema. */
export function hasDirective(source: string): boolean {
  const firstLine = source.split("\n", 1)[0] ?? "";
  return firstLine.startsWith(DIRECTIVE_PREFIX);
}

/** Registry entry consumed by `scripts/lint/run.ts`. */
export const rule: FileRule = {
  kind: "file-rule",
  pathspec: ["specs/*.yaml"],
  noun: "spec file(s)",
  accepts: (rel) => !EXEMPT.has(rel),
  run: (_file, source) =>
    hasDirective(source)
      ? []
      : [{ line: 1, message: `missing \`${DIRECTIVE_PREFIX}…\` directive on line 1` }],
  hint:
    "Prepend `# yaml-language-server: $schema=../schemas/spec.schema.json` as the\n" +
    "first line of the spec. The Red Hat YAML extension reads this comment to wire\n" +
    "autocomplete and validation in the editor.",
};
