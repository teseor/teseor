// Appends a container to a target node so content can render outside its
// natural DOM hierarchy. Vanilla DOM only — React consumers use
// `createPortal` from `react-dom`; Vue consumers use the built-in
// `<Teleport>`. This vanilla layer exists for `@teseor/webc` and plain-DOM
// consumers (Astro islands, server-rendered pages, etc.).

export type PortalOptions = {
  /** Where to attach the portal container. Default: `document.body`.
   *  Accepts any append-capable parent — `Element`, `ShadowRoot`,
   *  `DocumentFragment`. */
  target?: Element | DocumentFragment;
  /** Use this element as the portal container instead of creating a fresh `<div>`. */
  container?: HTMLElement;
};

export type Portal = {
  /** The element holding portal contents. Append your nodes here. */
  container: HTMLElement;
  /** Detaches and removes the container from the DOM. Idempotent. */
  unmount: () => void;
};

function resolveTarget(
  explicit: Element | DocumentFragment | undefined,
): Element | DocumentFragment {
  if (explicit) return explicit;
  // `document.body` is typed `HTMLElement` but can be null at runtime — early
  // scripts loaded before `<body>`, non-browser DOM contexts, certain test
  // harnesses. Throw a clear message instead of letting `appendChild` blow up.
  if (typeof document === "undefined" || !document.body) {
    throw new Error("createPortal: no `target` provided and `document.body` is unavailable");
  }
  return document.body;
}

/**
 * Creates a DOM container and attaches it to `target` (default
 * `document.body`). Returns the container plus an `unmount` cleanup. If
 * `container` is provided it is used as-is; otherwise a fresh `<div>` is
 * created in the target's `ownerDocument` (so a target inside an iframe
 * yields a container belonging to that iframe's document). Calling
 * `unmount` more than once is a no-op. Throws when no explicit target is
 * given and `document.body` is unavailable, or when a default container
 * is needed but the target has no `ownerDocument`.
 */
export function createPortal(options: PortalOptions = {}): Portal {
  const target = resolveTarget(options.target);
  let container: HTMLElement;
  if (options.container) {
    container = options.container;
  } else {
    // Use the target's ownerDocument so a portal placed in an iframe's DOM
    // gets a container that belongs to that iframe — `document.createElement`
    // here would silently cross documents.
    const doc = target.ownerDocument;
    if (!doc) {
      throw new Error(
        "createPortal: target has no `ownerDocument` and no `container` was provided",
      );
    }
    container = doc.createElement("div");
  }
  target.appendChild(container);
  let mounted = true;
  return {
    container,
    unmount(): void {
      if (!mounted) return;
      container.remove();
      mounted = false;
    },
  };
}
