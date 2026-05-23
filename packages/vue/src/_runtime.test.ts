// @vitest-environment happy-dom
import {
  installDomPolyfills,
  resetDomPolyfills,
  setMatchingMediaQueries,
  uninstallDomPolyfills,
} from "@teseor/test-internals";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { type App, createApp, defineComponent, nextTick } from "vue";
import {
  isActiveAt,
  resolveResponsive,
  responsiveDataAttrs,
  useActiveBreakpoint,
} from "./_runtime";

// Patch globals only for this file's lifetime so vitest workers running
// multiple files don't leak Element.prototype / window.matchMedia changes.
beforeAll(installDomPolyfills);
afterAll(uninstallDomPolyfills);

// Per-test teardown — happy-dom keeps the document across tests otherwise.
const teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown) fn();
  teardown.length = 0;
  document.body.innerHTML = "";
  resetDomPolyfills();
});

/**
 * Mount a composable in a throwaway component so lifecycle hooks fire. The
 * returned `unmount` is idempotent — tests that call it manually still get
 * cleaned up by the `afterEach` teardown without `app.unmount()` running
 * twice (which would emit Vue warnings).
 */
function withSetup<T>(composable: () => T): { api: T; app: App; unmount: () => void } {
  let api: T | undefined;
  const app = createApp(
    defineComponent({
      setup() {
        api = composable();
        return () => null;
      },
    }),
  );
  const host = document.createElement("div");
  document.body.appendChild(host);
  app.mount(host);
  let unmounted = false;
  const unmount = () => {
    if (unmounted) return;
    unmounted = true;
    app.unmount();
    host.remove();
  };
  teardown.push(unmount);
  return { api: api as T, app, unmount };
}

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

  it("returns false for null / undefined / false / non-object scalars", () => {
    expect(isActiveAt(null, "md")).toBe(false);
    expect(isActiveAt(undefined, "md")).toBe(false);
    expect(isActiveAt(false, "md")).toBe(false);
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
  it("passes scalars through and returns undefined for null / undefined", () => {
    expect(resolveResponsive("top", "base")).toBe("top");
    expect(resolveResponsive(7, "lg")).toBe(7);
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

// ── useActiveBreakpoint ────────────────────────────────────────────────────

describe("useActiveBreakpoint", () => {
  it("returns a Readonly<Ref<'base'>> on initial mount when no query matches", () => {
    const { api } = withSetup(() => useActiveBreakpoint());
    expect(api.value).toBe("base");
  });

  it("returns the largest matching breakpoint when multiple queries match", () => {
    setMatchingMediaQueries(["(min-width: 48rem)", "(min-width: 64rem)"]);
    const { api } = withSetup(() => useActiveBreakpoint());
    expect(api.value).toBe("lg");
  });

  it("updates ref value on matchMedia change events", async () => {
    const { api } = withSetup(() => useActiveBreakpoint());
    expect(api.value).toBe("base");
    setMatchingMediaQueries(["(min-width: 48rem)"]);
    await nextTick();
    expect(api.value).toBe("md");
    setMatchingMediaQueries(["(min-width: 48rem)", "(min-width: 64rem)"]);
    await nextTick();
    expect(api.value).toBe("lg");
  });

  it("removes its listeners on unmount", async () => {
    const { api, unmount } = withSetup(() => useActiveBreakpoint());
    unmount();
    setMatchingMediaQueries(["(min-width: 48rem)"]);
    await nextTick();
    // Detached ref must not have observed the post-unmount change.
    expect(api.value).toBe("base");
  });

  it("degrades to 'base' when window.matchMedia is missing (PR #660: missing-global crash)", () => {
    uninstallDomPolyfills();
    const original = window.matchMedia;
    // biome-ignore lint/suspicious/noExplicitAny: simulating SSR / older engine
    (window as any).matchMedia = undefined;
    try {
      const { api } = withSetup(() => useActiveBreakpoint());
      expect(api.value).toBe("base");
    } finally {
      window.matchMedia = original;
      installDomPolyfills();
    }
  });
});

