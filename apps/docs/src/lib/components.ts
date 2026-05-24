import { parse as parseYaml } from "yaml";

/** Raw YAML strings for every spec, keyed by Vite-resolved path. */
const rawSpecs = import.meta.glob<string>("../../../../specs/*.yaml", {
  query: "?raw",
  import: "default",
  eager: true,
});

type SpecFile = { name: string; description?: string };

function pascalCase(name: string): string {
  return name
    .split(/[-_\s]+/)
    .map((part) => (part.length === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join("");
}

function basename(path: string): string {
  const lastSlash = path.lastIndexOf("/");
  return lastSlash === -1 ? path : path.slice(lastSlash + 1);
}

function parseSpec(path: string, raw: string): SpecFile {
  const file = basename(path);
  const parsed = parseYaml(raw) as { name?: unknown; description?: unknown };
  if (typeof parsed?.name !== "string" || parsed.name.length === 0) {
    throw new Error(`spec ${file} is missing a string \`name\` field`);
  }
  const expected = file.slice(0, -5);
  if (parsed.name !== expected) {
    throw new Error(`spec ${file} declares name "${parsed.name}"; expected "${expected}"`);
  }
  const description = typeof parsed.description === "string" ? parsed.description : undefined;
  return { name: parsed.name, description };
}

type ComponentNavEntry = {
  /** Lowercase spec name. */
  name: string;
  /** Display label in PascalCase. */
  label: string;
  /** Generated docs page route. */
  href: string;
  /** Spec description, if present. */
  description?: string;
};

/**
 * Build-time list of component nav entries derived from `specs/*.yaml`.
 *
 * Underscore-prefixed files (`_vocabulary.yaml`, `_breakpoints.yaml`) are
 * skipped — they are configuration, not components. Entries are sorted
 * alphabetically by display label: the current sidenav is a flat list and
 * with five components the marginal value of section headings is low.
 * Groupings (per `specs/_vocabulary.yaml`) can replace this when the list
 * grows past a single screen.
 */
function loadComponents(): ComponentNavEntry[] {
  const entries = Object.entries(rawSpecs)
    .filter(([path]) => !basename(path).startsWith("_"))
    .map(([path, raw]) => {
      const spec = parseSpec(path, raw);
      return {
        name: spec.name,
        label: pascalCase(spec.name),
        href: `/components/${spec.name}/`,
        description: spec.description,
      };
    });
  entries.sort((a, b) => a.label.localeCompare(b.label));
  return entries;
}

const components = loadComponents();

export type { ComponentNavEntry };
export { components };
