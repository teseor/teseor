// Shared loader for `specs/_breakpoints.yaml`. Mobile-first order; `base` is
// the implicit floor and is not listed. Both names (for data-attr emission)
// and minWidths (for matchMedia queries baked into the runtime) live here so
// CSS @custom-media, data-attr names, and the JS runtime share one source.
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const SPECS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..", "specs");
const BREAKPOINTS_PATH = resolve(SPECS_DIR, "_breakpoints.yaml");

export type Breakpoint = { name: string; minWidth: string };

type BreakpointsConfig = { breakpoints: Breakpoint[] };

let cached: Breakpoint[] | null = null;

export async function loadBreakpoints(): Promise<Breakpoint[]> {
  if (cached) return cached;
  const raw = await readFile(BREAKPOINTS_PATH, "utf8");
  const parsed = parseYaml(raw) as BreakpointsConfig;
  cached = parsed.breakpoints;
  return cached;
}

/** Names only — for code paths that don't need pixel values (e.g. data-attr keys). */
export function breakpointNames(bps: Breakpoint[]): string[] {
  return bps.map((b) => b.name);
}
