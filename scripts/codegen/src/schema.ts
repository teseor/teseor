// Zod schema for `specs/<name>.yaml`.
//
// A spec is an identity layer plus a recursive ComponentNode, gated by an open
// `kind:` discriminated union. Atomic specs inline the node flat at the root;
// composite specs carry a `parts:` map of ComponentNodes, each of which may
// itself carry `parts:`. Every object is strict — unknown keys fail validation.
import { z } from "zod";

const tokenName = z.string().regex(/^--[A-Za-z0-9_-]+$/);

const variantEntry = z.strictObject({
  description: z.string().min(1),
});

const intentEntry = z.strictObject({
  description: z.string().min(1),
  tokens: z.record(z.string(), tokenName).optional(),
});

const sizeEntry = z.strictObject({
  description: z.string().min(1),
  tokens: z.record(z.string(), tokenName).optional(),
});

const visualStateEntry = z.strictObject({
  description: z.string().min(1),
});

const propEntry = z.strictObject({
  type: z.enum(["string", "boolean", "number"]),
  default: z.unknown().optional(),
  description: z.string().min(1),
  responsive: z.boolean().optional(),
  slot: z.boolean().optional(),
  values: z.array(z.string()).optional(),
  pattern: z.literal("controllable").optional(),
});

// Permissive: token-shape resolution is a semantic check, not a schema gate —
// some fallbacks are literal CSS values (`stretch`, `flex-start`, `none`).
const fallbackValue = z.string().min(1);

const tokenEntry = z.strictObject({
  fallback: fallbackValue,
  desc: z.string().min(1),
});

const a11yKeyboard = z.record(z.string(), z.string());

const a11yBlock = z.strictObject({
  role: z.string().optional(),
  keyboard: a11yKeyboard.optional(),
  states: z.record(z.string(), z.string()).optional(),
  /** Forwards a declared prop's runtime value as an `aria-{prop}` attribute on
   *  the root element. Names are bare prop names (e.g. `orientation`);
   *  generators emit `aria-orientation={orientation}`. The prop must be
   *  declared, `type: string`, and `responsive: false`. */
  ariaProps: z.array(z.string().min(1)).optional(),
  /** Names a declared `type: boolean` prop. When that prop is `true` at
   *  runtime the root emits `role="none"` (overriding any static `role`) and
   *  `aria-hidden="true"`, removing the element from the accessibility tree. */
  decorativeProp: z.string().min(1).optional(),
});

const constraintEntry = z.strictObject({
  when: z.record(z.string(), z.unknown()),
  forbid: z.record(z.string(), z.unknown()),
  reason: z.string().min(1),
});

const motionBlock = z.strictObject({
  transitions: z.array(z.string()).optional(),
  enters: z.array(z.string()).optional(),
  exits: z.array(z.string()).optional(),
});

const elementByPropBlock = z.strictObject({
  prop: z.string().min(1),
  map: z.record(z.string().min(1), z.string().min(1)),
});

const componentNodeFields = {
  element: z.string().optional(),
  /** Prop-driven root tag selection. The named prop's runtime value indexes
   *  into `map` to produce the rendered HTML tag. Mutually exclusive with
   *  `element`. The controlling prop must be `type: string` with `values:`
   *  matching the map's keys exactly. */
  elementByProp: elementByPropBlock.optional(),
  rootClass: z.string().optional(),
  variants: z.record(z.string(), variantEntry).optional(),
  intents: z.record(z.string(), intentEntry).optional(),
  sizes: z.record(z.string(), sizeEntry).optional(),
  props: z.record(z.string(), propEntry).optional(),
  tokens: z.record(z.string(), tokenEntry).optional(),
  privateTokens: z.array(z.string()).optional(),
  visualStates: z.record(z.string(), visualStateEntry).optional(),
  a11y: a11yBlock.optional(),
  constraints: z.array(constraintEntry).optional(),
  motion: motionBlock.optional(),
} as const;

// The part declaring `overlay:` is the floating element by definition;
// `anchor:` names a sibling part that wraps the consumer's children.
const overlayBlock = z.strictObject({
  anchor: z.string().min(1),
  anchorVar: z.string().regex(/^--[A-Za-z0-9_-]+$/),
  mode: z.enum(["auto", "manual", "hint"]).default("manual"),
  modal: z.boolean().default(false),
});

// Shorthand `"open"` sugars to `{ to: "open" }`; long form unlocks `after:`,
// `when:`, and `emits:`. Semantic checks reject shorthand when any of those
// are needed.
const transitionTarget = z.union([
  z.string().min(1),
  z.strictObject({
    to: z.string().min(1),
    after: z.string().min(1).optional(),
    when: z.string().min(1).optional(),
    emits: z.record(z.string(), z.record(z.string(), z.unknown())).optional(),
  }),
]);

const stateDef = z.strictObject({
  on: z.record(z.string(), transitionTarget).default({}),
});

// `fromChildren: true` makes the generator wrap the consumer's children in
// a thin element rather than `cloneElement`; the wrapper survives Astro
// slots, where `cloneElement` fails silently.
type ComponentPart = {
  element?: string;
  elementByProp?: { prop: string; map: Record<string, string> };
  rootClass?: string;
  fromChildren?: boolean;
  repeating?: boolean;
  propName?: string;
  groupKey?: string;
  variants?: Record<string, { description: string }>;
  intents?: Record<string, { description: string; tokens?: Record<string, string> }>;
  sizes?: Record<string, { description: string; tokens?: Record<string, string> }>;
  props?: Record<
    string,
    {
      type: "string" | "boolean" | "number";
      default?: unknown;
      description: string;
      responsive?: boolean;
      slot?: boolean;
      values?: string[];
      pattern?: "controllable";
    }
  >;
  tokens?: Record<string, { fallback: string; desc: string }>;
  privateTokens?: string[];
  visualStates?: Record<string, { description: string }>;
  states?: Record<
    string,
    {
      on: Record<
        string,
        | string
        | {
            to: string;
            after?: string;
            when?: string;
            emits?: Record<string, Record<string, unknown>>;
          }
      >;
    }
  >;
  overlay?: {
    anchor: string;
    anchorVar: string;
    mode: "auto" | "manual" | "hint";
    modal: boolean;
  };
  a11y?: {
    role?: string;
    keyboard?: Record<string, string>;
    states?: Record<string, string>;
    ariaProps?: string[];
    decorativeProp?: string;
  };
  constraints?: Array<{
    when: Record<string, unknown>;
    forbid: Record<string, unknown>;
    reason: string;
  }>;
  motion?: { transitions?: string[]; enters?: string[]; exits?: string[] };
  parts?: Record<string, ComponentPart>;
};

const componentPart: z.ZodType<ComponentPart> = z.lazy(() =>
  z.strictObject({
    ...componentNodeFields,
    fromChildren: z.boolean().optional(),
    repeating: z.boolean().optional(),
    propName: z.string().min(1).optional(),
    groupKey: z.string().min(1).optional(),
    states: z.record(z.string(), stateDef).optional(),
    overlay: overlayBlock.optional(),
    parts: z.record(z.string(), componentPart).optional(),
  }),
);

// Closed payload vocabulary — no raw TS fragments, no `unknown`/`any`, so the
// generated contract can't be widened past the schema's reach.
export type PayloadEntry =
  | { type: "string"; nullable?: boolean }
  | { type: "number"; nullable?: boolean }
  | { type: "boolean"; nullable?: boolean }
  | { type: "enum"; values: string[]; nullable?: boolean }
  | { type: "generic"; ref: string; nullable?: boolean }
  | { type: "builtin"; name: string; nullable?: boolean }
  | { type: "array"; of: PayloadEntry; nullable?: boolean };

const payloadEntry: z.ZodType<PayloadEntry> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.strictObject({ type: z.literal("string"), nullable: z.boolean().optional() }),
    z.strictObject({ type: z.literal("number"), nullable: z.boolean().optional() }),
    z.strictObject({ type: z.literal("boolean"), nullable: z.boolean().optional() }),
    z.strictObject({
      type: z.literal("enum"),
      values: z.array(z.string()).min(1),
      nullable: z.boolean().optional(),
    }),
    z.strictObject({
      type: z.literal("generic"),
      ref: z.string().min(1),
      nullable: z.boolean().optional(),
    }),
    z.strictObject({
      type: z.literal("builtin"),
      name: z.string().min(1),
      nullable: z.boolean().optional(),
    }),
    z.strictObject({
      type: z.literal("array"),
      of: payloadEntry,
      nullable: z.boolean().optional(),
    }),
  ]),
);

const eventEntry = z.strictObject({
  description: z.string().min(1),
  payload: z.record(z.string(), payloadEntry).default({}),
});

const genericEntry = z.strictObject({
  name: z.string().regex(/^[A-Z][A-Za-z0-9]*$/),
  description: z.string().min(1),
});

// Identity-layer fields — only at the root, never on a sub-part.
const guidanceBlock = z.strictObject({
  when: z.array(z.string()).optional(),
  whenNot: z.array(z.string()).optional(),
  variantChoice: z.record(z.string(), z.string()).optional(),
  contentRules: z.array(z.string()).optional(),
  commonMistakes: z
    .array(z.strictObject({ mistake: z.string().min(1), fix: z.string().min(1) }))
    .optional(),
});

const coverageDimension = z.union([z.boolean(), z.array(z.string())]);

const coverageBlock = z.record(z.string(), coverageDimension);

const exampleEntry = z.strictObject({
  id: z.string().min(1),
  props: z.record(z.string(), z.unknown()).optional(),
});

const identityFields = {
  name: z.string().min(1),
  description: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  cssFile: z.string().optional(),
  primitives: z.array(z.string()).optional(),
  guidance: guidanceBlock.optional(),
  examples: z.array(exampleEntry).optional(),
  coverage: coverageBlock.optional(),
  generics: z.array(genericEntry).optional(),
  events: z.record(z.string(), eventEntry).optional(),
} as const;

const atomicSpec = z.strictObject({
  ...identityFields,
  kind: z.literal("atomic"),
  ...componentNodeFields,
  slotElement: z.string().optional(),
  polymorphic: z.enum(["asChild"]).optional(),
});

const compositeSpec = z.strictObject({
  ...identityFields,
  kind: z.literal("composite"),
  parts: z.record(z.string(), componentPart),
});

// Open union — extending with new `kind:` values requires no consumer change.
export const Spec = z.discriminatedUnion("kind", [atomicSpec, compositeSpec]);

export type Spec = z.infer<typeof Spec>;
export type AtomicSpec = z.infer<typeof atomicSpec>;
export type CompositeSpec = z.infer<typeof compositeSpec>;
export type SpecPart = ComponentPart;
