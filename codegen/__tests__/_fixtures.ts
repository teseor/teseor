// Shared test fixtures. Single source of truth: reads `specs/_breakpoints.yaml`
// directly so tests don't drift from production codegen config.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import type { Breakpoint } from "../src/lib/breakpoints.ts";

const REPO_ROOT = resolve(import.meta.dirname, "..", "..");

const breakpointsYaml = readFileSync(resolve(REPO_ROOT, "specs", "_breakpoints.yaml"), "utf8");

export const BREAKPOINTS: Breakpoint[] = (
  parseYaml(breakpointsYaml) as { breakpoints: Breakpoint[] }
).breakpoints;
