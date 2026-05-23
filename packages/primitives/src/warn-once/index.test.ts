// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { warnOnce } from "./index.ts";

type WarnedHost = { __teseor_warned?: Set<string> };

afterEach(() => {
  delete (window as unknown as WarnedHost).__teseor_warned;
});

describe("warnOnce", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("prefixes the message with `[teseor] `", () => {
    warnOnce("test.prefix", "hello");
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy).toHaveBeenCalledWith("[teseor] hello");
  });

  it("logs only once per key across repeated calls", () => {
    warnOnce("test.dedup", "first");
    warnOnce("test.dedup", "second");
    warnOnce("test.dedup", "third");
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy).toHaveBeenCalledWith("[teseor] first");
  });

  it("logs separately for different keys", () => {
    warnOnce("test.key-a", "a");
    warnOnce("test.key-b", "b");
    expect(warnSpy).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenNthCalledWith(1, "[teseor] a");
    expect(warnSpy).toHaveBeenNthCalledWith(2, "[teseor] b");
  });

  it("tracks dedup state on `window.__teseor_warned` so consumers can reset it in tests", () => {
    warnOnce("test.window", "msg");
    const host = window as unknown as WarnedHost;
    expect(host.__teseor_warned).toBeInstanceOf(Set);
    expect(host.__teseor_warned?.has("test.window")).toBe(true);
  });

  it("re-emits after `window.__teseor_warned` is cleared", () => {
    warnOnce("test.reset", "first");
    delete (window as unknown as WarnedHost).__teseor_warned;
    warnOnce("test.reset", "second");
    expect(warnSpy).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenNthCalledWith(2, "[teseor] second");
  });

  it("is SSR-safe — no-op when `window` is undefined", () => {
    const originalWindow = globalThis.window;
    delete (globalThis as { window?: Window }).window;
    try {
      expect(() => warnOnce("test.ssr", "msg")).not.toThrow();
      // Still writes to console in SSR (helpful for build-time warnings).
      expect(warnSpy).toHaveBeenCalledWith("[teseor] msg");
    } finally {
      globalThis.window = originalWindow;
    }
  });

  it("dedups within SSR too — when `window` is undefined, dedup falls back to a module-level set", () => {
    // Two calls in an SSR-shaped environment should still only emit once per key.
    const originalWindow = globalThis.window;
    delete (globalThis as { window?: Window }).window;
    try {
      warnOnce("test.ssr-dedup", "msg");
      warnOnce("test.ssr-dedup", "msg-again");
      expect(warnSpy).toHaveBeenCalledOnce();
    } finally {
      globalThis.window = originalWindow;
    }
  });

  it("is a no-op when `console` is undefined", () => {
    const originalConsole = globalThis.console;
    delete (globalThis as { console?: Console }).console;
    try {
      expect(() => warnOnce("test.no-console", "msg")).not.toThrow();
    } finally {
      globalThis.console = originalConsole;
    }
  });
});
