// Zod schema for `specs/<name>.yaml`.
//
// A spec is an identity layer plus a recursive ComponentNode, gated by an open
// `kind:` discriminated union. Atomic specs inline the node flat at the root;
// composite specs carry a `parts:` map of ComponentNodes, each of which may
// itself carry `parts:`. Every object is strict — unknown keys fail validation.
import { z } from "zod";
import { a11yBlock } from "./plugins/a11y/schema.ts";
import { branchEntry } from "./plugins/branches/schema.ts";
import { constraintEntry } from "./plugins/constraints/schema.ts";
import { coverageBlock } from "./plugins/coverage/schema.ts";
import { childSpec } from "./plugins/defaultChildren/schema.ts";
import { elementByPropBlock } from "./plugins/elementByProp/schema.ts";
import { eventEntry, genericEntry } from "./plugins/events/schema.ts";
import { exampleEntry } from "./plugins/examples/schema.ts";
import { stateEntry } from "./plugins/latch/schema.ts";
import { motionFragment } from "./plugins/motion/schema.ts";
import { propEntry } from "./plugins/props/schema.ts";
import { stateDef } from "./plugins/states/schema.ts";
import { tokenEntry } from "./plugins/tokens/schema.ts";
import {
  intentEntry,
  sizeEntry,
  variantEntry,
  visualStateEntry,
} from "./plugins/variants/schema.ts";

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
  motion: motionFragment.optional(),
} as const;

// The part declaring `overlay:` is the floating element by definition;
// `anchor:` names a sibling part that wraps the consumer's children.
const overlayBlock = z.strictObject({
  anchor: z.string().min(1),
  anchorVar: z.string().regex(/^--[A-Za-z0-9_-]+$/),
  mode: z.enum(["auto", "manual", "hint"]).default("manual"),
  modal: z.boolean().default(false),
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
    labelProp?: string;
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
  /** Marks the spec as a form-control atom (Input / Textarea / Select / …).
   *  Shared HTML-attr props (name, form, required, readOnly, disabled) and
   *  cross-prop constraints come from `specs/_vocabulary.yaml#formControl`;
   *  per-spec redeclaration of any shared prop is rejected by
   *  `pnpm lint:spec`. The rendered root tag (or every branch of an
   *  `elementByProp` map) must be one of `formControl.elements`. Composite
   *  form-controls aren't supported in v0. */
  formControl: z.boolean().optional(),
  /** Static HTML attributes baked onto the root element. Each entry emits a
   *  literal attribute (`type="checkbox"`, `loading="lazy"`, …) after the
   *  consumer-prop spread, so consumer overrides are rejected by the wrapper —
   *  these are part of the component contract (Switch is `type="checkbox"`,
   *  not negotiable). Keys are bare HTML attribute names; values are strings. */
  htmlAttrs: z.record(z.string().min(1), z.string()).optional(),
  /** JS-only DOM properties the wrapper sets imperatively after mount.
   *  Mirrors the `<input>.indeterminate` / `<details>.open` / `<video>.muted`
   *  pattern — no HTML attribute exists, so React props / Vue attribute
   *  fallthrough can't reach them. Each entry becomes a typed prop on the
   *  wrapper that's applied via `useEffect` (React) / `watch` (Vue). Keys must
   *  be valid JS identifiers (the DOM-property name). */
  imperativeProps: z
    .record(
      z.string().regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, "must be a valid JS identifier"),
      z.strictObject({
        type: z.literal("boolean"),
        description: z.string().optional(),
      }),
    )
    .optional(),
  /** Default children rendered inside every example for atomic specs whose
   *  root element has constrained children (`<select>` needs `<option>`,
   *  `<datalist>` needs `<option>`, `<picture>` needs `<source>`, etc.).
   *  Each entry emits one child element; `text` is the child's text content.
   *  When omitted, atomic non-void specs default to a single `{LABEL}` text
   *  node (Heading-style). */
  defaultChildren: z.array(childSpec).optional(),
  /** Internal reactive state declared at the wrapper level. v0 supports
   *  `{ type: boolean, initial: <bool> }`. The generator emits `useState`
   *  (React) / `ref` (Vue) at the top of the wrapper body. Mutated only
   *  through `attrs.<name>: { setState: { name, to } }` clauses inside
   *  `branches:`. */
  state: z.record(z.string().min(1), stateEntry).optional(),
  /** Ordered conditional subtrees. The generator emits a ternary chain
   *  (React) / `v-if`/`v-else-if`/`v-else` (Vue) inside the wrapper root.
   *  Each entry: `when` (object-form clauses; no string DSL), `element`
   *  (tag name), `attrs` (each value references a prop or sets internal
   *  state), `text` (literal-prop or computed-via-runtime-helper). The
   *  last branch may omit `when` as the unconditional fallback. */
  branches: z.array(branchEntry).min(1).optional(),
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

export type { PayloadEntry } from "./plugins/events/schema.ts";
