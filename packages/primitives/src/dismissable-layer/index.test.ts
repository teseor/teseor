// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createDismissableLayer } from "./index.ts";

function makeContainer(html: string): HTMLElement {
  document.body.innerHTML = html;
  const container = document.getElementById("container");
  if (!container) throw new Error("container missing");
  return container;
}

function getEl(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} missing`);
  return el;
}

function pressEscape(): void {
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
  );
}

function pointerDownOn(target: HTMLElement): void {
  target.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("createDismissableLayer", () => {
  it("fires onEscapeKeyDown when Escape is pressed", () => {
    const c = makeContainer(`<div id="container"></div>`);
    const onEscapeKeyDown = vi.fn();
    const layer = createDismissableLayer(c, { onEscapeKeyDown });
    pressEscape();
    expect(onEscapeKeyDown).toHaveBeenCalledTimes(1);
    layer.destroy();
  });

  it("ignores keys other than Escape", () => {
    const c = makeContainer(`<div id="container"></div>`);
    const onEscapeKeyDown = vi.fn();
    const layer = createDismissableLayer(c, { onEscapeKeyDown });
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(onEscapeKeyDown).not.toHaveBeenCalled();
    layer.destroy();
  });

  it("fires onPointerDownOutside when a pointerdown lands outside the layer", () => {
    makeContainer(`
      <div>
        <button id="outside">O</button>
        <div id="container">
          <button id="inside">I</button>
        </div>
      </div>
    `);
    const onPointerDownOutside = vi.fn();
    const layer = createDismissableLayer(getEl("container"), { onPointerDownOutside });
    pointerDownOn(getEl("outside"));
    expect(onPointerDownOutside).toHaveBeenCalledTimes(1);
    layer.destroy();
  });

  it("does not fire onPointerDownOutside for pointerdowns inside the layer", () => {
    makeContainer(`
      <div id="container">
        <button id="inside">I</button>
      </div>
    `);
    const onPointerDownOutside = vi.fn();
    const layer = createDismissableLayer(getEl("container"), { onPointerDownOutside });
    pointerDownOn(getEl("inside"));
    expect(onPointerDownOutside).not.toHaveBeenCalled();
    layer.destroy();
  });

  it("does not misclassify Shadow DOM clicks as outside (uses composedPath)", () => {
    // A layer rendered inside a shadow root receives clicks whose event.target
    // is retargeted to the shadow host at document level. composedPath()
    // exposes the real path; element.contains(retargetedTarget) would lie.
    const host = document.createElement("div");
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: "open" });
    const layer = document.createElement("div");
    const inside = document.createElement("button");
    inside.id = "shadow-inside";
    layer.appendChild(inside);
    shadow.appendChild(layer);
    const onPointerDownOutside = vi.fn();
    const subscription = createDismissableLayer(layer, { onPointerDownOutside });
    inside.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, composed: true, cancelable: true }),
    );
    expect(onPointerDownOutside).not.toHaveBeenCalled();
    subscription.destroy();
    host.remove();
  });

  it("fires onInteractOutside alongside onPointerDownOutside", () => {
    makeContainer(`
      <div>
        <button id="outside">O</button>
        <div id="container"></div>
      </div>
    `);
    const onPointerDownOutside = vi.fn();
    const onInteractOutside = vi.fn();
    const layer = createDismissableLayer(getEl("container"), {
      onPointerDownOutside,
      onInteractOutside,
    });
    pointerDownOn(getEl("outside"));
    expect(onPointerDownOutside).toHaveBeenCalledTimes(1);
    expect(onInteractOutside).toHaveBeenCalledTimes(1);
    layer.destroy();
  });

  it("routes Escape to the topmost layer only", () => {
    document.body.innerHTML = `
      <div id="outer"></div>
      <div id="inner"></div>
    `;
    const onOuter = vi.fn();
    const onInner = vi.fn();
    const outer = createDismissableLayer(getEl("outer"), { onEscapeKeyDown: onOuter });
    const inner = createDismissableLayer(getEl("inner"), { onEscapeKeyDown: onInner });
    pressEscape();
    expect(onInner).toHaveBeenCalledTimes(1);
    expect(onOuter).not.toHaveBeenCalled();
    inner.destroy();
    pressEscape();
    expect(onOuter).toHaveBeenCalledTimes(1);
    outer.destroy();
  });

  it("fires onPointerDownOutside on every layer whose element does not contain the target", () => {
    // Click outside both stacked layers → both fire.
    document.body.innerHTML = `
      <button id="outside">O</button>
      <div id="outer"></div>
      <div id="inner"></div>
    `;
    const onOuter = vi.fn();
    const onInner = vi.fn();
    const outer = createDismissableLayer(getEl("outer"), { onPointerDownOutside: onOuter });
    const inner = createDismissableLayer(getEl("inner"), { onPointerDownOutside: onInner });
    pointerDownOn(getEl("outside"));
    expect(onOuter).toHaveBeenCalledTimes(1);
    expect(onInner).toHaveBeenCalledTimes(1);
    outer.destroy();
    inner.destroy();
  });

  it("fires only on the inner layer when the click lands inside the outer but outside the inner", () => {
    document.body.innerHTML = `
      <div id="outer">
        <button id="inside-outer">X</button>
        <div id="inner"></div>
      </div>
    `;
    const onOuter = vi.fn();
    const onInner = vi.fn();
    const outer = createDismissableLayer(getEl("outer"), { onPointerDownOutside: onOuter });
    const inner = createDismissableLayer(getEl("inner"), { onPointerDownOutside: onInner });
    pointerDownOn(getEl("inside-outer"));
    expect(onInner).toHaveBeenCalledTimes(1);
    expect(onOuter).not.toHaveBeenCalled();
    outer.destroy();
    inner.destroy();
  });

  it("survives a callback that destroys a layer mid-iteration", () => {
    document.body.innerHTML = `
      <button id="outside">O</button>
      <div id="a"></div>
      <div id="b"></div>
    `;
    const onA = vi.fn();
    const aLayer = createDismissableLayer(getEl("a"), {
      onPointerDownOutside: () => {
        onA();
        aLayer.destroy();
      },
    });
    const onB = vi.fn();
    const bLayer = createDismissableLayer(getEl("b"), { onPointerDownOutside: onB });
    pointerDownOn(getEl("outside"));
    expect(onA).toHaveBeenCalledTimes(1);
    expect(onB).toHaveBeenCalledTimes(1);
    bLayer.destroy();
  });

  it("destroy is idempotent", () => {
    const c = makeContainer(`<div id="container"></div>`);
    const onEscapeKeyDown = vi.fn();
    const layer = createDismissableLayer(c, { onEscapeKeyDown });
    layer.destroy();
    expect(() => {
      layer.destroy();
    }).not.toThrow();
    pressEscape();
    expect(onEscapeKeyDown).not.toHaveBeenCalled();
  });

  it("detaches global listeners when the stack empties", () => {
    const c = makeContainer(`<div id="container"></div>`);
    const onEscapeKeyDown = vi.fn();
    const layer = createDismissableLayer(c, { onEscapeKeyDown });
    layer.destroy();
    // After destroy, no live layer should receive events.
    pressEscape();
    expect(onEscapeKeyDown).not.toHaveBeenCalled();
    // And a fresh layer starts clean.
    const layer2 = createDismissableLayer(c, { onEscapeKeyDown });
    pressEscape();
    expect(onEscapeKeyDown).toHaveBeenCalledTimes(1);
    layer2.destroy();
  });
});
