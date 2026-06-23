import type { Spec } from "../schema.ts";
import { emptyAnalysis, mergeAnalysis, type SpecAnalysis } from "./analysis.ts";
import type { EmitContribution, EmitTarget, SubstratePlugin } from "./plugin.ts";
import { PLUGINS } from "./registry.ts";
import { type EmitSlot, slotKind } from "./slots.ts";

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

export function emitSlot(
  spec: Spec,
  analysis: SpecAnalysis,
  target: EmitTarget,
  slot: EmitSlot,
  plugins: readonly SubstratePlugin[] = PLUGINS,
): string {
  const kind = slotKind(slot);
  const contributions: EmitContribution[] = [];
  for (const plugin of plugins) {
    const handler = plugin.emit[slot];
    if (!handler) continue;
    const c = handler({ spec, analysis, target });
    if (c) contributions.push(c);
  }

  if (kind === "append") {
    const lines = contributions.flatMap((c) => (c.kind === "append" ? [...c.lines] : []));
    return lines.join("\n");
  }

  if (kind === "exclusive") {
    const claimed = contributions.filter((c) => c.kind === "exclusive");
    if (claimed.length > 1) {
      throw new Error(
        `Exclusive slot "${slot}" claimed by ${claimed.length} plugins for spec "${spec.name}"`,
      );
    }
    return claimed[0]?.kind === "exclusive" ? claimed[0].value : "";
  }

  // decorate
  const decorators = contributions.filter((c) => c.kind === "decorate");
  return decorators.reduce((acc, c) => (c.kind === "decorate" ? c.wrap(acc) : acc), "");
}
