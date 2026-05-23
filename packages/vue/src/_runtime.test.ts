// @vitest-environment happy-dom
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type App,
  type Component,
  createApp,
  defineComponent,
  Fragment,
  h,
  nextTick,
  ref,
  type Ref,
} from "vue";
import {
  installDomPolyfills,
  isPopoverShown,
  resetDomPolyfills,
  setMatchingMediaQueries,
  setSupportsPopoverOpenSelector,
  uninstallDomPolyfills,
} from "@teseor/test-internals";
import {
  isActiveAt,
  resolveResponsive,
  responsiveDataAttrs,
  Slot,
  useActiveBreakpoint,
  useOverlay,
} from "./_runtime";

// Patch globals only for this file's lifetime so vitest workers running
// multiple files don't leak Element.prototype / window.matchMedia changes.
beforeAll(installDomPolyfills);
afterAll(uninstallDomPolyfills);

// Per-test teardown — happy-dom keeps the document across tests otherwise.
const teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown) fn();
  teardown.length = 0;
  document.body.innerHTML = "";
  resetDomPolyfills();
});

/** mount() variant that schedules the wrapper for unmount in `afterEach`. */
function mountTracked<C extends Component>(
  component: C,
  options?: Parameters<typeof mount>[1],
): VueWrapper {
  const wrapper = mount(component as Parameters<typeof mount>[0], options);
  teardown.push(() => wrapper.unmount());
  return wrapper;
}

/**
 * Mount a composable in a throwaway component so lifecycle hooks fire. The
 * returned `unmount` is idempotent — tests that call it manually still get
 * cleaned up by the `afterEach` teardown without `app.unmount()` running
 * twice (which would emit Vue warnings).
 */
function withSetup<T>(composable: () => T): { api: T; app: App; unmount: () => void } {
  let api: T | undefined;
  const app = createApp(
    defineComponent({
      setup() {
        api = composable();
        return () => null;
      },
    }),
  );
  const host = document.createElement("div");
  document.body.appendChild(host);
  app.mount(host);
  let unmounted = false;
  const unmount = () => {
    if (unmounted) return;
    unmounted = true;
    app.unmount();
    host.remove();
  };
  teardown.push(unmount);
  return { api: api as T, app, unmount };
}

// ── Polyfill uninstall ─────────────────────────────────────────────────────

describe("uninstallDomPolyfills", () => {
  it("deletes window.matchMedia when the environment had none pre-install", () => {
    uninstallDomPolyfills();
    const w = window as { matchMedia?: typeof window.matchMedia };
    const originalMatchMedia = w.matchMedia;
    delete w.matchMedia;
    try {
      installDomPolyfills();
      expect(typeof w.matchMedia).toBe("function");
      uninstallDomPolyfills();
      expect("matchMedia" in w).toBe(false);
    } finally {
      if (originalMatchMedia) w.matchMedia = originalMatchMedia;
      installDomPolyfills();
    }
  });

  it("deletes globalThis.CSS when the environment had none pre-install", () => {
    uninstallDomPolyfills();
    type CssHost = { CSS?: { supports?: (...args: unknown[]) => boolean } };
    const host = globalThis as CssHost;
    const originalCss = host.CSS;
    delete host.CSS;
    try {
      installDomPolyfills();
      expect(typeof (host as CssHost).CSS?.supports).toBe("function");
      uninstallDomPolyfills();
      expect("CSS" in host).toBe(false);
    } finally {
      if (originalCss) host.CSS = originalCss;
      installDomPolyfills();
    }
  });
});

// ── Pure functions ─────────────────────────────────────────────────────────

describe("isActiveAt", () => {
  it("returns true for scalar true regardless of breakpoint", () => {
    expect(isActiveAt(true, "base")).toBe(true);
    expect(isActiveAt(true, "lg")).toBe(true);
  });

  it("returns false for null / undefined / false / non-object scalars", () => {
    expect(isActiveAt(null, "md")).toBe(false);
    expect(isActiveAt(undefined, "md")).toBe(false);
    expect(isActiveAt(false, "md")).toBe(false);
    expect(isActiveAt("yes", "base")).toBe(false);
    expect(isActiveAt(1, "base")).toBe(false);
  });

  it("cascades mobile-first when bp is unset in object", () => {
    expect(isActiveAt({ base: true }, "xl")).toBe(true);
    expect(isActiveAt({ md: true }, "lg")).toBe(true);
    expect(isActiveAt({ md: true }, "base")).toBe(false);
  });

  it("respects the nearest declared key at or below bp", () => {
    expect(isActiveAt({ base: true, md: false }, "base")).toBe(true);
    expect(isActiveAt({ base: true, md: false }, "md")).toBe(false);
    expect(isActiveAt({ base: true, md: false }, "lg")).toBe(false);
    expect(isActiveAt({ base: true, md: false, lg: true }, "lg")).toBe(true);
  });
});

describe("resolveResponsive", () => {
  it("passes scalars through and returns undefined for null / undefined", () => {
    expect(resolveResponsive("top", "base")).toBe("top");
    expect(resolveResponsive(7, "lg")).toBe(7);
    expect(resolveResponsive(undefined, "base")).toBeUndefined();
    expect(resolveResponsive(null as unknown as undefined, "base")).toBeUndefined();
  });

  it("treats arrays as scalar values, not breakpoint maps", () => {
    expect(resolveResponsive(["a", "b"], "lg")).toEqual(["a", "b"]);
  });

  it("cascades mobile-first across all breakpoints", () => {
    const v = { base: "a", md: "b", lg: "c" };
    expect(resolveResponsive(v, "base")).toBe("a");
    expect(resolveResponsive(v, "md")).toBe("b");
    expect(resolveResponsive(v, "lg")).toBe("c");
    expect(resolveResponsive(v, "xl")).toBe("c");
    expect(resolveResponsive(v, "2xl")).toBe("c");
  });

  it("returns undefined when no key at or below bp is set", () => {
    expect(resolveResponsive({ lg: "x" }, "base")).toBeUndefined();
    expect(resolveResponsive({ lg: "x" }, "md")).toBeUndefined();
  });
});

describe("responsiveDataAttrs", () => {
  it("emits nothing for null / undefined / false", () => {
    expect(responsiveDataAttrs("disabled", undefined)).toEqual({});
    expect(responsiveDataAttrs("disabled", null)).toEqual({});
    expect(responsiveDataAttrs("disabled", false)).toEqual({});
  });

  it("emits the bare attribute for scalar true", () => {
    expect(responsiveDataAttrs("disabled", true)).toEqual({ "data-disabled": "true" });
  });

  it("emits stringified scalar values", () => {
    expect(responsiveDataAttrs("placement", "top")).toEqual({ "data-placement": "top" });
  });

  it("emits per-breakpoint attributes for responsive objects", () => {
    expect(responsiveDataAttrs("disabled", { base: true, md: false })).toEqual({
      "data-disabled": "true",
      "data-disabled-md": "false",
    });
  });

  it("drops base:false to avoid an unmatchable attribute", () => {
    expect(responsiveDataAttrs("disabled", { base: false, md: true })).toEqual({
      "data-disabled-md": "true",
    });
  });

  it("emits explicit false at non-base for CSS override matching", () => {
    expect(responsiveDataAttrs("disabled", { md: true, lg: false })).toEqual({
      "data-disabled-md": "true",
      "data-disabled-lg": "false",
    });
  });
});

// ── Slot ───────────────────────────────────────────────────────────────────

describe("Slot", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("warns and renders nothing on multiple slot children", () => {
    const wrapper = mountTracked(Slot, {
      slots: {
        default: () => [h("button", { type: "button" }, "a"), h("button", { type: "button" }, "b")],
      },
    });
    expect(wrapper.html()).toBe("");
    expect(warnSpy).toHaveBeenCalled();
  });

  it("warns and renders nothing on Fragment child (filter drops symbol-typed vnodes)", () => {
    const wrapper = mountTracked(Slot, {
      slots: {
        default: () =>
          h(Fragment, null, [
            h("button", { type: "button" }, "a"),
            h("button", { type: "button" }, "b"),
          ]),
      },
    });
    expect(wrapper.html()).toBe("");
    expect(warnSpy).toHaveBeenCalled();
  });

  it("warns and renders nothing when default slot is empty", () => {
    const wrapper = mountTracked(Slot, { slots: { default: () => [] } });
    expect(wrapper.html()).toBe("");
    expect(warnSpy).toHaveBeenCalled();
  });

  it("merges class attribute onto the child", () => {
    const wrapper = mountTracked(Slot, {
      attrs: { class: "overlay" },
      slots: { default: () => h("button", { type: "button", class: "primary" }, "x") },
    });
    const button = wrapper.find("button");
    expect(button.classes()).toEqual(["primary", "overlay"]);
  });

  it("merges style attribute onto the child", () => {
    const wrapper = mountTracked(Slot, {
      attrs: { style: { color: "red", padding: "8px" } },
      slots: {
        default: () =>
          h("button", { type: "button", style: { color: "blue", margin: "2px" } }, "x"),
      },
    });
    const button = wrapper.find("button").element as HTMLButtonElement;
    expect(button.style.color).toBe("red");
    expect(button.style.padding).toBe("8px");
    expect(button.style.margin).toBe("2px");
  });

  it("composes click handlers — child fires first, then slot (vue mergeProps)", async () => {
    const calls: string[] = [];
    const childHandler = () => calls.push("child");
    const slotHandler = () => calls.push("slot");
    const wrapper = mountTracked(Slot, {
      attrs: { onClick: slotHandler },
      slots: { default: () => h("button", { type: "button", onClick: childHandler }, "x") },
    });
    await wrapper.find("button").trigger("click");
    expect(calls).toEqual(["child", "slot"]);
  });

  it("forwards aria / data attributes onto the child", () => {
    const wrapper = mountTracked(Slot, {
      attrs: { "aria-describedby": "tip-1", "data-state": "open" },
      slots: { default: () => h("button", { type: "button" }, "x") },
    });
    const button = wrapper.find("button").element;
    expect(button.getAttribute("aria-describedby")).toBe("tip-1");
    expect(button.getAttribute("data-state")).toBe("open");
  });
});

// ── useActiveBreakpoint ────────────────────────────────────────────────────

describe("useActiveBreakpoint", () => {
  it("returns a Readonly<Ref<'base'>> on initial mount when no query matches", () => {
    const { api } = withSetup(() => useActiveBreakpoint());
    expect(api.value).toBe("base");
  });

  it("returns the largest matching breakpoint when multiple queries match", () => {
    setMatchingMediaQueries(["(min-width: 48rem)", "(min-width: 64rem)"]);
    const { api } = withSetup(() => useActiveBreakpoint());
    expect(api.value).toBe("lg");
  });

  it("updates ref value on matchMedia change events", async () => {
    const { api } = withSetup(() => useActiveBreakpoint());
    expect(api.value).toBe("base");
    setMatchingMediaQueries(["(min-width: 48rem)"]);
    await nextTick();
    expect(api.value).toBe("md");
    setMatchingMediaQueries(["(min-width: 48rem)", "(min-width: 64rem)"]);
    await nextTick();
    expect(api.value).toBe("lg");
  });

  it("removes its listeners on unmount", async () => {
    const { api, unmount } = withSetup(() => useActiveBreakpoint());
    unmount();
    setMatchingMediaQueries(["(min-width: 48rem)"]);
    await nextTick();
    // Detached ref must not have observed the post-unmount change.
    expect(api.value).toBe("base");
  });

  it("degrades to 'base' when window.matchMedia is missing (PR #660: missing-global crash)", () => {
    uninstallDomPolyfills();
    const original = window.matchMedia;
    // biome-ignore lint/suspicious/noExplicitAny: simulating SSR / older engine
    (window as any).matchMedia = undefined;
    try {
      const { api } = withSetup(() => useActiveBreakpoint());
      expect(api.value).toBe("base");
    } finally {
      window.matchMedia = original;
      installDomPolyfills();
    }
  });
});

// ── useOverlay ─────────────────────────────────────────────────────────────

type UseOverlayConfig = Parameters<typeof useOverlay>[0];

const BASE_CONFIG: UseOverlayConfig = {
  anchorVar: "--anchor",
  popoverMode: "auto",
  interactions: [],
};

describe("useOverlay", () => {
  it("starts closed by default", () => {
    const { api } = withSetup(() => useOverlay(BASE_CONFIG));
    expect(api.open.value).toBe(false);
    expect(api.state.value).toBe("closed");
  });

  it("honors defaultOpen for the uncontrolled case", () => {
    const { api } = withSetup(() => useOverlay({ ...BASE_CONFIG, defaultOpen: true }));
    expect(api.open.value).toBe(true);
    expect(api.state.value).toBe("open");
  });

  it("flips internal state and notifies onOpenChange when uncontrolled", () => {
    const onOpenChange = vi.fn();
    const { api } = withSetup(() => useOverlay({ ...BASE_CONFIG, onOpenChange }));
    api.setOpen(true);
    expect(api.open.value).toBe(true);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("ignores internal state changes when controlled — only notifies onOpenChange", async () => {
    const onOpenChange = vi.fn();
    const external = ref(false);
    const { api } = withSetup(() =>
      useOverlay({ ...BASE_CONFIG, open: () => external.value, onOpenChange }),
    );
    api.setOpen(true);
    await nextTick();
    expect(api.open.value).toBe(false);
    expect(onOpenChange).toHaveBeenCalledWith(true);
    external.value = true;
    await nextTick();
    expect(api.open.value).toBe(true);
  });

  it("emits a sanitized anchorName and popoverId from useId", () => {
    const { api } = withSetup(() => useOverlay(BASE_CONFIG));
    expect(api.anchorName).toMatch(/^--t-[a-zA-Z0-9_-]+$/);
    expect(api.popoverId).toMatch(/^t-overlay-[a-zA-Z0-9_-]+$/);
    expect(api.anchorVar).toBe("--anchor");
    expect(api.popoverMode).toBe("auto");
  });

  it("wires trigger-bound interactions onto bare event names", () => {
    const { api } = withSetup(() =>
      useOverlay({
        ...BASE_CONFIG,
        interactions: [
          { on: { event: "pointerenter", target: "trigger" }, do: "open" },
          { on: { event: "keydown", target: "trigger", key: "Escape" }, do: "close" },
        ],
      }),
    );
    expect(api.triggerHandlers.pointerenter).toBeInstanceOf(Function);
    expect(api.triggerHandlers.keydown).toBeInstanceOf(Function);
  });

  it("dispatches trigger keydown only on matching key", () => {
    const onOpenChange = vi.fn();
    const { api } = withSetup(() =>
      useOverlay({
        ...BASE_CONFIG,
        defaultOpen: true,
        onOpenChange,
        interactions: [{ on: { event: "keydown", target: "trigger", key: "Escape" }, do: "close" }],
      }),
    );
    const tabEvent = new KeyboardEvent("keydown", { key: "Tab" });
    api.triggerHandlers.keydown?.(tabEvent);
    expect(onOpenChange).not.toHaveBeenCalled();
    const escapeEvent = new KeyboardEvent("keydown", { key: "Escape" });
    api.triggerHandlers.keydown?.(escapeEvent);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("respects when:'open' on trigger rules", () => {
    const onOpenChange = vi.fn();
    const { api } = withSetup(() =>
      useOverlay({
        ...BASE_CONFIG,
        defaultOpen: false,
        onOpenChange,
        interactions: [{ on: { event: "click", target: "trigger" }, do: "close", when: "open" }],
      }),
    );
    api.triggerHandlers.click?.(new MouseEvent("click"));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("schedules opens after delayMs and applies them when timers advance", async () => {
    vi.useFakeTimers();
    try {
      const onOpenChange = vi.fn();
      const { api } = withSetup(() =>
        useOverlay({
          ...BASE_CONFIG,
          onOpenChange,
          interactions: [
            { on: { event: "pointerenter", target: "trigger" }, do: "open", delayMs: 150 },
          ],
        }),
      );
      api.triggerHandlers.pointerenter?.(new PointerEvent("pointerenter"));
      expect(onOpenChange).not.toHaveBeenCalled();
      vi.advanceTimersByTime(150);
      expect(onOpenChange).toHaveBeenCalledWith(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("re-reads a getter-form delayMs per fire", () => {
    vi.useFakeTimers();
    try {
      const onOpenChange = vi.fn();
      const delay = ref(50);
      const { api } = withSetup(() =>
        useOverlay({
          ...BASE_CONFIG,
          onOpenChange,
          interactions: [
            {
              on: { event: "pointerenter", target: "trigger" },
              do: "open",
              delayMs: () => delay.value,
            },
          ],
        }),
      );
      delay.value = 200;
      api.triggerHandlers.pointerenter?.(new PointerEvent("pointerenter"));
      vi.advanceTimersByTime(100);
      expect(onOpenChange).not.toHaveBeenCalled();
      vi.advanceTimersByTime(100);
      expect(onOpenChange).toHaveBeenCalledWith(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("attaches document-target listeners and removes them on unmount", () => {
    const onOpenChange = vi.fn();
    const { unmount } = withSetup(() =>
      useOverlay({
        ...BASE_CONFIG,
        defaultOpen: true,
        onOpenChange,
        interactions: [{ on: { event: "keydown", target: "document", key: "Escape" }, do: "close" }],
      }),
    );
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    onOpenChange.mockClear();
    unmount();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("calls showPopover when content mounts while open is already true (PR #660: node-mount-after-open)", async () => {
    let api: ReturnType<typeof useOverlay> | undefined;
    const hasContent = ref(false);
    const Harness = defineComponent({
      setup() {
        api = useOverlay({ ...BASE_CONFIG, defaultOpen: true });
        return () =>
          h("div", [
            h("button", { type: "button" }, "trigger"),
            hasContent.value
              ? h(
                  "div",
                  {
                    ref: api?.contentRef as unknown as Ref<HTMLElement | null>,
                    popover: "auto",
                    id: api?.popoverId,
                    "data-testid": "content",
                  },
                  "tooltip body",
                )
              : null,
          ]);
      },
    });
    const wrapper = mountTracked(Harness);
    hasContent.value = true;
    await flushPromises();
    const content = wrapper.find('[data-testid="content"]').element as HTMLElement;
    expect(isPopoverShown(content)).toBe(true);
  });

  it("does not throw when :popover-open selector is unsupported (PR #660: SyntaxError on probe)", async () => {
    setSupportsPopoverOpenSelector(false);
    const Harness = defineComponent({
      setup() {
        const o = useOverlay({ ...BASE_CONFIG, defaultOpen: true });
        return () =>
          h("div", {
            ref: o.contentRef as unknown as Ref<HTMLElement | null>,
            popover: "auto",
            id: o.popoverId,
            "data-testid": "content",
          });
      },
    });
    expect(() => mountTracked(Harness)).not.toThrow();
    await flushPromises();
  });

  it("gates schedule() against disabled at the active breakpoint (PR #660: responsive disabled shape)", () => {
    const onOpenChange = vi.fn();
    const { api } = withSetup(() =>
      useOverlay({
        ...BASE_CONFIG,
        onOpenChange,
        disabled: () => ({ base: true, md: false }),
        interactions: [{ on: { event: "pointerenter", target: "trigger" }, do: "open" }],
      }),
    );
    api.triggerHandlers.pointerenter?.(new PointerEvent("pointerenter"));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("re-enables schedule() once the breakpoint flips disabled to false", async () => {
    const onOpenChange = vi.fn();
    const { api } = withSetup(() =>
      useOverlay({
        ...BASE_CONFIG,
        onOpenChange,
        disabled: () => ({ base: true, md: false }),
        interactions: [{ on: { event: "pointerenter", target: "trigger" }, do: "open" }],
      }),
    );
    setMatchingMediaQueries(["(min-width: 48rem)"]);
    await nextTick();
    api.triggerHandlers.pointerenter?.(new PointerEvent("pointerenter"));
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("clears pending timers on unmount", () => {
    vi.useFakeTimers();
    try {
      const onOpenChange = vi.fn();
      const { api, unmount } = withSetup(() =>
        useOverlay({
          ...BASE_CONFIG,
          onOpenChange,
          interactions: [
            { on: { event: "pointerenter", target: "trigger" }, do: "open", delayMs: 150 },
          ],
        }),
      );
      api.triggerHandlers.pointerenter?.(new PointerEvent("pointerenter"));
      unmount();
      vi.advanceTimersByTime(500);
      expect(onOpenChange).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
