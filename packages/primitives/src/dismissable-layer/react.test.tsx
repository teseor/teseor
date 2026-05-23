// @vitest-environment happy-dom
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDismissableLayer } from "./react.ts";

let mountTarget: HTMLDivElement;
let root: Root;

type LayerProps = {
  active: boolean;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: PointerEvent) => void;
};

function Layer(props: LayerProps) {
  const [element, setElement] = useState<HTMLElement | null>(null);
  useDismissableLayer(element, props.active, {
    onEscapeKeyDown: props.onEscapeKeyDown,
    onPointerDownOutside: props.onPointerDownOutside,
  });
  return (
    <div ref={setElement} id="layer">
      inside
    </div>
  );
}

function render(props: LayerProps): void {
  act(() => {
    root.render(<Layer {...props} />);
  });
}

beforeEach(() => {
  mountTarget = document.createElement("div");
  document.body.appendChild(mountTarget);
  root = createRoot(mountTarget);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  mountTarget.remove();
  document.body.innerHTML = "";
});

describe("useDismissableLayer (react)", () => {
  it("fires onEscapeKeyDown when active", () => {
    const onEscapeKeyDown = vi.fn();
    render({ active: true, onEscapeKeyDown });
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onEscapeKeyDown).toHaveBeenCalledTimes(1);
  });

  it("does not subscribe when active is false", () => {
    const onEscapeKeyDown = vi.fn();
    render({ active: false, onEscapeKeyDown });
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onEscapeKeyDown).not.toHaveBeenCalled();
  });

  it("fires onPointerDownOutside for clicks outside the element", () => {
    const onPointerDownOutside = vi.fn();
    render({ active: true, onPointerDownOutside });
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    expect(onPointerDownOutside).toHaveBeenCalledTimes(1);
  });

  it("unsubscribes when active flips to false", () => {
    const onEscapeKeyDown = vi.fn();
    render({ active: true, onEscapeKeyDown });
    render({ active: false, onEscapeKeyDown });
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onEscapeKeyDown).not.toHaveBeenCalled();
  });
});
