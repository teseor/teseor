// Repo root, computed once. Shared by every check script.
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// file → `lib/` → `scripts/` → repo root.
export const REPO_ROOT = resolve(fileURLToPath(import.meta.url), "..", "..", "..");
