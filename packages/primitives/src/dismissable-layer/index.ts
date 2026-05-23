// Notifies an overlay's owner that the user wants to dismiss it: Escape key,
// or a pointer-down outside its element. Layers stack — `Escape` fires only
// on the topmost layer (one tap closes one layer); pointer-down-outside
// fires on every layer whose element does not contain the click target
// (one click outside a Popover-in-a-Modal closes both).
//
// Stacks and global listeners are scoped per `element.ownerDocument`, so an
// iframe-rendered layer is isolated from layers in the host document.
//
// This primitive only notifies. State management is the consumer's job —
// the callback is where the consumer sets `open = false` or equivalent.

/** Event seen by `onInteractOutside`. Currently a `PointerEvent`; widens to
 *  a union as additional outside-channels (focus, etc.) ship. Exported so
 *  consumers can name the type without binding to today's narrow shape. */
export type InteractOutsideEvent = PointerEvent;

export type DismissableLayerOptions = {
  /** Fires when Escape is pressed while this is the topmost layer. */
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  /** Fires when a pointer-down lands outside this layer's element. */
  onPointerDownOutside?: (event: PointerEvent) => void;
  /** Convenience: fires alongside every outside-pointer event today; will
   *  also cover focus-outside and any future channels as they're added. */
  onInteractOutside?: (event: InteractOutsideEvent) => void;
};

export type DismissableLayer = {
  destroy: () => void;
};

type LayerInstance = {
  element: HTMLElement;
  options: DismissableLayerOptions;
  destroyed: boolean;
};

type DocStack = {
  layers: LayerInstance[];
  keyDown: (event: KeyboardEvent) => void;
  pointerDown: (event: PointerEvent) => void;
};

// One stack + listener pair per document. A consumer rendering layers in an
// iframe gets a separate stack from the host page; events don't cross.
const stacks: Map<Document, DocStack> = new Map();

function getOrCreateStack(doc: Document): DocStack {
  const existing = stacks.get(doc);
  if (existing) return existing;

  const keyDown = (event: KeyboardEvent): void => {
    if (event.key !== "Escape") return;
    const s = stacks.get(doc);
    if (!s) return;
    const top = s.layers[s.layers.length - 1];
    if (!top) return;
    top.options.onEscapeKeyDown?.(event);
  };

  const pointerDown = (event: PointerEvent): void => {
    // composedPath() crosses Shadow DOM boundaries — event.target is retargeted
    // to the shadow host for listeners on document, so contains() would
    // misclassify a click inside a shadow-rooted layer as outside.
    const path = event.composedPath();
    if (path.length === 0) return;
    const s = stacks.get(doc);
    if (!s) return;
    // Snapshot so a callback that destroys a layer doesn't perturb iteration.
    const snapshot = [...s.layers];
    for (const layer of snapshot) {
      if (layer.destroyed) continue;
      if (path.includes(layer.element)) continue;
      layer.options.onPointerDownOutside?.(event);
      layer.options.onInteractOutside?.(event);
    }
  };

  const stack: DocStack = { layers: [], keyDown, pointerDown };
  stacks.set(doc, stack);
  return stack;
}

function attachListenersIfFirst(doc: Document, stack: DocStack): void {
  if (stack.layers.length !== 1) return;
  // Capture phase on both: a component inside the layer that calls
  // `stopPropagation()` on Escape or pointerdown must not suppress dismissal.
  // Matches focus-trap's capture-phase listener pattern.
  doc.addEventListener("keydown", stack.keyDown, true);
  doc.addEventListener("pointerdown", stack.pointerDown, true);
}

function detachListenersIfEmpty(doc: Document, stack: DocStack): void {
  if (stack.layers.length !== 0) return;
  doc.removeEventListener("keydown", stack.keyDown, true);
  doc.removeEventListener("pointerdown", stack.pointerDown, true);
  stacks.delete(doc);
}

/**
 * Subscribes a dismiss-notifying layer for `element`. Returns `{ destroy }`
 * which removes the layer from its document's stack and detaches that
 * document's listeners when the stack empties. `destroy` is idempotent.
 *
 * Throws when `element.ownerDocument` is unavailable (SSR / non-browser /
 * detached element) so consumers get a deterministic error instead of a
 * bare `ReferenceError`.
 *
 * The layer does not close itself — wire the callbacks to whatever state
 * controls the overlay's visibility.
 */
export function createDismissableLayer(
  element: HTMLElement,
  options: DismissableLayerOptions = {},
): DismissableLayer {
  const doc = element.ownerDocument;
  if (!doc) {
    throw new Error(
      "createDismissableLayer: `element.ownerDocument` is unavailable — primitives need a live DOM",
    );
  }
  const stack = getOrCreateStack(doc);
  const instance: LayerInstance = { element, options, destroyed: false };
  stack.layers.push(instance);
  attachListenersIfFirst(doc, stack);

  return {
    destroy(): void {
      if (instance.destroyed) return;
      instance.destroyed = true;
      const index = stack.layers.indexOf(instance);
      if (index !== -1) stack.layers.splice(index, 1);
      detachListenersIfEmpty(doc, stack);
    },
  };
}
