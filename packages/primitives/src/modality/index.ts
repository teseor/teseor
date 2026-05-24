// Modal-overlay coordination: sets `inert=""` on every direct `<body>` child
// whose subtree does not contain the activated element. Restored on deactivate.
// Stacked per `ownerDocument` — only the topmost scope's wants apply, so the
// inert state is recomputed from the stack on every push/pop (the deactivation
// order does not have to match activation order). Pre-existing `inert`
// attributes are sampled on first activation and never touched.
// DOM only — compose with `focus-trap` + `dismissable-layer` for the full modal.
import { warnOnce } from "../warn-once/index.ts";

/** No options today; kept for signature stability. */
export type ModalityScopeOptions = Record<string, never>;

export type ModalityScope = {
  activate: () => void;
  deactivate: () => void;
};

type ScopeInstance = {
  element: HTMLElement;
  active: boolean;
};

type DocStack = {
  scopes: ScopeInstance[];
  /** Body children that had inert BEFORE any scope activated; never touched. */
  authorInert: WeakSet<HTMLElement>;
  /** Body children this stack currently holds inert on (the topmost scope's wants). */
  ours: Set<HTMLElement>;
};

// One stack per ownerDocument — iframes get their own stack, no leakage.
const stacks: Map<Document, DocStack> = new Map();

/** Test-only: drops every doc stack so a fresh test starts from a clean state. */
export function resetModalityScopesForTests(): void {
  stacks.clear();
}

function isSupported(): boolean {
  // `inert` is an `HTMLElement` IDL attribute, not `Element`.
  return "inert" in HTMLElement.prototype;
}

function getOrCreateStack(doc: Document): DocStack {
  const existing = stacks.get(doc);
  if (existing) return existing;
  const stack: DocStack = { scopes: [], authorInert: new WeakSet(), ours: new Set() };
  stacks.set(doc, stack);
  return stack;
}

function snapshotAuthorInert(stack: DocStack, doc: Document): void {
  // Snapshot only on the first activation; subsequent activations keep the
  // initial author-inert set so we never claim/revoke author-owned attributes.
  if (stack.scopes.length !== 0) return;
  const body = doc.body;
  if (!body) return;
  for (const child of Array.from(body.children)) {
    if (child instanceof HTMLElement && child.hasAttribute("inert")) {
      stack.authorInert.add(child);
    }
  }
}

function reconcile(stack: DocStack, doc: Document): void {
  const body = doc.body;
  if (!body) return;

  // Pre-pass: detect any inert we don't already own. The consumer (or another
  // library) may have added inert on a body-child between reconciles; without
  // this pass we'd later claim it as ours and strip it on the next reconcile.
  for (const child of Array.from(body.children)) {
    if (!(child instanceof HTMLElement)) continue;
    if (stack.ours.has(child)) continue;
    if (child.hasAttribute("inert")) stack.authorInert.add(child);
  }

  // Strip what we set previously; the new top scope (if any) re-asserts.
  for (const child of stack.ours) {
    child.removeAttribute("inert");
  }
  stack.ours.clear();

  const top = stack.scopes[stack.scopes.length - 1];
  if (!top) return;

  for (const child of Array.from(body.children)) {
    if (!(child instanceof HTMLElement)) continue;
    if (child.contains(top.element)) continue; // top's container — reachable.
    if (stack.authorInert.has(child)) continue; // author-owned — leave alone.
    child.setAttribute("inert", "");
    stack.ours.add(child);
  }
}

/**
 * Subscribes a modality scope for `element`. Returns `{ activate, deactivate }`
 * — activate makes this scope the topmost in its `ownerDocument` (inerting
 * every body-child whose subtree does not contain it); deactivate pops it,
 * after which the next-topmost scope's wants apply, or the page returns to
 * its pre-stack state if none remains. Both are idempotent. Throws when
 * `element.ownerDocument` is unavailable (detached element / non-browser).
 */
export function createModalityScope(
  element: HTMLElement,
  _options: ModalityScopeOptions = {},
): ModalityScope {
  const doc = element.ownerDocument;
  if (!doc) {
    throw new Error(
      "createModalityScope: `element.ownerDocument` is unavailable — primitives need a live DOM",
    );
  }
  const supported = isSupported();
  const instance: ScopeInstance = { element, active: false };

  return {
    activate(): void {
      if (instance.active) return;
      if (!supported) {
        warnOnce(
          "primitives.modality.unsupported",
          "createModalityScope: this browser does not implement `inert`; modality cascade is a no-op",
        );
        instance.active = true;
        return;
      }
      instance.active = true;
      const stack = getOrCreateStack(doc);
      snapshotAuthorInert(stack, doc);
      stack.scopes.push(instance);
      reconcile(stack, doc);
    },
    deactivate(): void {
      if (!instance.active) return;
      instance.active = false;
      if (!supported) return;
      const stack = stacks.get(doc);
      if (!stack) return;
      const idx = stack.scopes.indexOf(instance);
      if (idx !== -1) stack.scopes.splice(idx, 1);
      reconcile(stack, doc);
      if (stack.scopes.length === 0 && stack.ours.size === 0) {
        stacks.delete(doc);
      }
    },
  };
}
