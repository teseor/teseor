import { z } from "zod";
import type { SubstratePlugin } from "../../core/plugin.ts";
import { analyzeBranches } from "./analyze.ts";
import { checkBranches } from "./check.ts";
import { branchEntry } from "./schema.ts";

export const branchesPlugin: SubstratePlugin = {
  name: "branches",
  schema: {
    atomic: { branches: z.array(branchEntry).min(1).optional() },
  },
  analyze: (spec) => analyzeBranches(spec),
  check: (spec) => checkBranches(spec),
  emit: {},
};
