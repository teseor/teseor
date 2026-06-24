import type { ZodType } from "zod";
import { z } from "zod";
import type { a11yBlock } from "../plugins/a11y/schema.ts";
import type { branchEntry } from "../plugins/branches/schema.ts";
import type { constraintEntry } from "../plugins/constraints/schema.ts";
import type { coverageBlock } from "../plugins/coverage/schema.ts";
import type { childSpec } from "../plugins/defaultChildren/schema.ts";
import type { eventEntry, genericEntry, PayloadEntry } from "../plugins/events/schema.ts";
import type { exampleEntry } from "../plugins/examples/schema.ts";
import type { latchEntry } from "../plugins/latch/schema.ts";
import type { motionFragment } from "../plugins/motion/schema.ts";
import type { overlayBlock } from "../plugins/overlay/schema.ts";
import type { propEntry } from "../plugins/props/schema.ts";
import type { rootFragment } from "../plugins/root/schema.ts";
import type { stateDef } from "../plugins/states/schema.ts";
import type { tokenEntry } from "../plugins/tokens/schema.ts";
import type {
  intentEntry,
  sizeEntry,
  variantEntry,
  visualStateEntry,
} from "../plugins/variants/schema.ts";
import type { SubstratePlugin } from "./plugin.ts";
import { PLUGINS } from "./registry.ts";

export type { PayloadEntry };

/**
 * Walks a plugin registry in order and merges each plugin's schema fragment
 * for the given scope into a single field map. Throws on the first field-name
 * collision within a scope so plugin conflicts surface at module load time.
 */
export function composeFragments(
  scope: "atomic" | "composite" | "part",
  registry: readonly SubstratePlugin[] = PLUGINS,
): Record<string, ZodType> {
  const result: Record<string, ZodType> = {};
  for (const plugin of registry) {
    const fragment = plugin.schema[scope];
    if (!fragment) continue;
    for (const [key, schema] of Object.entries(fragment)) {
      if (Object.hasOwn(result, key)) {
        throw new Error(
          `Schema collision: plugin "${plugin.name}" registers field "${key}" at scope "${scope}", but it was already registered by a previous plugin.`,
        );
      }
      result[key] = schema;
    }
  }
  return result;
}

// Guidance block — shared across both spec types.
const guidanceBlock = z.strictObject({
  when: z.array(z.string()).optional(),
  whenNot: z.array(z.string()).optional(),
  variantChoice: z.record(z.string(), z.string()).optional(),
  contentRules: z.array(z.string()).optional(),
  commonMistakes: z
    .array(z.strictObject({ mistake: z.string().min(1), fix: z.string().min(1) }))
    .optional(),
});

// Identity-layer fields no plugin owns: name, description, cssFile, primitives,
// guidance. Plugin-owned identity fields (dependencies, examples, coverage,
// events, generics) are contributed via composeFragments().
const identityFields = {
  name: z.string().min(1),
  description: z.string().optional(),
  cssFile: z.string().optional(),
  primitives: z.array(z.string()).optional(),
  guidance: guidanceBlock.optional(),
} as const;

// `fromChildren: true` makes the generator wrap the consumer's children in
// a thin element rather than `cloneElement`; the wrapper survives Astro
// slots, where `cloneElement` fails silently.
export type SpecPart = {
  root?: z.infer<typeof rootFragment>;
  rootClass?: string;
  fromChildren?: boolean;
  repeating?: boolean;
  propName?: string;
  groupKey?: string;
  variants?: Record<string, z.infer<typeof variantEntry>>;
  intents?: Record<string, z.infer<typeof intentEntry>>;
  sizes?: Record<string, z.infer<typeof sizeEntry>>;
  props?: Record<string, z.infer<typeof propEntry>>;
  tokens?: Record<string, z.infer<typeof tokenEntry>>;
  privateTokens?: string[];
  visualStates?: Record<string, z.infer<typeof visualStateEntry>>;
  states?: Record<string, z.infer<typeof stateDef>>;
  overlay?: z.infer<typeof overlayBlock>;
  a11y?: z.infer<typeof a11yBlock>;
  constraints?: Array<z.infer<typeof constraintEntry>>;
  motion?: z.infer<typeof motionFragment>;
  parts?: Record<string, SpecPart>;
};

const componentPart: ZodType<SpecPart> = z.lazy(() =>
  z.strictObject({
    ...composeFragments("part"),
    // rootClass — no plugin owns this; stays inline
    rootClass: z.string().optional(),
    fromChildren: z.boolean().optional(),
    repeating: z.boolean().optional(),
    propName: z.string().min(1).optional(),
    groupKey: z.string().min(1).optional(),
    parts: z.record(z.string(), componentPart).optional(),
  }),
);

// Explicit TypeScript types for atomic and composite so consumers can access
// plugin-owned fields by name. The dynamic spread in z.strictObject loses
// static type information at the call site; these types preserve it.
// Each field must stay in sync with the corresponding plugin's schema.
export type AtomicSpec = {
  kind: "atomic";
  name: string;
  description?: string;
  cssFile?: string;
  primitives?: string[];
  guidance?: z.infer<typeof guidanceBlock>;
  // dependencies plugin
  dependencies?: string[];
  // examples plugin
  examples?: Array<z.infer<typeof exampleEntry>>;
  // coverage plugin
  coverage?: z.infer<typeof coverageBlock>;
  // events plugin
  generics?: Array<z.infer<typeof genericEntry>>;
  events?: Record<string, z.infer<typeof eventEntry>>;
  // root plugin
  root?: z.infer<typeof rootFragment>;
  // rootClass — no plugin owns this; stays inline
  rootClass?: string;
  // variants plugin
  variants?: Record<string, z.infer<typeof variantEntry>>;
  intents?: Record<string, z.infer<typeof intentEntry>>;
  sizes?: Record<string, z.infer<typeof sizeEntry>>;
  visualStates?: Record<string, z.infer<typeof visualStateEntry>>;
  // props plugin
  props?: Record<string, z.infer<typeof propEntry>>;
  // tokens plugin
  tokens?: Record<string, z.infer<typeof tokenEntry>>;
  privateTokens?: string[];
  // a11y plugin
  a11y?: z.infer<typeof a11yBlock>;
  // constraints plugin
  constraints?: Array<z.infer<typeof constraintEntry>>;
  // motion plugin
  motion?: z.infer<typeof motionFragment>;
  // slotElement — no plugin owns this; stays inline
  slotElement?: string;
  // formControl plugin
  formControl?: boolean;
  // htmlAttrs plugin
  htmlAttrs?: Record<string, string>;
  // imperativeProps plugin
  imperativeProps?: Record<string, { type: "boolean"; description?: string }>;
  // defaultChildren plugin
  defaultChildren?: Array<z.infer<typeof childSpec>>;
  // latch plugin
  latch?: Record<string, z.infer<typeof latchEntry>>;
  // branches plugin
  branches?: Array<z.infer<typeof branchEntry>>;
};

export type CompositeSpec = {
  kind: "composite";
  name: string;
  description?: string;
  cssFile?: string;
  primitives?: string[];
  guidance?: z.infer<typeof guidanceBlock>;
  // dependencies plugin
  dependencies?: string[];
  // examples plugin
  examples?: Array<z.infer<typeof exampleEntry>>;
  // coverage plugin
  coverage?: z.infer<typeof coverageBlock>;
  // events plugin
  generics?: Array<z.infer<typeof genericEntry>>;
  events?: Record<string, z.infer<typeof eventEntry>>;
  // motion plugin
  motion?: z.infer<typeof motionFragment>;
  // composite structural field — no plugin owns this
  parts: Record<string, SpecPart>;
};

export type Spec = AtomicSpec | CompositeSpec;

// The ZodType<X> annotations keep the explicit type declarations above in sync
// with the runtime schemas. The cast at the discriminatedUnion call restores the
// Zod 4 discriminable constraint, which requires a ZodObject shape, not ZodType.
const atomicSpec: ZodType<AtomicSpec> = z.strictObject({
  ...identityFields,
  kind: z.literal("atomic"),
  ...composeFragments("atomic"),
  // rootClass — no plugin owns this; stays inline alongside plugin fields
  rootClass: z.string().optional(),
  // slotElement — no plugin owns this; stays inline
  slotElement: z.string().optional(),
});

const compositeSpec: ZodType<CompositeSpec> = z.strictObject({
  ...identityFields,
  kind: z.literal("composite"),
  ...composeFragments("composite"),
  parts: z.record(z.string(), componentPart),
});

// z.union (not z.discriminatedUnion) because the composed atomicSpec/compositeSpec
// values are annotated ZodType<X> to stay in sync with the manually declared
// AtomicSpec/CompositeSpec types — required to keep plugin-contributed fields
// visible to consumers. Zod 4's $ZodTypeDiscriminable demands a concrete
// ZodObject, which ZodType<X> erases. Cost: parse errors on invalid kind values
// list both union branches instead of pointing at kind directly.
export const Spec = z.union([atomicSpec, compositeSpec]);
