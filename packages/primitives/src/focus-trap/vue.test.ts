// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { type App, createApp, defineComponent, h, nextTick, type Ref, ref } from "vue";
import { useFocusTrap } from "./vue.ts";

let mountTarget: HTMLDivElement;
let app: App | null = null;

function mountTrap(initial: boolean): Ref<boolean> {
  const active = ref(initial);
  const containerRef = ref<HTMLElement | null>(null);
  const Trap = defineComponent({
    setup() {
      // biome-ignore lint/correctness/useHookAtTopLevel: vue composable inside setup(), not a react hook
      useFocusTrap(containerRef, active);
      return () =>
        h(
          "div",
          {
            id: "trap",
            ref: (el: unknown) => {
              containerRef.value = el instanceof HTMLElement ? el : null;
            },
          },
          [h("button", { id: "first" }, "First"), h("button", { id: "last" }, "Last")],
        );
    },
  });
  app = createApp(Trap);
  app.mount(mountTarget);
  return active;
}

function activeId(): string | null {
  const el = document.activeElement;
  return el instanceof HTMLElement ? el.id : null;
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

describe("useFocusTrap (vue)", () => {
  it("focuses the first focusable on mount when active is true", async () => {
    mountTrap(true);
    await nextTick();
    expect(activeId()).toBe("first");
  });

  it("does not move focus when active is false", async () => {
    document.body.tabIndex = -1;
    document.body.focus();
    mountTrap(false);
    await nextTick();
    expect(document.activeElement).toBe(document.body);
  });

  it("deactivates and restores focus when active flips to false", async () => {
    document.body.tabIndex = -1;
    document.body.focus();
    const active = mountTrap(true);
    await nextTick();
    expect(activeId()).toBe("first");
    active.value = false;
    await nextTick();
    expect(document.activeElement).toBe(document.body);
  });
});
