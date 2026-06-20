// @vitest-environment happy-dom
import type { ModalEvent } from "@teseor/contract";
import {
  installDomPolyfills,
  resetDomPolyfills,
  uninstallDomPolyfills,
} from "@teseor/test-internals";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
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

  it("Tooltip-on-Modal-trigger — Modal inerts the trigger subtree", () => {
    render(
      <Modal title="Confirm" defaultOpen>
        <Tooltip text="hint">
          <button type="button" data-testid="trigger">
            open
          </button>
        </Tooltip>
      </Modal>,
    );
    // Real browsers gate pointerenter/focus on `inert`, so a tooltip nested
    // inside a Modal trigger can't open while the Modal is up. happy-dom
    // doesn't enforce `inert` on event dispatch, so we can't assert the
    // tooltip stays closed here — what we *can* assert is that the inert
    // ancestor exists between the trigger and `<body>`. Real-browser
    // verification of the blocking behavior lives in the Playwright suite.
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

describe("Modal events (RFC-0006)", () => {
  // Per-emission ordering pinned by the wrapper template:
  //   1. onDismiss({ reason })
  //   2. onEvent({ type: "dismiss", reason })
  //   3. onOpenChange(false)
  //   4. onEvent({ type: "openChange", value: false })
  //
  // The three reason paths share the same call shape; what differs is which
  // dismissable-layer / trigger source produces the close. Each it() pins one
  // path so a regression flips a single test rather than burying it inside a
  // shared assertion.
  // Distributive helper: conditionals over a non-parameter union are applied
  // to the union as a whole. Without this wrapper, `R` resolves to `never`.
  type DismissReasonOf<T> = T extends { type: "dismiss"; reason: infer R } ? R : never;
  type Recorded =
    | { kind: "dismiss"; reason: DismissReasonOf<ModalEvent> }
    | { kind: "openChange"; value: boolean }
    | { kind: "channel"; event: ModalEvent };

  function setup() {
    const recorded: Recorded[] = [];
    const onDismiss = vi.fn((e: { reason: "outside" | "escape" | "button" }) => {
      recorded.push({ kind: "dismiss", reason: e.reason });
    });
    const onOpenChange = vi.fn((value: boolean) => {
      recorded.push({ kind: "openChange", value });
    });
    const onEvent = vi.fn((e: ModalEvent) => {
      recorded.push({ kind: "channel", event: e });
    });
    return { recorded, onDismiss, onOpenChange, onEvent };
  }

  it("Escape: fires onDismiss(escape) -> onEvent(dismiss) -> onOpenChange(false) -> onEvent(openChange)", () => {
    const { recorded, onDismiss, onOpenChange, onEvent } = setup();
    render(
      <Modal
        title="Confirm"
        defaultOpen
        onDismiss={onDismiss}
        onOpenChange={onOpenChange}
        onEvent={onEvent}
      >
        <button type="button">open</button>
      </Modal>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(recorded).toEqual([
      { kind: "dismiss", reason: "escape" },
      { kind: "channel", event: { type: "dismiss", reason: "escape" } },
      { kind: "openChange", value: false },
      { kind: "channel", event: { type: "openChange", value: false } },
    ]);
  });

  it("outside click: fires onDismiss(outside) -> onEvent(dismiss) -> onOpenChange(false) -> onEvent(openChange)", () => {
    const { recorded, onDismiss, onOpenChange, onEvent } = setup();
    // Render with a sibling that lives outside both the trigger wrapper and
    // the portaled dialog content. A pointerdown on the sibling counts as
    // "outside" for the dismissable-layer's contains-check.
    const sibling = document.createElement("div");
    sibling.setAttribute("data-testid", "outside-target");
    document.body.appendChild(sibling);
    try {
      render(
        <Modal
          title="Confirm"
          defaultOpen
          onDismiss={onDismiss}
          onOpenChange={onOpenChange}
          onEvent={onEvent}
        >
          <button type="button">open</button>
        </Modal>,
      );
      // The dismissable-layer listens on capture-phase pointerdown.
      fireEvent.pointerDown(sibling);
      expect(recorded).toEqual([
        { kind: "dismiss", reason: "outside" },
        { kind: "channel", event: { type: "dismiss", reason: "outside" } },
        { kind: "openChange", value: false },
        { kind: "channel", event: { type: "openChange", value: false } },
      ]);
    } finally {
      sibling.remove();
    }
  });

  it("[runtime-path] trigger click while open: button reason fires through useOverlay's applyNext", () => {
    // NOTE: This exercises the useOverlay "button" runtime path, NOT a
    // realistic Modal user flow. In real browsers, modality has set `inert`
    // on the trigger's subtree while the dialog is open, so users can't
    // click it. happy-dom doesn't enforce `inert`, which is why fireEvent
    // reaches the handler. The path itself is reachable in non-modal
    // overlays that adopt `dismiss` (future Popover, Menu).
    const { recorded, onDismiss, onOpenChange, onEvent } = setup();
    render(
      <Modal
        title="Confirm"
        defaultOpen
        onDismiss={onDismiss}
        onOpenChange={onOpenChange}
        onEvent={onEvent}
      >
        <button type="button" data-testid="trigger">
          open
        </button>
      </Modal>,
    );
    fireEvent.click(screen.getByTestId("trigger"));
    expect(recorded).toEqual([
      { kind: "dismiss", reason: "button" },
      { kind: "channel", event: { type: "dismiss", reason: "button" } },
      { kind: "openChange", value: false },
      { kind: "channel", event: { type: "openChange", value: false } },
    ]);
  });

  it("trigger click while closed: only fires onOpenChange(true) -> onEvent(openChange); no dismiss", () => {
    const { recorded, onDismiss, onOpenChange, onEvent } = setup();
    render(
      <Modal title="Confirm" onDismiss={onDismiss} onOpenChange={onOpenChange} onEvent={onEvent}>
        <button type="button" data-testid="trigger">
          open
        </button>
      </Modal>,
    );
    fireEvent.click(screen.getByTestId("trigger"));
    // Open transition: no dismiss event, just the openChange mirror.
    expect(recorded).toEqual([
      { kind: "openChange", value: true },
      { kind: "channel", event: { type: "openChange", value: true } },
    ]);
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
