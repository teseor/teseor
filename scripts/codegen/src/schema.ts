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

const stateEntry = z.strictObject({
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

// A token's `fallback:` is either a `--<name>` reference (validated against
// tokens.css by `checkTokenFallbacks`) or a literal CSS value (`stretch`,
// `flex-start`, `none`, …) for layout primitives where the default isn't a
// theme token. The shape gate stays permissive; semantic checks enforce
// "token-shaped values resolve to a real token."
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

const componentNodeFields = {
  element: z.string().optional(),
  rootClass: z.string().optional(),
  variants: z.record(z.string(), variantEntry).optional(),
  intents: z.record(z.string(), intentEntry).optional(),
  sizes: z.record(z.string(), sizeEntry).optional(),
  props: z.record(z.string(), propEntry).optional(),
  tokens: z.record(z.string(), tokenEntry).optional(),
  privateTokens: z.array(z.string()).optional(),
  states: z.record(z.string(), stateEntry).optional(),
  a11y: a11yBlock.optional(),
  constraints: z.array(constraintEntry).optional(),
  motion: motionBlock.optional(),
} as const;

// Recursive sub-part definition. Same shape as a ComponentNode, may carry its
// own `parts:` map. `parts:` only appears on composite roots and on inner
// nodes; atomic specs reject it (the atomic branch omits the field).
//
// `fromChildren: true` marks a part whose DOM comes from the consumer's
// React children (or Vue default slot). The generator wraps that content in
// a thin element (a <span> by default) that carries the part's class,
// attributes, and event handlers — `cloneElement` is intentionally NOT used
// because Astro slots and similar non-React-children contexts make it
// unreliable across framework boundaries.
type ComponentPart = {
  element?: string;
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
  states?: Record<string, { description: string }>;
  a11y?: {
    role?: string;
    keyboard?: Record<string, string>;
    states?: Record<string, string>;
  };
  constraints?: Array<{
    when: Record<string, unknown>;
    forbid: Record<string, unknown>;
    reason: string;
  }>;
  motion?: { transitions?: string[]; enters?: string[]; exits?: string[] };
  parts?: Record<string, ComponentPart>;
};

// `repeating: true` marks a part as the shape of one item in a variable-length
// list. Codegen iterates an array prop named by `propName:` (default: plural
// of part name) and emits one element per item. `groupKey:` opts a repeating
// part into a shared array with sibling repeating parts of the same key —
// codegen interleaves their iteration into one loop.
const componentPart: z.ZodType<ComponentPart> = z.lazy(() =>
  z.strictObject({
    ...componentNodeFields,
    fromChildren: z.boolean().optional(),
    repeating: z.boolean().optional(),
    propName: z.string().min(1).optional(),
    groupKey: z.string().min(1).optional(),
    parts: z.record(z.string(), componentPart).optional(),
  }),
);

// Declarative overlay binding. A composite component with an `overlay:` block
// emits the HTML Popover API attribute on the `floating` part and the CSS
// Anchor Positioning binding (anchor-name on `anchor`, position-anchor on
// `floating`) via the `anchorVar` CSS custom property — written per-instance
// by the generated wrapper.
//
// Naming note: the block is `overlay:` because the concept is "this component
// is an overlay / floating element". The HTML `popover` attribute that codegen
// emits on the floating element is the browser primitive this block binds to;
// `mode: "auto" | "manual" | "hint"` mirrors that attribute's values directly.
const overlayBlock = z.strictObject({
  anchor: z.string().min(1),
  floating: z.string().min(1),
  mode: z.enum(["auto", "manual", "hint"]),
  anchorVar: z.string().regex(/^--[A-Za-z0-9_-]+$/),
  // Modal: useOverlay activates focus-trap + inert cascade, codegen portals the floating element.
  modal: z.boolean().default(false),
});

// Declarative event → state-change rule. `on.target` references a part name
// or the special `document` / `window` sinks — required, so a missing target
// can't compile into a silent no-op interaction. `delay` references a prop
// with `type: number`. `when` references a state (currently only `open`, the
// canonical name for the controlled/uncontrolled boolean emitted by
// `pattern: controllable`).
const interactionRule = z.strictObject({
  on: z.strictObject({
    event: z.string().min(1),
    target: z.string().min(1),
    key: z.string().optional(),
  }),
  do: z.enum(["open", "close", "toggle"]),
  delay: z.string().optional(),
  when: z.string().optional(),
});

// Consumer-facing event surface. Each declared event names a semantic action
// (verb registry lives in `specs/_vocabulary.yaml`) and carries a typed
// payload. Payload fields use a closed vocabulary — no raw TypeScript
// fragments, no `unknown`/`any`. `generic` payloads reference names declared
// in the spec's `generics:` block; `builtin` payloads reference names from
// the vocab's `events.builtins` list. Validator enforces both.
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

// Unconstrained generics: spec author declares a name + description;
// consumers pass whatever type they want at the call site. Constraint
// vocabulary (`Item extends ...`) is a closed-set follow-up — raw TypeScript
// constraint strings would be an escape hatch.
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
  behavior: z.enum(["none", "primitive", "stateful"]).optional(),
  primitives: z.array(z.string()).optional(),
  guidance: guidanceBlock.optional(),
  examples: z.array(exampleEntry).optional(),
  coverage: coverageBlock.optional(),
  overlay: overlayBlock.optional(),
  interactions: z.array(interactionRule).optional(),
  generics: z.array(genericEntry).optional(),
  events: z.record(z.string(), eventEntry).optional(),
} as const;

const atomicSpec = z.strictObject({
  ...identityFields,
  kind: z.literal("atomic"),
  ...componentNodeFields,
  // Wraps slot content in a nested element (e.g. `pre` root + `code` slot for code-block).
  slotElement: z.string().optional(),
});

const compositeSpec = z.strictObject({
  ...identityFields,
  kind: z.literal("composite"),
  parts: z.record(z.string(), componentPart),
});

// The discriminated union is open by design: a third `kind:` (form-composition)
// can be added without breaking the schema shape. Until that lands the union
// covers `atomic` and `composite`.
export const Spec = z.discriminatedUnion("kind", [atomicSpec, compositeSpec]);

export type Spec = z.infer<typeof Spec>;
export type AtomicSpec = z.infer<typeof atomicSpec>;
export type CompositeSpec = z.infer<typeof compositeSpec>;
export type SpecPart = ComponentPart;
