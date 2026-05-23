// Appends a container to a target node so content can render outside its
// natural DOM hierarchy. Vanilla DOM only — React consumers use
// `createPortal` from `react-dom`; Vue consumers use the built-in
// `<Teleport>`. This vanilla layer exists for `@teseor/webc` and plain-DOM
// consumers (Astro islands, server-rendered pages, etc.).

export type PortalOptions = {
  /** Where to attach the portal container. Default: `document.body`. */
  target?: HTMLElement;
  /** Use this element as the portal container instead of creating a fresh `<div>`. */
  container?: HTMLElement;
};

export type Portal = {
  /** The element holding portal contents. Append your nodes here. */
  container: HTMLElement;
  /** Detaches and removes the container from the DOM. Idempotent. */
  unmount: () => void;
};

/**
 * Creates a DOM container and attaches it to `target` (default
 * `document.body`). Returns the container plus an `unmount` cleanup. If
 * `container` is provided it is used as-is; otherwise a fresh `<div>` is
 * created. Calling `unmount` more than once is a no-op.
 */
export function createPortal(options: PortalOptions = {}): Portal {
  const target = options.target ?? document.body;
  const container = options.container ?? document.createElement("div");
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
