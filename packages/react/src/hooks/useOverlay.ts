import { warnOnce } from "@teseor/primitives";
import { useDismissableLayer } from "@teseor/primitives/react";
import { type Ref, useCallback, useEffect, useId, useRef, useState } from "react";
import { isActiveAt, type Responsive, useActiveBreakpoint } from "../_runtime.ts";

/**
 * One declarative rule wiring an input event to an overlay state transition.
 * Generated from a spec's `interactions:` block; consumers usually pass the
 * memoized array straight through to `useOverlay`.
 */
export type OverlayInteraction = {
  on: { event: string; target?: string; key?: string };
  do: "open" | "close" | "toggle";
  /** ms delay resolved at the call site from the consumer's delay props. */
  delayMs?: number;
  when?: string;
};

/** Inputs to {@link useOverlay}. Identity of `interactions` should be stable across renders. */
export type OverlayConfig = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  anchorVar: string;
  popoverMode: "auto" | "manual" | "hint";
  interactions: ReadonlyArray<OverlayInteraction>;
  /** Active at the current breakpoint? state machine no-ops; matches CSS `data-disabled-bp`. */
  disabled?: Responsive<boolean>;
};

type AnyEventHandler = (event: unknown) => void;

type OverlayHandlers = Record<string, AnyEventHandler>;

/** Return shape from {@link useOverlay}. Spread `triggerHandlers` on the trigger element. */
export type OverlayReturn<T extends HTMLElement> = {
  open: boolean;
  state: "open" | "closed";
  activeBp: ReturnType<typeof useActiveBreakpoint>;
  setOpen: (next: boolean) => void;
  anchorName: string;
  anchorVar: string;
  popoverId: string;
  popoverMode: "auto" | "manual" | "hint";
  contentRef: Ref<T>;
  triggerHandlers: OverlayHandlers;
};

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "");
}

// `:popover-open` throws SyntaxError on engines that don't recognize it; probe once.
const SUPPORTS_POPOVER_OPEN_SELECTOR =
  typeof CSS !== "undefined" &&
  typeof CSS.supports === "function" &&
  CSS.supports("selector(:popover-open)");

function popoverIsOpen(node: HTMLElement): boolean | undefined {
  if (!SUPPORTS_POPOVER_OPEN_SELECTOR) return undefined;
  try {
    return node.matches(":popover-open");
  } catch {
    return undefined;
  }
}

const EVENT_TO_HANDLER: Record<string, string> = {
  pointerenter: "onPointerEnter",
  pointerleave: "onPointerLeave",
  pointerdown: "onPointerDown",
  pointerup: "onPointerUp",
  click: "onClick",
  focusin: "onFocus",
  focusout: "onBlur",
  keydown: "onKeyDown",
  keyup: "onKeyUp",
};

/**
 * State machine + Popover API toggle + anchor binding + event wiring for
 * overlay composites (Tooltip today; future Popover, Menu, Dropdown).
 *
 * Resolves controlled vs uncontrolled mode per render, drives `showPopover` /
 * `hidePopover` on the tracked content node, and attaches trigger and
 * document/window listeners declared in `interactions`.
 *
 * `disabled` gating is asymmetric on purpose. The trigger-handler `schedule()`
 * path is gated — open/close/toggle no-ops when the `disabled` Responsive
 * cascade resolves true at the active breakpoint. The dismissable-layer path
 * (Escape and outside-pointer) is unconditional, because a stuck-open overlay
 * with no Escape route is worse than the inconsistency. A consumer who needs
 * dismissal suppressed while disabled should drive the overlay in controlled
 * mode and override `onOpenChange`.
 */
export function useOverlay<T extends HTMLElement = HTMLElement>(
  config: OverlayConfig,
): OverlayReturn<T> {
  const {
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    anchorVar,
    popoverMode,
    interactions,
    disabled,
  } = config;
  const activeBp = useActiveBreakpoint();
  const isDisabled = isActiveAt(disabled, activeBp);

  const controlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState<boolean>(defaultOpen);
  const open = controlled ? Boolean(openProp) : internalOpen;
  const onOpenChangeRef = useRef(onOpenChange);
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  const setOpen = useCallback(
    (next: boolean) => {
      if (!controlled) setInternalOpen(next);
      onOpenChangeRef.current?.(next);
    },
    [controlled],
  );

  const rawId = useId();
  const idCore = sanitizeId(rawId);
  const anchorName = `--t-${idCore}`;
  const popoverId = `t-overlay-${idCore}`;

  // Callback ref + tracked node so the popover-sync effect re-runs when the
  // floating element mounts later (e.g. `{hasContent && <…/>}` flips true
  // while `open` is already true). A plain `useRef` wouldn't notify React.
  const [contentNode, setContentNode] = useState<T | null>(null);
  const contentRef = useCallback((node: T | null) => {
    setContentNode(node);
  }, []);

  const timersRef = useRef<{ open: number; close: number }>({ open: 0, close: 0 });
  const clearTimers = useCallback(() => {
    if (timersRef.current.open) window.clearTimeout(timersRef.current.open);
    if (timersRef.current.close) window.clearTimeout(timersRef.current.close);
    timersRef.current.open = 0;
    timersRef.current.close = 0;
  }, []);

  // `openRef` lets effect-bound handlers read latest state without re-binding.
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const schedule = useCallback(
    (action: "open" | "close" | "toggle", delayMs: number) => {
      if (isDisabled) return;
      clearTimers();
      const next = action === "toggle" ? !openRef.current : action === "open";
      if (delayMs <= 0) {
        setOpen(next);
        return;
      }
      const slot: "open" | "close" = action === "close" ? "close" : "open";
      timersRef.current[slot] = window.setTimeout(() => setOpen(next), delayMs);
    },
    [clearTimers, setOpen, isDisabled],
  );

  useEffect(() => () => clearTimers(), [clearTimers]);

  // Drive Popover API from `open` + the tracked node. Re-runs when either
  // changes — handles "node mounts later while open is already true."
  useEffect(() => {
    if (!contentNode) return;
    const popoverState = popoverIsOpen(contentNode);
    if (open && popoverState !== true) {
      try {
        contentNode.showPopover();
      } catch (err) {
        warnOnce(
          "react.overlay.show-popover-failed",
          `useOverlay: showPopover() failed on <${contentNode.tagName.toLowerCase()}>. Popover API may be unsupported (Baseline 2026) or the element is display:none. Underlying error: ${err}`,
        );
      }
    } else if (!open && popoverState !== false) {
      try {
        contentNode.hidePopover();
      } catch (err) {
        warnOnce(
          "react.overlay.hide-popover-failed",
          `useOverlay: hidePopover() failed on <${contentNode.tagName.toLowerCase()}>. Popover API may be unsupported (Baseline 2026). Underlying error: ${err}`,
        );
      }
    }
  }, [open, contentNode]);

  // Participate in the per-ownerDocument dismissable-layer stack. Escape fires
  // only when this layer is topmost; pointer-down outside the content element
  // closes this layer.
  useDismissableLayer(contentNode, open, {
    onEscapeKeyDown: () => setOpen(false),
    onPointerDownOutside: () => setOpen(false),
  });

  // Document/window-bound rules. Listeners mount with the rules array;
  // `when:` is re-evaluated per fire via `openRef`.
  useEffect(() => {
    const cleanups: Array<() => void> = [];
    for (const rule of interactions) {
      const target = rule.on.target;
      if (target !== "document" && target !== "window") continue;
      const sink: EventTarget = target === "document" ? document : window;
      const handler = (event: Event) => {
        if (rule.when === "open" && !openRef.current) return;
        if (rule.on.key && event instanceof KeyboardEvent && event.key !== rule.on.key) return;
        schedule(rule.do, rule.delayMs ?? 0);
      };
      sink.addEventListener(rule.on.event, handler);
      cleanups.push(() => sink.removeEventListener(rule.on.event, handler));
    }
    return () => {
      for (const fn of cleanups) fn();
    };
  }, [interactions, schedule]);

  // Trigger-bound rules → React handlers spread on the wrapper element.
  // Same-event rules compose; `when` and `on.key` filter per-fire as above.
  const triggerHandlers: OverlayHandlers = {};
  for (const rule of interactions) {
    if (rule.on.target !== "trigger") continue;
    const handlerName = EVENT_TO_HANDLER[rule.on.event];
    if (!handlerName) continue;
    const previous = triggerHandlers[handlerName];
    const delayMs = rule.delayMs ?? 0;
    const next = (e: unknown) => {
      previous?.(e);
      if (rule.when === "open" && !openRef.current) return;
      if (rule.on.key) {
        // React passes a SyntheticEvent (not a native KeyboardEvent), so
        // `instanceof KeyboardEvent` is always false here. Duck-type on
        // `.key` — works for both React synthetic and native events.
        const key = (e as { key?: string } | null)?.key;
        if (key !== rule.on.key) return;
      }
      schedule(rule.do, delayMs);
    };
    triggerHandlers[handlerName] = next;
  }

  return {
    open,
    state: open ? "open" : "closed",
    activeBp,
    setOpen,
    anchorName,
    anchorVar,
    popoverId,
    popoverMode,
    contentRef,
    triggerHandlers,
  };
}
