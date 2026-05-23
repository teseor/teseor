// @vitest-environment happy-dom
import {
  installDomPolyfills,
  isPopoverShown,
  resetDomPolyfills,
  setMatchingMediaQueries,
  setSupportsPopoverOpenSelector,
  uninstallDomPolyfills,
} from "@teseor/test-internals";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  type App,
  type Component,
  createApp,
  defineComponent,
  h,
  nextTick,
  ref,
  type Ref,
} from "vue";
import { useOverlay } from "./useOverlay.ts";

beforeAll(installDomPolyfills);
afterAll(uninstallDomPolyfills);

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
