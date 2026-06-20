import type { SpecPart } from "../schema.ts";
import type { FlatSpec } from "./flatten.ts";

export type CompositeShapeOptions = {
  emitterLabel: string;
  separateMissingPartErrors: boolean;
  forbidContentFromChildren: boolean;
};

export type OverlayShape = {
  anchor: string;
  anchorVar: string;
  mode: "auto" | "manual" | "hint";
  modal: boolean;
};

export type CompositeShape = {
  overlaySpec: OverlayShape;
  triggerPart: SpecPart;
  contentPart: SpecPart;
  /** The part name that declared `overlay:` — replaces the old root-block
   *  `overlay.floating` field. */
  contentPartName: string;
  triggerClass: string;
  contentClass: string;
  contentElement: string;
  contentRole: string | undefined;
};

/**
 * Resolve the overlay-with-anchor shape from a composite spec. Finds the part
 * declaring `overlay:` (the floating element) and looks up the named anchor
 * sibling, returning the derived classes / element / role both composite
 * emitters need.
 */
export function extractCompositeShape(spec: FlatSpec, opts: CompositeShapeOptions): CompositeShape {
  const parts = spec.parts ?? {};

  let contentPartName: string | undefined;
  let contentPart: SpecPart | undefined;
  for (const [name, part] of Object.entries(parts)) {
    if (part.overlay) {
      if (contentPart !== undefined) {
        throw new Error(`composite spec '${spec.name}' declares 'overlay:' on more than one part`);
      }
      contentPartName = name;
      contentPart = part;
    }
  }
  if (!contentPart || !contentPartName || !contentPart.overlay) {
    throw new Error(
      `composite spec '${spec.name}' must declare 'overlay:' on a part (${opts.emitterLabel})`,
    );
  }
  const overlaySpec: OverlayShape = contentPart.overlay;

  const triggerPart = parts[overlaySpec.anchor];
  if (opts.separateMissingPartErrors) {
    if (!triggerPart) {
      throw new Error(`overlay.anchor '${overlaySpec.anchor}' is not a declared part`);
    }
  } else if (!triggerPart) {
    throw new Error(`overlay.anchor '${overlaySpec.anchor}' is not a declared part`);
  }
  if (triggerPart.fromChildren !== true) {
    throw new Error(
      `overlay.anchor '${overlaySpec.anchor}' must declare 'fromChildren: true' (${opts.emitterLabel})`,
    );
  }
  if (opts.forbidContentFromChildren && contentPart.fromChildren === true) {
    throw new Error(
      `the overlay-declaring part '${contentPartName}' cannot also declare 'fromChildren: true'`,
    );
  }

  const triggerClass = triggerPart.rootClass ?? `t-${spec.name}-trigger`;
  const contentClass = contentPart.rootClass ?? `t-${spec.name}`;
  const contentElement = contentPart.element ?? "div";
  const contentRole = contentPart.a11y?.role;

  return {
    overlaySpec,
    triggerPart,
    contentPart,
    contentPartName,
    triggerClass,
    contentClass,
    contentElement,
    contentRole,
  };
}

/**
 * Project a part's `states:` block into the flat `{ on, do, delay, when }`
 * rules the `useOverlay` runtime consumes — runtime-side equivalence with
 * the new part-machine shape.
 */
export type LegacyInteraction = {
  on: { event: string; target?: string; key?: string };
  do: "open" | "close" | "toggle";
  delay?: string;
  when?: string;
};

export function legacyInteractionsFromStates(part: SpecPart): LegacyInteraction[] {
  const states = part.states;
  if (!states) return [];

  // Group transitions by source key so the projection can detect mutually-
  // inverse pairs (closed.k → open + open.k → closed) and emit a single
  // `do: "toggle"` rather than two competing rules. `useOverlay` treats
  // interactions as a flat list — two same-source rules with `do: "open"` /
  // `do: "close"` both fire on every dispatch, netting closed.
  type Entry = {
    fromState: string;
    to: string;
    after?: string;
    when?: string;
  };
  const bySource = new Map<string, Entry[]>();
  const stateNames = Object.keys(states);
  const initial = stateNames[0];

  for (const [stateName, stateDef] of Object.entries(states)) {
    for (const [sourceKey, target] of Object.entries(stateDef.on)) {
      const normalized = normalizeTarget(target);
      const entry: Entry = {
        fromState: stateName,
        to: normalized.to,
      };
      if (normalized.after !== undefined) entry.after = normalized.after;
      if (normalized.when !== undefined) entry.when = normalized.when;
      const list = bySource.get(sourceKey) ?? [];
      list.push(entry);
      bySource.set(sourceKey, list);
    }
  }

  const out: LegacyInteraction[] = [];
  for (const [sourceKey, entries] of bySource) {
    const { event, partTarget, keyName } = parseSourceKey(sourceKey);
    const buildOn = (): LegacyInteraction["on"] =>
      keyName !== undefined
        ? { event, key: keyName }
        : partTarget !== undefined
          ? { event, target: partTarget }
          : { event };

    // Inverse-pair detection: exactly two entries, each one's `from` matches
    // the other's `to`. Same `after` / `when` on both sides keeps the
    // toggle semantically equivalent; differing modifiers fall back to
    // per-entry emission.
    if (entries.length === 2) {
      const [a, b] = entries as [Entry, Entry];
      const inverse = a.to === b.fromState && b.to === a.fromState;
      const modifiersAgree = a.after === b.after && a.when === b.when;
      if (inverse && modifiersAgree) {
        const rule: LegacyInteraction = { on: buildOn(), do: "toggle" };
        if (a.after !== undefined) rule.delay = a.after;
        if (a.when !== undefined) rule.when = a.when;
        out.push(rule);
        continue;
      }
    }

    for (const entry of entries) {
      const rule: LegacyInteraction = {
        on: buildOn(),
        do: resolveAction(entry.fromState, entry.to, initial),
      };
      if (entry.after !== undefined) rule.delay = entry.after;
      if (entry.when !== undefined) rule.when = entry.when;
      out.push(rule);
    }
  }
  return out;
}

function parseSourceKey(key: string): {
  event: string;
  partTarget?: string;
  keyName?: string;
} {
  const dot = key.indexOf(".");
  if (dot === -1) return { event: key };
  const prefix = key.slice(0, dot);
  const event = key.slice(dot + 1);
  if (prefix === "key") return { event: "keydown", keyName: event };
  if (prefix === "outside") return { event: `outside-${event}` };
  return { event, partTarget: prefix };
}

function normalizeTarget(target: string | { to: string; after?: string; when?: string }): {
  to: string;
  after?: string;
  when?: string;
} {
  if (typeof target === "string") return { to: target };
  return { to: target.to, after: target.after, when: target.when };
}

function resolveAction(
  fromState: string,
  toState: string,
  initial: string | undefined,
): "open" | "close" | "toggle" {
  // The runtime tracks one boolean (open/closed) for now. Leaving the initial
  // state moves to "open"; returning to the initial state is "close".
  if (toState === fromState) return "toggle";
  if (toState === initial) return "close";
  return "open";
}
