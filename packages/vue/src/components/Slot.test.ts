// @vitest-environment happy-dom
import {
  installDomPolyfills,
  resetDomPolyfills,
  uninstallDomPolyfills,
} from "@teseor/test-internals";
import { mount, type VueWrapper } from "@vue/test-utils";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { type Component, Fragment, h } from "vue";
import { Slot } from "./Slot.ts";

beforeAll(installDomPolyfills);
afterAll(uninstallDomPolyfills);

const teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown) fn();
  teardown.length = 0;
  document.body.innerHTML = "";
  resetDomPolyfills();
  // `warnOnce` dedups per key on `window.__teseor_warned`; clear it so each
  // test sees a fresh warning rather than the first test silencing the rest.
  delete (window as unknown as { __teseor_warned?: Set<string> }).__teseor_warned;
});

function mountTracked<C extends Component>(
  component: C,
  options?: Parameters<typeof mount>[1],
): VueWrapper {
  const wrapper = mount(component as Parameters<typeof mount>[0], options);
  teardown.push(() => wrapper.unmount());
  return wrapper;
}

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
