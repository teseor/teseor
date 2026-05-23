// Notifies an overlay's owner that the user wants to dismiss it: Escape key,
// or a pointer-down outside its element. Layers stack — `Escape` fires only
// on the topmost layer (one tap closes one layer); pointer-down-outside
// fires on every layer whose element does not contain the click target
// (one click outside a Popover-in-a-Modal closes both).
//
// This primitive only notifies. State management is the consumer's job —
// the callback is where the consumer sets `open = false` or equivalent.

export type DismissableLayerOptions = {
  /** Fires when Escape is pressed while this is the topmost layer. */
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  /** Fires when a pointer-down lands outside this layer's element. */
  onPointerDownOutside?: (event: PointerEvent) => void;
  /** Convenience: fires alongside any outside-pointer event. */
  onInteractOutside?: (event: PointerEvent) => void;
};

export type DismissableLayer = {
  destroy: () => void;
};

type LayerInstance = {
  element: HTMLElement;
  options: DismissableLayerOptions;
  destroyed: boolean;
};

const stack: LayerInstance[] = [];

function handleKeyDown(event: KeyboardEvent): void {
  if (event.key !== "Escape") return;
  const top = stack[stack.length - 1];
  if (!top) return;
  top.options.onEscapeKeyDown?.(event);
}

function handlePointerDown(event: PointerEvent): void {
  const target = event.target;
  if (!(target instanceof Node)) return;
  // Snapshot so a callback that destroys a layer doesn't perturb iteration.
  const snapshot = [...stack];
  for (const layer of snapshot) {
    if (layer.destroyed) continue;
    if (layer.element.contains(target)) continue;
    layer.options.onPointerDownOutside?.(event);
    layer.options.onInteractOutside?.(event);
  }
}

function ensureGlobalListeners(): void {
  if (stack.length !== 1) return;
  // Capture phase on both: a component inside the layer that calls
  // `stopPropagation()` on Escape or pointerdown must not suppress dismissal.
  // Matches focus-trap's capture-phase listener pattern.
  document.addEventListener("keydown", handleKeyDown, true);
  document.addEventListener("pointerdown", handlePointerDown, true);
}

function teardownGlobalListenersIfEmpty(): void {
  if (stack.length !== 0) return;
  document.removeEventListener("keydown", handleKeyDown, true);
  document.removeEventListener("pointerdown", handlePointerDown, true);
}

/**
 * Subscribes a dismiss-notifying layer for `element`. Returns `{ destroy }`
 * which removes the layer from the stack and detaches global listeners when
 * the stack empties. `destroy` is idempotent.
 *
 * The layer does not close itself — wire the callbacks to whatever state
 * controls the overlay's visibility.
 */
export function createDismissableLayer(
  element: HTMLElement,
  options: DismissableLayerOptions = {},
): DismissableLayer {
  const instance: LayerInstance = { element, options, destroyed: false };
  stack.push(instance);
  ensureGlobalListeners();

  return {
    destroy(): void {
      if (instance.destroyed) return;
      instance.destroyed = true;
      const index = stack.indexOf(instance);
      if (index !== -1) stack.splice(index, 1);
      teardownGlobalListenersIfEmpty();
    },
  };
}
