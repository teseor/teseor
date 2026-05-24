// Repo root, computed once. Every check script needs to anchor relative
// paths against the repository top — and computing it per-file via
// `import.meta.dirname` plus the right number of `..` segments is the
// rename-trap that caused the depth bugs after the scripts reorg.
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// `import.meta.url` is the file URL of `scripts/lib/paths.ts`; three `..`
// segments walk file → `lib/` → `scripts/` → repo root.
export const REPO_ROOT = resolve(fileURLToPath(import.meta.url), "..", "..", "..");
