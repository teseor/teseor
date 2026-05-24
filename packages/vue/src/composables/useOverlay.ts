import { warnOnce } from "@teseor/primitives";
import { useDismissableLayer } from "@teseor/primitives/vue";
import {
  computed,
  onBeforeUnmount,
  onMounted,
  type Ref,
  ref,
  type ShallowRef,
  shallowRef,
  useId,
  watch,
} from "vue";
import { isActiveAt, useActiveBreakpoint } from "../_runtime.ts";

/**
 * One declarative rule wiring an input event to an overlay state transition.
 * Generated from a spec's `interactions:` block; consumers usually pass the
 * memoized array straight through to `useOverlay`.
 */
export type OverlayInteraction = {
  on: { event: string; target?: string; key?: string };
  do: "open" | "close" | "toggle";
  /** Number or reactive getter — Vue's setup runs once, so re-read on fire. */
  delayMs?: number | (() => number);
  when?: string;
};

/** Inputs to {@link useOverlay}. Reactive sources are passed as getters since setup runs once. */
export type OverlayConfig = {
  /** Getter for the controlled prop (setup runs once; re-read each render). */
  open?: () => boolean | undefined;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  anchorVar: string;
  popoverMode: "auto" | "manual" | "hint";
  interactions: ReadonlyArray<OverlayInteraction>;
  /** Getter for `Responsive<boolean>`; gated against the active breakpoint. */
  disabled?: () => unknown;
};

type OverlayHandlers = Record<string, (event: Event) => void>;

/** Return shape from {@link useOverlay}. Spread `triggerHandlers` on the trigger element. */
export type OverlayReturn = {
  open: Readonly<Ref<boolean>>;
  state: Readonly<Ref<"open" | "closed">>;
  activeBp: ReturnType<typeof useActiveBreakpoint>;
  setOpen: (next: boolean) => void;
  anchorName: string;
  anchorVar: string;
  popoverId: string;
  popoverMode: "auto" | "manual" | "hint";
  contentRef: ShallowRef<HTMLElement | null>;
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

/**
 * State machine + Popover API toggle + anchor binding + event wiring for
 * overlay composites (Tooltip today; future Popover, Menu, Dropdown).
 *
 * Resolves controlled vs uncontrolled mode by reading `config.open?.()` each
 * render, drives `showPopover` / `hidePopover` on the tracked content node,
 * attaches trigger and document/window listeners declared in `interactions`,
 * and no-ops when the `disabled` getter resolves truthy at the active breakpoint.
 */
export function useOverlay(config: OverlayConfig): OverlayReturn {
  const internalOpen = ref<boolean>(config.defaultOpen ?? false);
  const open = computed<boolean>(() => {
    const fromProp = config.open?.();
    return fromProp !== undefined ? fromProp : internalOpen.value;
  });

  const activeBp = useActiveBreakpoint();

  const setOpen = (next: boolean) => {
    const fromProp = config.open?.();
    if (fromProp === undefined) internalOpen.value = next;
    config.onOpenChange?.(next);
  };

  const idCore = sanitizeId(useId());
  const anchorName = `--t-${idCore}`;
  const popoverId = `t-overlay-${idCore}`;

  const contentRef = shallowRef<HTMLElement | null>(null);

  let openTimer = 0;
  let closeTimer = 0;
  const clearTimers = () => {
    if (openTimer) window.clearTimeout(openTimer);
    if (closeTimer) window.clearTimeout(closeTimer);
    openTimer = 0;
    closeTimer = 0;
  };

  const schedule = (action: "open" | "close" | "toggle", delayMs: number) => {
    if (isActiveAt(config.disabled?.(), activeBp.value)) return;
    clearTimers();
    const next = action === "toggle" ? !open.value : action === "open";
    if (delayMs <= 0) {
      setOpen(next);
      return;
    }
    if (action === "close") {
      closeTimer = window.setTimeout(() => setOpen(next), delayMs);
    } else {
      openTimer = window.setTimeout(() => setOpen(next), delayMs);
    }
  };

  onBeforeUnmount(() => clearTimers());

  // Drive Popover API from `open` AND the content node. Watching both
  // handles "node mounts later while open is already true" (e.g. `v-if` on
  // the floating element flipping true). `flush: 'post'` waits for DOM.
  watch(
    [open, contentRef] as const,
    ([current, node]) => {
      if (!node) return;
      const popoverState = popoverIsOpen(node);
      if (current && popoverState !== true) {
        try {
          node.showPopover();
        } catch (err) {
          warnOnce(
            "vue.overlay.show-popover-failed",
            `useOverlay: showPopover() failed on <${node.tagName.toLowerCase()}>. Popover API may be unsupported (Baseline 2026) or the element is display:none. Underlying error: ${err}`,
          );
        }
      } else if (!current && popoverState !== false) {
        try {
          node.hidePopover();
        } catch (err) {
          warnOnce(
            "vue.overlay.hide-popover-failed",
            `useOverlay: hidePopover() failed on <${node.tagName.toLowerCase()}>. Popover API may be unsupported (Baseline 2026). Underlying error: ${err}`,
          );
        }
      }
    },
    { immediate: true, flush: "post" },
  );

  // Per-ownerDocument dismissable-layer stack participation (React parallel in
  // packages/react/src/hooks/useOverlay.ts).
  useDismissableLayer(contentRef, computed(() => open.value), {
    onEscapeKeyDown: () => setOpen(false),
    onPointerDownOutside: () => setOpen(false),
  });

  // Re-read getter-form delays per fire (latest prop value).
  const resolveDelay = (d: number | (() => number) | undefined): number => {
    if (d === undefined) return 0;
    return typeof d === "function" ? d() : d;
  };

  // Document/window-bound rules. Mount/unmount with the composable.
  const cleanups: Array<() => void> = [];
  onMounted(() => {
    for (const rule of config.interactions) {
      const target = rule.on.target;
      if (target !== "document" && target !== "window") continue;
      const sink: EventTarget = target === "document" ? document : window;
      const handler = (event: Event) => {
        if (rule.when === "open" && !open.value) return;
        if (rule.on.key && event instanceof KeyboardEvent && event.key !== rule.on.key) return;
        schedule(rule.do, resolveDelay(rule.delayMs));
      };
      sink.addEventListener(rule.on.event, handler);
      cleanups.push(() => sink.removeEventListener(rule.on.event, handler));
    }
  });
  onBeforeUnmount(() => {
    for (const fn of cleanups) fn();
  });

  // Trigger-bound rules → handlers spread via `v-on`. Bare event names.
  // Same-event rules compose; `when` and `on.key` filter per-fire as above.
  const triggerHandlers: OverlayHandlers = {};
  for (const rule of config.interactions) {
    if (rule.on.target !== "trigger") continue;
    const eventName = rule.on.event;
    const previous = triggerHandlers[eventName];
    triggerHandlers[eventName] = (event: Event) => {
      previous?.(event);
      if (rule.when === "open" && !open.value) return;
      if (rule.on.key) {
        if (!(event instanceof KeyboardEvent) || event.key !== rule.on.key) return;
      }
      schedule(rule.do, resolveDelay(rule.delayMs));
    };
  }

  const state = computed<"open" | "closed">(() => (open.value ? "open" : "closed"));

  return {
    open,
    state,
    activeBp,
    setOpen,
    anchorName,
    anchorVar: config.anchorVar,
    popoverId,
    popoverMode: config.popoverMode,
    contentRef,
    triggerHandlers,
  };
}
