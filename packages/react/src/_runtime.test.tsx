// @vitest-environment happy-dom

import {
  installDomPolyfills,
  isPopoverShown,
  resetDomPolyfills,
  setMatchingMediaQueries,
  setSupportsPopoverOpenSelector,
  uninstallDomPolyfills,
} from "@teseor/test-internals";
import { act, cleanup, fireEvent, render, renderHook } from "@testing-library/react";
import { createElement, Fragment, type MouseEvent } from "react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isActiveAt,
  resolveResponsive,
  responsiveDataAttrs,
  Slot,
  useActiveBreakpoint,
  useOverlay,
} from "./_runtime";

// Patch globals only for this file's lifetime so vitest workers running
// multiple files don't leak Element.prototype / window.matchMedia changes.
beforeAll(installDomPolyfills);
afterAll(uninstallDomPolyfills);

afterEach(() => {
  cleanup();
  resetDomPolyfills();
});

// ── Polyfill uninstall ─────────────────────────────────────────────────────

describe("uninstallDomPolyfills", () => {
  it("deletes window.matchMedia when the environment had none pre-install", () => {
    uninstallDomPolyfills();
    const w = window as { matchMedia?: typeof window.matchMedia };
    const originalMatchMedia = w.matchMedia;
    delete w.matchMedia;
    try {
      installDomPolyfills();
      expect(typeof w.matchMedia).toBe("function");
      uninstallDomPolyfills();
      expect("matchMedia" in w).toBe(false);
    } finally {
      if (originalMatchMedia) w.matchMedia = originalMatchMedia;
      installDomPolyfills();
    }
  });

  it("deletes globalThis.CSS when the environment had none pre-install", () => {
    uninstallDomPolyfills();
    type CssHost = { CSS?: { supports?: (...args: unknown[]) => boolean } };
    const host = globalThis as CssHost;
    const originalCss = host.CSS;
    delete host.CSS;
    try {
      installDomPolyfills();
      expect(typeof (host as CssHost).CSS?.supports).toBe("function");
      uninstallDomPolyfills();
      expect("CSS" in host).toBe(false);
    } finally {
      if (originalCss) host.CSS = originalCss;
      installDomPolyfills();
    }
  });
});

// ── Pure functions ─────────────────────────────────────────────────────────

describe("isActiveAt", () => {
  it("returns true for scalar true regardless of breakpoint", () => {
    expect(isActiveAt(true, "base")).toBe(true);
    expect(isActiveAt(true, "lg")).toBe(true);
  });

  it("returns false for null / undefined / false", () => {
    expect(isActiveAt(null, "md")).toBe(false);
    expect(isActiveAt(undefined, "md")).toBe(false);
    expect(isActiveAt(false, "md")).toBe(false);
  });

  it("returns false for non-object truthy scalars", () => {
    expect(isActiveAt("yes", "base")).toBe(false);
    expect(isActiveAt(1, "base")).toBe(false);
  });

  it("cascades mobile-first when bp is unset in object", () => {
    expect(isActiveAt({ base: true }, "xl")).toBe(true);
    expect(isActiveAt({ md: true }, "lg")).toBe(true);
    expect(isActiveAt({ md: true }, "base")).toBe(false);
  });

  it("respects the nearest declared key at or below bp", () => {
    expect(isActiveAt({ base: true, md: false }, "base")).toBe(true);
    expect(isActiveAt({ base: true, md: false }, "md")).toBe(false);
    expect(isActiveAt({ base: true, md: false }, "lg")).toBe(false);
    expect(isActiveAt({ base: true, md: false, lg: true }, "lg")).toBe(true);
  });
});

describe("resolveResponsive", () => {
  it("passes scalars through", () => {
    expect(resolveResponsive("top", "base")).toBe("top");
    expect(resolveResponsive(7, "lg")).toBe(7);
  });

  it("returns undefined for null / undefined", () => {
    expect(resolveResponsive(undefined, "base")).toBeUndefined();
    expect(resolveResponsive(null as unknown as undefined, "base")).toBeUndefined();
  });

  it("treats arrays as scalar values, not breakpoint maps", () => {
    expect(resolveResponsive(["a", "b"], "lg")).toEqual(["a", "b"]);
  });

  it("cascades mobile-first across all breakpoints", () => {
    const v = { base: "a", md: "b", lg: "c" };
    expect(resolveResponsive(v, "base")).toBe("a");
    expect(resolveResponsive(v, "md")).toBe("b");
    expect(resolveResponsive(v, "lg")).toBe("c");
    expect(resolveResponsive(v, "xl")).toBe("c");
    expect(resolveResponsive(v, "2xl")).toBe("c");
  });

  it("returns undefined when no key at or below bp is set", () => {
    expect(resolveResponsive({ lg: "x" }, "base")).toBeUndefined();
    expect(resolveResponsive({ lg: "x" }, "md")).toBeUndefined();
  });
});

describe("responsiveDataAttrs", () => {
  it("emits nothing for null / undefined / false", () => {
    expect(responsiveDataAttrs("disabled", undefined)).toEqual({});
    expect(responsiveDataAttrs("disabled", null)).toEqual({});
    expect(responsiveDataAttrs("disabled", false)).toEqual({});
  });

  it("emits the bare attribute for scalar true", () => {
    expect(responsiveDataAttrs("disabled", true)).toEqual({ "data-disabled": "true" });
  });

  it("emits stringified scalar values", () => {
    expect(responsiveDataAttrs("placement", "top")).toEqual({ "data-placement": "top" });
  });

  it("emits per-breakpoint attributes for responsive objects", () => {
    expect(responsiveDataAttrs("disabled", { base: true, md: false })).toEqual({
      "data-disabled": "true",
      "data-disabled-md": "false",
    });
  });

  it("drops base:false to avoid an unmatchable attribute", () => {
    expect(responsiveDataAttrs("disabled", { base: false, md: true })).toEqual({
      "data-disabled-md": "true",
    });
  });

  it("emits explicit false at non-base for CSS override matching", () => {
    expect(responsiveDataAttrs("disabled", { md: true, lg: false })).toEqual({
      "data-disabled-md": "true",
      "data-disabled-lg": "false",
    });
  });
});

// ── Slot ───────────────────────────────────────────────────────────────────

describe("Slot", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("warns and renders nothing on multiple children (PR #660: Children.only crash)", () => {
    const { container } = render(
      <Slot>
        <button type="button">a</button>
        <button type="button">b</button>
      </Slot>,
    );
    expect(container.firstChild).toBeNull();
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it("warns and renders nothing on fragment with multiple children", () => {
    const { container } = render(
      <Slot>
        {/* biome-ignore lint/complexity/noUselessFragments: deliberate — the test exercises Slot's Fragment-child detection */}
        <Fragment>
          <button type="button">a</button>
          <button type="button">b</button>
        </Fragment>
      </Slot>,
    );
    expect(container.firstChild).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("warns and renders nothing when children is null", () => {
    const { container } = render(<Slot>{null}</Slot>);
    expect(container.firstChild).toBeNull();
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it("warns and renders nothing on bare text content", () => {
    const { container } = render(<Slot>just a string</Slot>);
    expect(container.firstChild).toBeNull();
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it("warns on an empty fragment", () => {
    const { container } = render(
      <Slot>
        <Fragment />
      </Slot>,
    );
    expect(container.firstChild).toBeNull();
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it("merges style by spread (slot wins on conflict)", () => {
    const { container } = render(
      <Slot style={{ color: "red", padding: "8px" }}>
        <button type="button" style={{ color: "blue", margin: "2px" }}>
          x
        </button>
      </Slot>,
    );
    const button = container.querySelector("button");
    expect(button?.style.color).toBe("red");
    expect(button?.style.padding).toBe("8px");
    expect(button?.style.margin).toBe("2px");
  });

  it("joins className strings (child first, slot after)", () => {
    const { container } = render(
      <Slot className="overlay">
        <button type="button" className="primary">
          x
        </button>
      </Slot>,
    );
    expect(container.querySelector("button")?.className).toBe("primary overlay");
  });

  it("composes event handlers — child fires first, then slot", () => {
    const calls: string[] = [];
    const childHandler = () => calls.push("child");
    const slotHandler = () => calls.push("slot");
    const { getByRole } = render(
      <Slot onClick={slotHandler}>
        <button type="button" onClick={childHandler}>
          x
        </button>
      </Slot>,
    );
    fireEvent.click(getByRole("button"));
    expect(calls).toEqual(["child", "slot"]);
  });

  it("skips slot handler when child calls event.preventDefault (PR #660: defaultPrevented short-circuit)", () => {
    const calls: string[] = [];
    const childHandler = (event: MouseEvent) => {
      calls.push("child");
      event.preventDefault();
    };
    const slotHandler = () => calls.push("slot");
    const { getByRole } = render(
      <Slot onClick={slotHandler}>
        <button type="button" onClick={childHandler}>
          x
        </button>
      </Slot>,
    );
    fireEvent.click(getByRole("button"));
    expect(calls).toEqual(["child"]);
  });

  it("lets slot props win for refs / aria / data attributes", () => {
    const { container } = render(
      <Slot aria-describedby="tip-1" data-state="open">
        <button type="button" aria-describedby="leftover" data-state="closed">
          x
        </button>
      </Slot>,
    );
    const button = container.querySelector("button");
    expect(button?.getAttribute("aria-describedby")).toBe("tip-1");
    expect(button?.getAttribute("data-state")).toBe("open");
  });

  it("warns when the child is an astro-slot wrapper (PR #660: astro-slot detection)", () => {
    // `astro-slot` isn't a JSX intrinsic; build it via `createElement`.
    const innerButton = createElement("button", { type: "button" }, "x");
    const astroWrapper = createElement("astro-slot", null, innerButton);
    const { container } = render(<Slot data-state="open">{astroWrapper}</Slot>);
    expect(warnSpy).toHaveBeenCalled();
    const warnMsg = warnSpy.mock.calls[0]?.[0];
    expect(String(warnMsg)).toContain("astro-slot");
    // Still attempts the clone (data attr lands on the wrapper, not the
    // inner button) so Astro renders something visible rather than blank.
    expect(container.querySelector("astro-slot")?.getAttribute("data-state")).toBe("open");
  });
});

// ── useActiveBreakpoint ────────────────────────────────────────────────────

describe("useActiveBreakpoint", () => {
  it("returns 'base' on initial render when no media query matches", () => {
    const { result } = renderHook(() => useActiveBreakpoint());
    expect(result.current).toBe("base");
  });

  it("returns the largest matching breakpoint when multiple queries match", () => {
    setMatchingMediaQueries([
      "(min-width: 48rem)", // md
      "(min-width: 64rem)", // lg
    ]);
    const { result } = renderHook(() => useActiveBreakpoint());
    expect(result.current).toBe("lg");
  });

  it("updates on matchMedia change events (md -> lg transition)", () => {
    const { result } = renderHook(() => useActiveBreakpoint());
    expect(result.current).toBe("base");
    act(() => {
      setMatchingMediaQueries(["(min-width: 48rem)"]);
    });
    expect(result.current).toBe("md");
    act(() => {
      setMatchingMediaQueries(["(min-width: 48rem)", "(min-width: 64rem)"]);
    });
    expect(result.current).toBe("lg");
  });

  it("removes its listeners on unmount", () => {
    const { result, unmount } = renderHook(() => useActiveBreakpoint());
    unmount();
    // Dispatching after unmount must not throw stale-setState; a fresh hook
    // mounted afterwards reads the new value cleanly.
    act(() => {
      setMatchingMediaQueries(["(min-width: 48rem)"]);
    });
    void result;
    const { result: result2 } = renderHook(() => useActiveBreakpoint());
    expect(result2.current).toBe("md");
  });

  it("degrades to 'base' when window.matchMedia is missing (PR #660: missing-global crash)", () => {
    uninstallDomPolyfills();
    const original = window.matchMedia;
    // biome-ignore lint/suspicious/noExplicitAny: simulating SSR / older engine
    (window as any).matchMedia = undefined;
    try {
      const { result } = renderHook(() => useActiveBreakpoint());
      expect(result.current).toBe("base");
    } finally {
      window.matchMedia = original;
      installDomPolyfills();
    }
  });
});

// ── useOverlay ─────────────────────────────────────────────────────────────

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
});
