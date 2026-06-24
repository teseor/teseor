// Normalize an atomic-or-composite spec into one flat shape. `__part` markers
// route attributes/handlers back to the originating part when generators
// emit per-part DOM (gen-react, gen-vue).
import type { Spec, SpecPart } from "../core/schema.ts";

export type FlatProp = {
  type: "string" | "boolean" | "number";
  default?: unknown;
  description: string;
  responsive?: boolean;
  slot?: boolean;
  values?: string[];
  pattern?: "controllable";
  /** Originating part name; empty string for atomic spec props. */
  __part: string;
};

export type FlatItemProp = {
  type: "string" | "boolean" | "number";
  default?: unknown;
  description: string;
  responsive?: boolean;
  slot?: boolean;
  values?: string[];
  pattern?: "controllable";
};

/** One entry per repeating part. */
export type FlatRepeatingPart = {
  /** Originating part name (e.g. `page`). */
  partName: string;
  /** Final array prop name on the parent (e.g. `pages`). When `groupKey:` is
   *  set, propName derives from groupKey and is shared across siblings. */
  propName: string;
  /** Per-item DOM emission, resolved from the part's `root:`. */
  root?: SpecPart["root"];
  rootClass?: string;
  /** Per-item prop shape. Codegen synthesizes a required `id: string` on top. */
  itemProps: Record<string, FlatItemProp>;
  /** Group key shared with sibling repeating parts. Same-parent siblings with
   *  matching `groupKey` are codegen-interleaved into one loop. */
  groupKey?: string;
};

type FlatToken = {
  fallback: string;
  desc: string;
  __part: string;
};

type FlatVisualState = {
  description: string;
  __part: string;
};

type FlatA11y = {
  role?: string;
  keyboard?: Record<string, string>;
  states?: Record<string, string>;
  ariaProps?: string[];
  decorativeProp?: string;
  labelProp?: string;
};

type FlatMotion = {
  transitions?: string[];
  enters?: string[];
  exits?: string[];
};

export type FlatSpec = {
  name: string;
  description?: string;
  kind: "atomic" | "composite";
  cssFile?: string;
  primitives?: string[];
  dependencies?: string[];
  examples?: Spec["examples"];
  coverage?: Spec["coverage"];
  /** Original composite parts, untouched — generators that need per-part
   *  rendering (gen-react / gen-vue) walk them directly for state machines
   *  and per-part overlay blocks. */
  parts?: Record<string, SpecPart>;
  /** Atomic root descriptor: a static tag, or a runtime tag resolved from a
   *  controlling prop (`byProp`). Either branch may carry `polymorphic: asChild`,
   *  which makes the wrapper accept an `asChild?: boolean` prop and render via
   *  the shared Slot helper instead of the root element. */
  root?: Extract<Spec, { kind: "atomic" }>["root"];
  slotElement?: string;
  /** Atomic-only: when `true`, the spec is a form-control atom. The shared
   *  contract (props + valid root elements) lives in
   *  `specs/_vocabulary.yaml#formControl` and is enforced by `pnpm lint:spec`. */
  formControl?: boolean;
  /** Atomic-only: static HTML attributes baked onto the root element after the
   *  consumer-prop spread (Switch's `type="checkbox"`, an image's `loading`
   *  default, …). */
  htmlAttrs?: Record<string, string>;
  /** Atomic-only: JS-only DOM properties the wrapper sets imperatively after
   *  mount (Checkbox's `indeterminate`, `<details>.open`, …). */
  imperativeProps?: Record<string, { type: "boolean"; description?: string }>;
  /** Atomic-only: internal reactive state declarations — generators emit one
   *  `useState`/`ref` per entry. v0 is boolean-only. */
  latch?: Record<string, { type: "boolean"; initial: boolean }>;
  /** Atomic-only: ordered conditional subtrees rendered inside the root. */
  branches?: Extract<Spec, { kind: "atomic" }>["branches"];
  /** Atomic-only: default children rendered inside every example when the root
   *  element has constrained children (`<select>` → `<option>`, `<datalist>` →
   *  `<option>`, `<picture>` → `<source>`, etc.). Flows through fixtures and
   *  docs examples; absent for the common text-node case. */
  defaultChildren?: Array<{
    tag: string;
    attrs?: Record<string, string | number | boolean>;
    text?: string;
  }>;
  rootClass?: string;
  variants?: Record<string, { description: string }>;
  intents?: Record<string, { description: string; tokens?: Record<string, string> }>;
  sizes?: Record<string, { description: string; tokens?: Record<string, string> }>;
  /** Merged across all parts (composite) or the atomic root. */
  props: Record<string, FlatProp>;
  tokens: Record<string, FlatToken>;
  visualStates: Record<string, FlatVisualState>;
  a11y?: FlatA11y;
  motion?: FlatMotion;
  privateTokens?: string[];
  constraints?: Extract<Spec, { kind: "atomic" }>["constraints"];
  repeating?: FlatRepeatingPart[];
  /** Consumer event surface — passed through unchanged so generators emit
   *  per-event props + the discriminated channel. Composite-only; atomic
   *  specs never wired this up. */
  events?: Spec["events"];
  generics?: Spec["generics"];
};

function visitParts(
  parts: Record<string, SpecPart>,
  visit: (partName: string, part: SpecPart, partPath: string) => void,
  prefix = "",
): void {
  for (const [name, part] of Object.entries(parts)) {
    const partPath = prefix === "" ? name : `${prefix}.${name}`;
    visit(name, part, partPath);
    if (part.parts) visitParts(part.parts, visit, partPath);
  }
}

export function flattenSpec(spec: Spec): FlatSpec {
  if (spec.kind === "atomic") {
    const props: Record<string, FlatProp> = {};
    for (const [name, def] of Object.entries(spec.props ?? {})) {
      props[name] = { ...def, __part: "" };
    }
    const tokens: Record<string, FlatToken> = {};
    for (const [name, def] of Object.entries(spec.tokens ?? {})) {
      tokens[name] = { ...def, __part: "" };
    }
    const visualStates: Record<string, FlatVisualState> = {};
    for (const [name, def] of Object.entries(spec.visualStates ?? {})) {
      visualStates[name] = { ...def, __part: "" };
    }
    return {
      name: spec.name,
      description: spec.description,
      kind: "atomic",
      cssFile: spec.cssFile,
      primitives: spec.primitives,
      dependencies: spec.dependencies,
      examples: spec.examples,
      coverage: spec.coverage,
      root: spec.root,
      slotElement: spec.slotElement,
      formControl: spec.formControl,
      htmlAttrs: spec.htmlAttrs,
      imperativeProps: spec.imperativeProps,
      defaultChildren: spec.defaultChildren,
      latch: spec.latch,
      branches: spec.branches,
      rootClass: spec.rootClass,
      variants: spec.variants,
      intents: spec.intents,
      sizes: spec.sizes,
      props,
      tokens,
      visualStates,
      a11y: spec.a11y,
      motion: spec.motion,
      privateTokens: spec.privateTokens,
      constraints: spec.constraints,
    };
  }

  // Composite: walk parts, merge. Token names that appear on more than one
  // part are namespaced by the full dotted path so nested-part collisions
  // resolve too. Single-occurrence names stay bare so public slots
  // (`--t-tooltip-bg`) keep their existing names.
  const props: Record<string, FlatProp> = {};
  const tokens: Record<string, FlatToken> = {};
  const visualStates: Record<string, FlatVisualState> = {};
  const privateTokens: string[] = [];
  const repeating: FlatRepeatingPart[] = [];
  let a11y: FlatA11y | undefined;
  let motion: FlatMotion | undefined;
  let variants: FlatSpec["variants"];
  let intents: FlatSpec["intents"];
  let sizes: FlatSpec["sizes"];

  const tokenNameCounts = new Map<string, number>();
  visitParts(spec.parts, (_partName, part) => {
    for (const name of Object.keys(part.tokens ?? {})) {
      tokenNameCounts.set(name, (tokenNameCounts.get(name) ?? 0) + 1);
    }
  });

  visitParts(spec.parts, (partName, part, partPath) => {
    if (part.repeating === true) {
      const itemProps: Record<string, FlatItemProp> = {};
      for (const [name, def] of Object.entries(part.props ?? {})) {
        itemProps[name] = { ...def };
      }
      // Precedence: explicit `propName` > `groupKey` (shared with siblings) >
      // pluralized part name.
      const effectivePropName = part.propName ?? part.groupKey ?? `${partName}s`;
      repeating.push({
        partName,
        propName: effectivePropName,
        root: part.root,
        rootClass: part.rootClass,
        itemProps,
        groupKey: part.groupKey,
      });
    } else {
      for (const [name, def] of Object.entries(part.props ?? {})) {
        if (props[name]) {
          throw new Error(
            `composite spec '${spec.name}' has a prop name collision on '${name}' across parts`,
          );
        }
        props[name] = { ...def, __part: partName };
      }
    }
    for (const [name, def] of Object.entries(part.tokens ?? {})) {
      const flatKey = (tokenNameCounts.get(name) ?? 0) > 1 ? `${partPath}.${name}` : name;
      tokens[flatKey] = { ...def, __part: partName };
    }
    for (const [name, def] of Object.entries(part.visualStates ?? {})) {
      if (visualStates[name]) {
        throw new Error(
          `composite spec '${spec.name}' has a visualState name collision on '${name}' across parts`,
        );
      }
      visualStates[name] = { ...def, __part: partName };
    }
    if (part.privateTokens) privateTokens.push(...part.privateTokens);
    if (part.a11y && !a11y) a11y = { ...part.a11y };
    if (part.motion && !motion) motion = { ...part.motion };
    if (part.variants && !variants) variants = part.variants;
    if (part.intents && !intents) intents = part.intents;
    if (part.sizes && !sizes) sizes = part.sizes;
  });

  return {
    name: spec.name,
    description: spec.description,
    kind: "composite",
    cssFile: spec.cssFile,
    primitives: spec.primitives,
    dependencies: spec.dependencies,
    examples: spec.examples,
    coverage: spec.coverage,
    parts: spec.parts,
    variants,
    intents,
    sizes,
    props,
    tokens,
    visualStates,
    a11y,
    motion,
    privateTokens: privateTokens.length > 0 ? privateTokens : undefined,
    repeating: repeating.length > 0 ? repeating : undefined,
    events: spec.events,
    generics: spec.generics,
  };
}
