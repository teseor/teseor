// @vitest-environment happy-dom

import {
  installDomPolyfills,
  isPopoverShown,
  resetDomPolyfills,
  setMatchingMediaQueries,
  setSupportsPopoverOpenSelector,
  uninstallDomPolyfills,
} from "@teseor/test-internals";
import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { useOverlay } from "./useOverlay.ts";

beforeAll(installDomPolyfills);
afterAll(uninstallDomPolyfills);

afterEach(() => {
  cleanup();
  resetDomPolyfills();
  // `warnOnce` dedups per key on `window.__teseor_warned`; reset between tests.
  delete (window as unknown as { __teseor_warned?: Set<string> }).__teseor_warned;
});

type UseOverlayConfig = Parameters<typeof useOverlay>[0];

const BASE_CONFIG: UseOverlayConfig = {
  anchorVar: "--anchor",
  popoverMode: "auto",
  interactions: [],
};

describe("useOverlay", () => {
  it("starts closed by default", () => {
    const { result } = renderHook(() => useOverlay(BASE_CONFIG));
    expect(result.current.open).toBe(false);
    expect(result.current.state).toBe("closed");
  });

  it("honors defaultOpen for the uncontrolled case", () => {
    const { result } = renderHook(() => useOverlay({ ...BASE_CONFIG, defaultOpen: true }));
    expect(result.current.open).toBe(true);
    expect(result.current.state).toBe("open");
  });

  it("flips internal state and notifies onOpenChange when uncontrolled", () => {
    const onOpenChange = vi.fn();
    const { result } = renderHook(() => useOverlay({ ...BASE_CONFIG, onOpenChange }));
    act(() => {
      result.current.setOpen(true);
    });
    expect(result.current.open).toBe(true);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("ignores internal state changes when controlled — only notifies onOpenChange", () => {
    const onOpenChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ open }: { open: boolean }) => useOverlay({ ...BASE_CONFIG, open, onOpenChange }),
      { initialProps: { open: false } },
    );
    act(() => {
      result.current.setOpen(true);
    });
    // Parent hasn't flipped the controlled prop, so derived `open` stays false.
    expect(result.current.open).toBe(false);
    expect(onOpenChange).toHaveBeenCalledWith(true);
    rerender({ open: true });
    expect(result.current.open).toBe(true);
  });

  it("emits a sanitized anchorName and popoverId from useId", () => {
    const { result } = renderHook(() => useOverlay(BASE_CONFIG));
    expect(result.current.anchorName).toMatch(/^--t-[a-zA-Z0-9_-]+$/);
    expect(result.current.popoverId).toMatch(/^t-overlay-[a-zA-Z0-9_-]+$/);
    expect(result.current.anchorVar).toBe("--anchor");
    expect(result.current.popoverMode).toBe("auto");
  });

  it("wires trigger-bound interactions to React handler names", () => {
    const { result } = renderHook(() =>
      useOverlay({
        ...BASE_CONFIG,
        interactions: [
          { on: { event: "pointerenter", target: "trigger" }, do: "open" },
          { on: { event: "focusin", target: "trigger" }, do: "open" },
        ],
      }),
    );
    expect(result.current.triggerHandlers.onPointerEnter).toBeInstanceOf(Function);
    expect(result.current.triggerHandlers.onFocus).toBeInstanceOf(Function);
  });

  it("composes multiple rules for the same trigger event into one handler", () => {
    const { result } = renderHook(() =>
      useOverlay({
        ...BASE_CONFIG,
        defaultOpen: true,
        interactions: [
          { on: { event: "keydown", target: "trigger", key: "Escape" }, do: "close" },
          { on: { event: "keydown", target: "trigger", key: "Tab" }, do: "close", when: "open" },
        ],
      }),
    );
    const handler = result.current.triggerHandlers.onKeyDown;
    expect(handler).toBeInstanceOf(Function);
  });

  it("fires trigger handler with a SyntheticEvent — duck-types .key, not instanceof (PR #660: SyntheticEvent key filter)", () => {
    const onOpenChange = vi.fn();
    const Harness = () => {
      const o = useOverlay({
        ...BASE_CONFIG,
        defaultOpen: true,
        onOpenChange,
        interactions: [{ on: { event: "keydown", target: "trigger", key: "Escape" }, do: "close" }],
      });
      return (
        <button type="button" {...o.triggerHandlers}>
          trigger
        </button>
      );
    };
    const { getByRole } = render(<Harness />);
    fireEvent.keyDown(getByRole("button"), { key: "Tab" });
    expect(onOpenChange).not.toHaveBeenCalled();
    fireEvent.keyDown(getByRole("button"), { key: "Escape" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("respects when:'open' on trigger rules", () => {
    const onOpenChange = vi.fn();
    const Harness = () => {
      const o = useOverlay({
        ...BASE_CONFIG,
        defaultOpen: false,
        onOpenChange,
        interactions: [{ on: { event: "click", target: "trigger" }, do: "close", when: "open" }],
      });
      return (
        <button type="button" {...o.triggerHandlers}>
          trigger
        </button>
      );
    };
    const { getByRole } = render(<Harness />);
    fireEvent.click(getByRole("button"));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("schedules opens after delayMs and applies them when timers advance", () => {
    vi.useFakeTimers();
    try {
      const onOpenChange = vi.fn();
      const Harness = () => {
        const o = useOverlay({
          ...BASE_CONFIG,
          onOpenChange,
          interactions: [
            { on: { event: "pointerenter", target: "trigger" }, do: "open", delayMs: 150 },
          ],
        });
        return (
          <button type="button" {...o.triggerHandlers}>
            trigger
          </button>
        );
      };
      const { getByRole } = render(<Harness />);
      fireEvent.pointerEnter(getByRole("button"));
      expect(onOpenChange).not.toHaveBeenCalled();
      act(() => {
        vi.advanceTimersByTime(150);
      });
      expect(onOpenChange).toHaveBeenCalledWith(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("attaches document-target listeners and removes them on unmount", () => {
    const onOpenChange = vi.fn();
    const Harness = () => {
      useOverlay({
        ...BASE_CONFIG,
        defaultOpen: true,
        onOpenChange,
        interactions: [
          { on: { event: "keydown", target: "document", key: "Escape" }, do: "close" },
        ],
      });
      return null;
    };
    const { unmount } = render(<Harness />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    onOpenChange.mockClear();
    unmount();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("calls showPopover when content mounts while open is already true (PR #660: node-mount-after-open)", () => {
    const Harness = ({ hasContent }: { hasContent: boolean }) => {
      const o = useOverlay<HTMLDivElement>({ ...BASE_CONFIG, defaultOpen: true });
      return (
        <>
          <button type="button">trigger</button>
          {hasContent && (
            <div ref={o.contentRef} popover="auto" id={o.popoverId} data-testid="content">
              tooltip body
            </div>
          )}
        </>
      );
    };
    const { rerender, getByTestId } = render(<Harness hasContent={false} />);
    rerender(<Harness hasContent={true} />);
    const content = getByTestId("content");
    expect(isPopoverShown(content)).toBe(true);
  });

  it("does not throw when :popover-open selector is unsupported (PR #660: SyntaxError on probe)", () => {
    setSupportsPopoverOpenSelector(false);
    const Harness = () => {
      const o = useOverlay<HTMLDivElement>({ ...BASE_CONFIG, defaultOpen: true });
      return (
        <div ref={o.contentRef} popover="auto" id={o.popoverId} data-testid="content">
          x
        </div>
      );
    };
    expect(() => render(<Harness />)).not.toThrow();
    // popoverIsOpen returned undefined → showPopover ran (open && !== true).
  });

  it("warns once when showPopover throws (Popover API unsupported / display:none)", () => {
    const htmlProto = HTMLElement.prototype as unknown as {
      showPopover: () => void;
      hidePopover: () => void;
    };
    const originalShow = htmlProto.showPopover;
    htmlProto.showPopover = () => {
      throw new Error("not supported");
    };
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const Harness = () => {
      const o = useOverlay<HTMLDivElement>({ ...BASE_CONFIG, defaultOpen: true });
      return (
        <div ref={o.contentRef} popover="auto" id={o.popoverId} data-testid="content">
          x
        </div>
      );
    };
    try {
      render(<Harness />);
      render(<Harness />);
      expect(warnSpy).toHaveBeenCalledOnce();
      expect(String(warnSpy.mock.calls[0]?.[0])).toContain("[teseor]");
      expect(String(warnSpy.mock.calls[0]?.[0])).toContain("showPopover");
    } finally {
      htmlProto.showPopover = originalShow;
      warnSpy.mockRestore();
    }
  });

  it("warns once when hidePopover throws", () => {
    const htmlProto = HTMLElement.prototype as unknown as {
      showPopover: () => void;
      hidePopover: () => void;
    };
    const originalHide = htmlProto.hidePopover;
    htmlProto.hidePopover = () => {
      throw new Error("not supported");
    };
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const Harness = ({ open }: { open: boolean }) => {
      const o = useOverlay<HTMLDivElement>({ ...BASE_CONFIG, open });
      return (
        <div ref={o.contentRef} popover="auto" id={o.popoverId} data-testid="content">
          x
        </div>
      );
    };
    try {
      const { rerender } = render(<Harness open={true} />);
      rerender(<Harness open={false} />);
      rerender(<Harness open={true} />);
      rerender(<Harness open={false} />);
      expect(warnSpy).toHaveBeenCalledOnce();
      expect(String(warnSpy.mock.calls[0]?.[0])).toContain("hidePopover");
    } finally {
      htmlProto.hidePopover = originalHide;
      warnSpy.mockRestore();
    }
  });

  it("gates schedule() against disabled at the active breakpoint (PR #660: responsive disabled shape)", () => {
    const onOpenChange = vi.fn();
    const Harness = () => {
      const o = useOverlay({
        ...BASE_CONFIG,
        onOpenChange,
        disabled: { base: true, md: false },
        interactions: [{ on: { event: "pointerenter", target: "trigger" }, do: "open" }],
      });
      return (
        <button type="button" {...o.triggerHandlers}>
          trigger
        </button>
      );
    };
    const { getByRole } = render(<Harness />);
    // No query matches → base → disabled.base === true → no state change.
    fireEvent.pointerEnter(getByRole("button"));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("re-enables schedule() once the breakpoint flips disabled to false", () => {
    const onOpenChange = vi.fn();
    const Harness = () => {
      const o = useOverlay({
        ...BASE_CONFIG,
        onOpenChange,
        disabled: { base: true, md: false },
        interactions: [{ on: { event: "pointerenter", target: "trigger" }, do: "open" }],
      });
      return (
        <button type="button" {...o.triggerHandlers}>
          trigger
        </button>
      );
    };
    const { getByRole } = render(<Harness />);
    act(() => {
      setMatchingMediaQueries(["(min-width: 48rem)"]);
    });
    fireEvent.pointerEnter(getByRole("button"));
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("clears pending timers on unmount", () => {
    vi.useFakeTimers();
    try {
      const onOpenChange = vi.fn();
      const Harness = () => {
        const o = useOverlay({
          ...BASE_CONFIG,
          onOpenChange,
          interactions: [
            { on: { event: "pointerenter", target: "trigger" }, do: "open", delayMs: 150 },
          ],
        });
        return (
          <button type="button" {...o.triggerHandlers}>
            trigger
          </button>
        );
      };
      const { getByRole, unmount } = render(<Harness />);
      fireEvent.pointerEnter(getByRole("button"));
      unmount();
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(onOpenChange).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("Escape closes only the topmost overlay (dismissable-layer stack)", () => {
    const outerClose = vi.fn();
    const innerClose = vi.fn();
    function Outer() {
      const overlay = useOverlay<HTMLDivElement>({
        anchorVar: "--anchor-outer",
        popoverMode: "manual",
        interactions: [],
        open: true,
        onOpenChange: outerClose,
      });
      return (
        <div ref={overlay.contentRef} popover="manual">
          outer
        </div>
      );
    }
    function Inner() {
      const overlay = useOverlay<HTMLDivElement>({
        anchorVar: "--anchor-inner",
        popoverMode: "manual",
        interactions: [],
        open: true,
        onOpenChange: innerClose,
      });
      return (
        <div ref={overlay.contentRef} popover="manual">
          inner
        </div>
      );
    }
    render(
      <>
        <Outer />
        <Inner />
      </>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(innerClose).toHaveBeenCalledWith(false);
    expect(outerClose).not.toHaveBeenCalled();
  });

  it("pointer-down outside the content element closes the overlay", () => {
    const onChange = vi.fn();
    function Harness() {
      const overlay = useOverlay<HTMLDivElement>({
        anchorVar: "--anchor",
        popoverMode: "manual",
        interactions: [],
        open: true,
        onOpenChange: onChange,
      });
      return (
        <>
          <button type="button">outside</button>
          <div ref={overlay.contentRef} popover="manual" data-testid="content">
            inside
          </div>
        </>
      );
    }
    render(<Harness />);
    fireEvent.pointerDown(screen.getByRole("button"));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("pointer-down inside the content element does not close it", () => {
    const onChange = vi.fn();
    function Harness() {
      const overlay = useOverlay<HTMLDivElement>({
        anchorVar: "--anchor",
        popoverMode: "manual",
        interactions: [],
        open: true,
        onOpenChange: onChange,
      });
      return (
        <div ref={overlay.contentRef} popover="manual" data-testid="content">
          <button type="button">inside</button>
        </div>
      );
    }
    render(<Harness />);
    fireEvent.pointerDown(screen.getByRole("button"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("Escape closes the overlay even when disabled at the active breakpoint (intentional)", () => {
    const onChange = vi.fn();
    function Harness() {
      const overlay = useOverlay<HTMLDivElement>({
        anchorVar: "--anchor",
        popoverMode: "manual",
        interactions: [],
        open: true,
        onOpenChange: onChange,
        disabled: true,
      });
      return (
        <div ref={overlay.contentRef} popover="manual">
          x
        </div>
      );
    }
    render(<Harness />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onChange).toHaveBeenCalledWith(false);
  });

  describe("modal: true", () => {
    it("inerts sibling body children when open", () => {
      const sibling = document.createElement("aside");
      sibling.setAttribute("data-testid", "sibling");
      document.body.appendChild(sibling);
      try {
        function Harness() {
          const o = useOverlay<HTMLDivElement>({ ...BASE_CONFIG, defaultOpen: true, modal: true });
          return (
            <div ref={o.contentRef} popover="manual">
              <button type="button">close</button>
            </div>
          );
        }
        render(<Harness />);
        expect(sibling.hasAttribute("inert")).toBe(true);
      } finally {
        sibling.remove();
      }
    });

    it("does not inert siblings when closed", () => {
      const sibling = document.createElement("aside");
      document.body.appendChild(sibling);
      try {
        function Harness() {
          const o = useOverlay<HTMLDivElement>({ ...BASE_CONFIG, defaultOpen: false, modal: true });
          return (
            <div ref={o.contentRef} popover="manual">
              x
            </div>
          );
        }
        render(<Harness />);
        expect(sibling.hasAttribute("inert")).toBe(false);
      } finally {
        sibling.remove();
      }
    });

    it("removes inert from siblings on close", () => {
      const sibling = document.createElement("aside");
      document.body.appendChild(sibling);
      try {
        function Harness({ open }: { open: boolean }) {
          const o = useOverlay<HTMLDivElement>({ ...BASE_CONFIG, open, modal: true });
          return (
            <div ref={o.contentRef} popover="manual">
              x
            </div>
          );
        }
        const { rerender } = render(<Harness open={true} />);
        expect(sibling.hasAttribute("inert")).toBe(true);
        rerender(<Harness open={false} />);
        expect(sibling.hasAttribute("inert")).toBe(false);
      } finally {
        sibling.remove();
      }
    });

    it("pulls focus into the content on open and activates the focus trap", () => {
      function Harness() {
        const o = useOverlay<HTMLDivElement>({ ...BASE_CONFIG, defaultOpen: true, modal: true });
        return (
          <div ref={o.contentRef} popover="manual">
            <button type="button" data-testid="inside">
              inside
            </button>
          </div>
        );
      }
      render(<Harness />);
      const inside = screen.getByTestId("inside");
      expect(document.activeElement).toBe(inside);
    });
  });

  describe("modal: false (default)", () => {
    it("does not inert sibling body children when open", () => {
      const sibling = document.createElement("aside");
      document.body.appendChild(sibling);
      try {
        function Harness() {
          const o = useOverlay<HTMLDivElement>({ ...BASE_CONFIG, defaultOpen: true });
          return (
            <div ref={o.contentRef} popover="manual">
              x
            </div>
          );
        }
        render(<Harness />);
        expect(sibling.hasAttribute("inert")).toBe(false);
      } finally {
        sibling.remove();
      }
    });
  });
});
