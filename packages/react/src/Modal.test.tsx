// @vitest-environment happy-dom
import {
  installDomPolyfills,
  resetDomPolyfills,
  uninstallDomPolyfills,
} from "@teseor/test-internals";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { Modal } from "./Modal.tsx";
import { Tooltip } from "./Tooltip.tsx";

beforeAll(installDomPolyfills);
afterAll(uninstallDomPolyfills);

afterEach(() => {
  cleanup();
  resetDomPolyfills();
  delete (window as unknown as { __teseor_warned?: Set<string> }).__teseor_warned;
});

describe("Modal (react)", () => {
  it("inerts sibling body children when open", () => {
    const sibling = document.createElement("aside");
    sibling.setAttribute("data-testid", "sibling");
    document.body.appendChild(sibling);
    try {
      render(
        <Modal title="Are you sure?" defaultOpen>
          <button type="button">open</button>
        </Modal>,
      );
      expect(sibling.hasAttribute("inert")).toBe(true);
    } finally {
      sibling.remove();
    }
  });

  it("removes inert on Escape", () => {
    const sibling = document.createElement("aside");
    document.body.appendChild(sibling);
    try {
      render(
        <Modal title="Are you sure?" defaultOpen>
          <button type="button">open</button>
        </Modal>,
      );
      expect(sibling.hasAttribute("inert")).toBe(true);
      fireEvent.keyDown(document, { key: "Escape" });
      expect(sibling.hasAttribute("inert")).toBe(false);
    } finally {
      sibling.remove();
    }
  });

  it("opens on trigger click and closes on Escape", () => {
    render(
      <Modal title="Are you sure?">
        <button type="button" data-testid="trigger">
          open
        </button>
      </Modal>,
    );
    fireEvent.click(screen.getByTestId("trigger"));
    // Content renders in a body-level portal — the popover element stays in
    // the DOM but its data-state flips between open/closed.
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.getAttribute("data-state")).toBe("open");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(dialog?.getAttribute("data-state")).toBe("closed");
  });

  it("forwards a consumer ref to the dialog content element alongside its internal ref", () => {
    const captured: { current: HTMLDivElement | null } = { current: null };
    function Consumer() {
      return (
        <Modal
          title="Confirm"
          defaultOpen
          ref={(node) => {
            captured.current = node;
          }}
        >
          <button type="button">open</button>
        </Modal>
      );
    }
    render(<Consumer />);
    expect(captured.current).not.toBeNull();
    expect(captured.current?.getAttribute("role")).toBe("dialog");
  });

  it("does not re-run a consumer ref callback when the parent re-renders", () => {
    let calls = 0;
    const consumerRef = (node: HTMLDivElement | null) => {
      if (node !== null) calls += 1;
    };
    function Consumer({ tick }: { tick: number }) {
      return (
        <Modal title="Confirm" defaultOpen ref={consumerRef}>
          <button type="button">{tick}</button>
        </Modal>
      );
    }
    const { rerender } = render(<Consumer tick={0} />);
    expect(calls).toBe(1);
    rerender(<Consumer tick={1} />);
    rerender(<Consumer tick={2} />);
    // Inline `mergeRefs(...)` would tear down + reattach every render.
    expect(calls).toBe(1);
  });

  it("Tooltip-on-Modal-trigger degrades — Tooltip stays closed when the user tries to open it", () => {
    render(
      <Modal title="Confirm" defaultOpen>
        <Tooltip text="hint">
          <button type="button" data-testid="trigger">
            open
          </button>
        </Tooltip>
      </Modal>,
    );
    // The trigger sits under an inert ancestor (Modal inerts every body child
    // whose subtree doesn't contain its portaled content). Pointerenter on the
    // trigger should not propagate the open event through useOverlay's
    // schedule path because the inert subtree won't fire input events.
    const triggerButton = screen.getByTestId("trigger");
    fireEvent.pointerEnter(triggerButton);
    fireEvent.focus(triggerButton);
    // The tooltip content lives in-place (not portaled). Its data-state stays
    // "closed" because no open transition fires.
    const tooltipContent = document.querySelector(".t-tooltip");
    expect(tooltipContent?.getAttribute("data-state") ?? "closed").toBe("closed");
    // Sanity: an inert ancestor exists between trigger and body.
    let ancestor: HTMLElement | null = triggerButton.parentElement;
    let foundInert = false;
    while (ancestor && ancestor !== document.body) {
      if (ancestor.hasAttribute("inert")) {
        foundInert = true;
        break;
      }
      ancestor = ancestor.parentElement;
    }
    expect(foundInert).toBe(true);
  });
});
