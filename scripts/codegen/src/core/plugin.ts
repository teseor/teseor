import type { ZodType } from "zod";
import type { Spec } from "../schema.ts";
import type { Issue } from "../semantic-checks.ts";
import type { SpecAnalysis } from "./analysis.ts";
import type { EmitSlot } from "./slots.ts";

export type EmitTarget = "react" | "vue" | "contract" | "docs" | "tests";

export type EmitContribution =
  | { kind: "append"; slot: EmitSlot; lines: readonly string[] }
  | { kind: "exclusive"; slot: EmitSlot; value: string }
  | { kind: "decorate"; slot: EmitSlot; wrap: (inner: string) => string };

export type EmitContext = {
  spec: Spec;
  analysis: SpecAnalysis;
  target: EmitTarget;
};

export type CheckContext = {
  vocabulary: Readonly<Record<string, unknown>>;
  tokensCss: string | undefined;
  componentCss: string | undefined;
  dependencyIndex: ReadonlyMap<string, readonly string[]>;
  tokenDictionary: Readonly<Record<string, unknown>>;
};

export type SubstratePlugin = {
  readonly name: string;
  readonly schema: {
    atomic?: Record<string, ZodType>;
    composite?: Record<string, ZodType>;
    part?: Record<string, ZodType>;
  };
  readonly analyze?: (spec: Spec) => Partial<SpecAnalysis>;
  readonly check?: (spec: Spec, ctx: CheckContext) => readonly Issue[];
  readonly emit: Partial<Record<EmitSlot, (ctx: EmitContext) => EmitContribution | undefined>>;
  readonly runtime?: {
    readonly react?: string;
    readonly vue?: string;
  };
};
