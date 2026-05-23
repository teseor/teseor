// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type App, createApp, defineComponent, h, nextTick, type Ref, ref } from "vue";
import { useDismissableLayer } from "./vue.ts";

let mountTarget: HTMLDivElement;
let app: App | null = null;

type Opts = {
  onEscapeKeyDown?: () => void;
  onPointerDownOutside?: () => void;
};

function mountLayer(initial: boolean, opts: Opts = {}): Ref<boolean> {
  const active = ref(initial);
  const elementRef = ref<HTMLElement | null>(null);
  const Layer = defineComponent({
    setup() {
      // biome-ignore lint/correctness/useHookAtTopLevel: vue composable inside setup(), not a react hook
      useDismissableLayer(elementRef, active, opts);
      return () =>
        h(
          "div",
          {
            id: "layer",
            ref: (el: unknown) => {
              elementRef.value = el instanceof HTMLElement ? el : null;
            },
          },
          "inside",
        );
    },
  });
  app = createApp(Layer);
  app.mount(mountTarget);
  return active;
}

beforeEach(() => {
  mountTarget = document.createElement("div");
  document.body.appendChild(mountTarget);
});

afterEach(() => {
  app?.unmount();
  app = null;
  mountTarget.remove();
  document.body.innerHTML = "";
});

describe("useDismissableLayer (vue)", () => {
  it("fires onEscapeKeyDown when active", async () => {
    const onEscapeKeyDown = vi.fn();
    mountLayer(true, { onEscapeKeyDown });
    await nextTick();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onEscapeKeyDown).toHaveBeenCalledTimes(1);
  });

  it("does not subscribe when active is false", async () => {
    const onEscapeKeyDown = vi.fn();
    mountLayer(false, { onEscapeKeyDown });
    await nextTick();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onEscapeKeyDown).not.toHaveBeenCalled();
  });

  it("fires onPointerDownOutside for clicks outside the element", async () => {
    const onPointerDownOutside = vi.fn();
    mountLayer(true, { onPointerDownOutside });
    await nextTick();
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    expect(onPointerDownOutside).toHaveBeenCalledTimes(1);
  });

  it("unsubscribes when active flips to false", async () => {
    const onEscapeKeyDown = vi.fn();
    const active = mountLayer(true, { onEscapeKeyDown });
    await nextTick();
    active.value = false;
    await nextTick();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onEscapeKeyDown).not.toHaveBeenCalled();
  });
});
