// @vitest-environment happy-dom
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useModalityScope } from "./react.ts";

let mountTarget: HTMLDivElement;
let root: Root;

type ModalProps = { active: boolean };

function Modal(props: ModalProps) {
  const [element, setElement] = useState<HTMLElement | null>(null);
  useModalityScope(element, props.active);
  return (
    <div ref={setElement} id="modal">
      modal
    </div>
  );
}

function render(props: ModalProps): void {
  act(() => {
    root.render(<Modal {...props} />);
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

describe("useModalityScope (react)", () => {
  it("inerts sibling body children when active", () => {
    const sibling = document.createElement("aside");
    document.body.appendChild(sibling);
    render({ active: true });
    expect(sibling.hasAttribute("inert")).toBe(true);
  });

  it("does not inert siblings when active is false", () => {
    const sibling = document.createElement("aside");
    document.body.appendChild(sibling);
    render({ active: false });
    expect(sibling.hasAttribute("inert")).toBe(false);
  });

  it("does not inert the mount target whose subtree contains the modal", () => {
    render({ active: true });
    expect(mountTarget.hasAttribute("inert")).toBe(false);
  });

  it("restores inert on cleanup when active flips to false", () => {
    const sibling = document.createElement("aside");
    document.body.appendChild(sibling);
    render({ active: true });
    expect(sibling.hasAttribute("inert")).toBe(true);
    render({ active: false });
    expect(sibling.hasAttribute("inert")).toBe(false);
  });
});
