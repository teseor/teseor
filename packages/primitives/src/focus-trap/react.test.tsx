// @vitest-environment happy-dom
import { act, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useFocusTrap } from "./react.ts";

let mountTarget: HTMLDivElement;
let root: Root;

function Trap(props: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, props.active);
  return (
    <div ref={ref} id="trap">
      <button type="button" id="first">
        First
      </button>
      <button type="button" id="last">
        Last
      </button>
    </div>
  );
}

function render(active: boolean): void {
  act(() => {
    root.render(<Trap active={active} />);
  });
}

function activeId(): string | null {
  const el = document.activeElement;
  return el instanceof HTMLElement ? el.id : null;
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

describe("useFocusTrap (react)", () => {
  it("focuses the first focusable on mount when active is true", () => {
    render(true);
    expect(activeId()).toBe("first");
  });

  it("does not move focus when active is false", () => {
    document.body.tabIndex = -1;
    document.body.focus();
    render(false);
    expect(document.activeElement).toBe(document.body);
  });

  it("deactivates and restores focus when active flips to false", () => {
    document.body.tabIndex = -1;
    document.body.focus();
    render(true);
    expect(activeId()).toBe("first");
    render(false);
    expect(document.activeElement).toBe(document.body);
  });
});
