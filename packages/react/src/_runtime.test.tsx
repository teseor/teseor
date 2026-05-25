// @vitest-environment happy-dom

import {
  installDomPolyfills,
  resetDomPolyfills,
  setMatchingMediaQueries,
  uninstallDomPolyfills,
} from "@teseor/test-internals";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  isActiveAt,
  mergeRefs,
  resolveResponsive,
  responsiveDataAttrs,
  useActiveBreakpoint,
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

// ── mergeRefs ──────────────────────────────────────────────────────────────

describe("mergeRefs", () => {
  it("invokes every callback ref with the node", () => {
    const calls: Array<string | null> = [];
    const a: (node: string | null) => void = (n) => calls.push(`a:${n}`);
    const b: (node: string | null) => void = (n) => calls.push(`b:${n}`);
    mergeRefs<string>(a, b)("el");
    expect(calls).toEqual(["a:el", "b:el"]);
  });

  it("assigns the node to RefObject.current", () => {
    const refA: { current: string | null } = { current: null };
    const refB: { current: string | null } = { current: "stale" };
    mergeRefs<string>(refA, refB)("el");
    expect(refA.current).toBe("el");
    expect(refB.current).toBe("el");
  });

  it("mixes callback refs and RefObjects in one call", () => {
    const calls: Array<string | null> = [];
    const callback: (node: string | null) => void = (n) => calls.push(`cb:${n}`);
    const refObject: { current: string | null } = { current: null };
    mergeRefs<string>(callback, refObject)("el");
    expect(calls).toEqual(["cb:el"]);
    expect(refObject.current).toBe("el");
  });

  it("skips null / undefined refs", () => {
    const refObject: { current: string | null } = { current: null };
    // null / undefined are valid Ref<T> values — they must be tolerated by mergeRefs.
    mergeRefs<string>(null, undefined, refObject)("el");
    expect(refObject.current).toBe("el");
  });

  it("returns nothing when no callback ref returned a cleanup", () => {
    const refObject: { current: string | null } = { current: null };
    const result = mergeRefs<string>(refObject)("el");
    expect(result).toBeUndefined();
  });

  it("returns a composed cleanup that runs every callback-ref cleanup", () => {
    const cleanups: string[] = [];
    const a: (node: string | null) => void | (() => void) = () => () => cleanups.push("a");
    const b: (node: string | null) => void | (() => void) = () => () => cleanups.push("b");
    const composed = mergeRefs<string>(a, b)("el");
    expect(typeof composed).toBe("function");
    composed?.();
    expect(cleanups).toEqual(["a", "b"]);
  });

  it("composes cleanups across mixed callback-and-RefObject refs", () => {
    const cleanups: string[] = [];
    const refObject: { current: string | null } = { current: null };
    const cb: (node: string | null) => void | (() => void) = () => () => cleanups.push("cb");
    const composed = mergeRefs<string>(refObject, cb)("el");
    expect(refObject.current).toBe("el");
    composed?.();
    expect(cleanups).toEqual(["cb"]);
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
