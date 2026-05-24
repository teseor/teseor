// Repo root, computed once. Every check script needs to anchor relative
// paths against the repository top — and computing it per-file via
// `import.meta.dirname` plus the right number of `..` segments is the
// rename-trap that caused the depth bugs after the scripts reorg.
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// This file lives at `scripts/lib/paths.ts`; up two segments lands on the
// repository root. Re-export `REPO_ROOT` rather than recomputing per file.
export const REPO_ROOT = resolve(fileURLToPath(import.meta.url), "..", "..", "..");
