import type { ZodType } from "zod";
import type { Spec } from "../schema.ts";
import type { SpecAnalysis } from "./analysis.ts";
import type { Issue } from "./check-utils.ts";

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
};
