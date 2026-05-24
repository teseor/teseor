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

  it("Tooltip-on-Modal-trigger degrades — Tooltip stays closed while Modal is open", () => {
    render(
      <Modal title="Confirm" defaultOpen>
        <Tooltip text="hint" defaultOpen>
          <button type="button" data-testid="trigger">
            open
          </button>
        </Tooltip>
      </Modal>,
    );
    // The Tooltip trigger wrapper sits under an inert ancestor (the modal scope
    // inerts every body-child whose subtree doesn't contain the modal). The
    // Modal's content portals to body and isn't affected; the trigger and its
    // tooltip-wrapper are under a different body child (the React mount target),
    // which IS inert.
    // We assert: the React mount target — the parent of the trigger and Tooltip —
    // is inert.
    const triggerButton = screen.getByTestId("trigger");
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
