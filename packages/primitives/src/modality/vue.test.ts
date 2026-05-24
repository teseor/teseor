// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { type App, createApp, defineComponent, h, nextTick, type Ref, ref } from "vue";
import { useModalityScope } from "./vue.ts";

let mountTarget: HTMLDivElement;
let app: App | null = null;

function mountModal(initial: boolean): Ref<boolean> {
  const active = ref(initial);
  const elementRef = ref<HTMLElement | null>(null);
  const Modal = defineComponent({
    setup() {
      // biome-ignore lint/correctness/useHookAtTopLevel: vue composable inside setup(), not a react hook
      useModalityScope(elementRef, active);
      return () =>
        h(
          "div",
          {
            id: "modal",
            ref: (el: unknown) => {
              elementRef.value = el instanceof HTMLElement ? el : null;
            },
          },
          "modal",
        );
    },
  });
  app = createApp(Modal);
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

describe("useModalityScope (vue)", () => {
  it("inerts sibling body children when active", async () => {
    const sibling = document.createElement("aside");
    document.body.appendChild(sibling);
    mountModal(true);
    await nextTick();
    expect(sibling.hasAttribute("inert")).toBe(true);
  });

  it("does not inert siblings when active is false", async () => {
    const sibling = document.createElement("aside");
    document.body.appendChild(sibling);
    mountModal(false);
    await nextTick();
    expect(sibling.hasAttribute("inert")).toBe(false);
  });

  it("does not inert the mount target whose subtree contains the modal", async () => {
    mountModal(true);
    await nextTick();
    expect(mountTarget.hasAttribute("inert")).toBe(false);
  });

  it("restores inert when active flips to false", async () => {
    const sibling = document.createElement("aside");
    document.body.appendChild(sibling);
    const active = mountModal(true);
    await nextTick();
    expect(sibling.hasAttribute("inert")).toBe(true);
    active.value = false;
    await nextTick();
    expect(sibling.hasAttribute("inert")).toBe(false);
  });
});
