import type { Spec } from "../schema.ts";
import { emptyAnalysis, mergeAnalysis, type SpecAnalysis } from "./analysis.ts";
import type { SubstratePlugin } from "./plugin.ts";
import { PLUGINS } from "./registry.ts";

export function computeAnalysis(
  spec: Spec,
  plugins: readonly SubstratePlugin[] = PLUGINS,
): SpecAnalysis {
  let acc = emptyAnalysis();
  for (const plugin of plugins) {
    const fragment = plugin.analyze?.(spec);
    if (fragment) acc = mergeAnalysis(acc, fragment);
  }
  return acc;
}
