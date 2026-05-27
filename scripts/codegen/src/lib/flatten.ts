// Composite-to-atomic flattening for generators that were authored against
// the atomic spec shape. A composite spec's `parts:` map is walked once and
// every part's `props`, `tokens`, `states`, `a11y`, and `motion` blocks are
// merged into the root level. The generator then sees a single normalized
// object regardless of `kind:`.
//
// Each merged item carries `__part` (the originating part name) so generators
// that need to route attributes/handlers back to a specific part (gen-react,
// gen-vue) can do so. Generators that don't care (gen-contract, gen-docs)
// ignore it.
import type { Spec, SpecPart } from "../schema.ts";

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

/** One entry per repeating part — see RFC-0005. */
export type FlatRepeatingPart = {
  /** Originating part name (e.g. `page`). */
  partName: string;
  /** Final array prop name on the parent (e.g. `pages`). */
  propName: string;
  /** Per-item DOM emission. */
  element?: string;
  rootClass?: string;
  /** Per-item prop shape. Codegen synthesizes a required `id: string` on top. */
  itemProps: Record<string, FlatItemProp>;
};

export type FlatToken = {
  fallback: string;
  desc: string;
  __part: string;
};

export type FlatState = {
  description: string;
  __part: string;
};

export type FlatA11y = {
  role?: string;
  keyboard?: Record<string, string>;
  states?: Record<string, string>;
};

export type FlatMotion = {
  transitions?: string[];
  enters?: string[];
  exits?: string[];
};

export type FlatSpec = {
  name: string;
  description?: string;
  kind: "atomic" | "composite";
  cssFile?: string;
  behavior?: "none" | "primitive" | "stateful";
  primitives?: string[];
  dependencies?: string[];
  overlay?: NonNullable<Spec["overlay"]>;
  interactions?: NonNullable<Spec["interactions"]>;
  examples?: Spec["examples"];
  coverage?: Spec["coverage"];
  /** The originating composite parts, untouched, so generators that need
   *  per-part rendering (gen-react / gen-vue) can walk them directly. */
  parts?: Record<string, SpecPart>;
  /** Root-level element of an atomic spec; undefined for composite. */
  element?: string;
  /** Optional nested element wrapping slot content (e.g. `pre` + `code`). Atomic-only. */
  slotElement?: string;
  /** Root-level CSS class of an atomic spec; undefined for composite. */
  rootClass?: string;
  /** Atomic-only blocks; composite specs flatten variants/intents/sizes from
   *  whichever part declares them. Tooltip doesn't use them. */
  variants?: Record<string, { description: string }>;
  intents?: Record<string, { description: string; tokens?: Record<string, string> }>;
  sizes?: Record<string, { description: string; tokens?: Record<string, string> }>;
  /** Merged across all parts (composite) or the atomic root. */
  props: Record<string, FlatProp>;
  tokens: Record<string, FlatToken>;
  states: Record<string, FlatState>;
  a11y?: FlatA11y;
  motion?: FlatMotion;
  privateTokens?: string[];
  constraints?: Extract<Spec, { kind: "atomic" }>["constraints"];
  /** Repeating parts (RFC-0005). Composite-only; undefined when no part
   *  declares `repeating: true`. */
  repeating?: FlatRepeatingPart[];
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

/** Normalize a `Spec` (atomic or composite) into a flat shape generators
 *  can consume. Caller passes the parsed-and-validated spec union. */
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
    const states: Record<string, FlatState> = {};
    for (const [name, def] of Object.entries(spec.states ?? {})) {
      states[name] = { ...def, __part: "" };
    }
    return {
      name: spec.name,
      description: spec.description,
      kind: "atomic",
      cssFile: spec.cssFile,
      behavior: spec.behavior,
      primitives: spec.primitives,
      dependencies: spec.dependencies,
      examples: spec.examples,
      coverage: spec.coverage,
      element: spec.element,
      slotElement: spec.slotElement,
      rootClass: spec.rootClass,
      variants: spec.variants,
      intents: spec.intents,
      sizes: spec.sizes,
      props,
      tokens,
      states,
      a11y: spec.a11y,
      motion: spec.motion,
      privateTokens: spec.privateTokens,
      constraints: spec.constraints,
    };
  }

  // Composite: walk parts, merge. Token names that appear on more than one
  // part are namespaced by the full dotted path (`header.bg`, `body.content.bg`)
  // so nested-part collisions resolve too. Single-occurrence names stay bare,
  // so today's public slots (`--t-tooltip-bg`) aren't renamed.
  const props: Record<string, FlatProp> = {};
  const tokens: Record<string, FlatToken> = {};
  const states: Record<string, FlatState> = {};
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
      repeating.push({
        partName,
        propName: part.propName ?? `${partName}s`,
        element: part.element,
        rootClass: part.rootClass,
        itemProps,
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
    for (const [name, def] of Object.entries(part.states ?? {})) {
      if (states[name]) {
        throw new Error(
          `composite spec '${spec.name}' has a state name collision on '${name}' across parts`,
        );
      }
      states[name] = { ...def, __part: partName };
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
    behavior: spec.behavior,
    primitives: spec.primitives,
    dependencies: spec.dependencies,
    overlay: spec.overlay,
    interactions: spec.interactions,
    examples: spec.examples,
    coverage: spec.coverage,
    parts: spec.parts,
    variants,
    intents,
    sizes,
    props,
    tokens,
    states,
    a11y,
    motion,
    privateTokens: privateTokens.length > 0 ? privateTokens : undefined,
    repeating: repeating.length > 0 ? repeating : undefined,
  };
}
