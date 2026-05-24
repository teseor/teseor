// Modal-overlay coordination: sets `inert=""` on every direct `<body>` child
// whose subtree does not contain the activated element. Restored on deactivate.
// Stacked per `ownerDocument`; pre-existing `inert` is preserved.
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
  /** Body children this scope set inert on (so we restore exactly those). */
  affected: HTMLElement[];
  active: boolean;
};

type DocStack = { scopes: ScopeInstance[] };
// One stack per ownerDocument — iframes get their own stack, no leakage.
const stacks: Map<Document, DocStack> = new Map();

function isSupported(): boolean {
  // `inert` is an `HTMLElement` IDL attribute, not `Element`.
  return "inert" in HTMLElement.prototype;
}

function getOrCreateStack(doc: Document): DocStack {
  const existing = stacks.get(doc);
  if (existing) return existing;
  const stack: DocStack = { scopes: [] };
  stacks.set(doc, stack);
  return stack;
}

function applyInert(scope: ScopeInstance, doc: Document): void {
  const body = doc.body;
  if (!body) return;
  // Snapshot for mutation-safe iteration.
  for (const child of Array.from(body.children)) {
    if (!(child instanceof HTMLElement)) continue;
    if (child.contains(scope.element)) continue;
    // Skip pre-existing inert (author attribute or outer scope) — restore only touches what this scope set.
    if (child.hasAttribute("inert")) continue;
    child.setAttribute("inert", "");
    scope.affected.push(child);
  }
}

function restoreInert(scope: ScopeInstance): void {
  for (const el of scope.affected) {
    el.removeAttribute("inert");
  }
  scope.affected = [];
}

/**
 * Subscribes a modality scope for `element`. Returns `{ activate, deactivate }`
 * — activate sets `inert` on non-containing body children; deactivate restores
 * exactly those. Both are idempotent. Throws when `element.ownerDocument` is
 * unavailable (detached element / non-browser host).
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
  const instance: ScopeInstance = { element, affected: [], active: false };

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
      stack.scopes.push(instance);
      applyInert(instance, doc);
    },
    deactivate(): void {
      if (!instance.active) return;
      instance.active = false;
      if (!supported) return;
      restoreInert(instance);
      const stack = stacks.get(doc);
      if (!stack) return;
      const idx = stack.scopes.indexOf(instance);
      if (idx !== -1) stack.scopes.splice(idx, 1);
      if (stack.scopes.length === 0) stacks.delete(doc);
    },
  };
}
