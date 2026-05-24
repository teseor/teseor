import { describe, expect, it } from "vitest";
import { findUnscaledMotion } from "./motion-scale.ts";

describe("findUnscaledMotion", () => {
  it("accepts a transition whose every layer scales by --t-motion-scale", () => {
    const css = `.t-x {
      transition:
        color calc(var(--t-dur-base) * var(--t-motion-scale)) var(--t-ease-standard),
        opacity calc(var(--t-dur-base) * var(--t-motion-scale)) var(--t-ease-standard);
    }`;
    expect(findUnscaledMotion(css)).toEqual([]);
  });

  it("accepts a scaled animation duration", () => {
    const css = ".t-x { animation: spin calc(800ms * var(--t-motion-scale)) linear infinite; }";
    expect(findUnscaledMotion(css)).toEqual([]);
  });

  it("flags a bare duration on transition", () => {
    expect(findUnscaledMotion(".t-x { transition: opacity 200ms ease; }")).toHaveLength(1);
  });

  it("flags one unscaled layer among scaled ones", () => {
    const css = `.t-x {
      transition:
        color calc(var(--t-dur-base) * var(--t-motion-scale)) ease,
        transform 200ms ease;
    }`;
    expect(findUnscaledMotion(css)).toHaveLength(1);
  });

  it("flags a bare duration token on animation-duration", () => {
    expect(findUnscaledMotion(".t-x { animation-duration: var(--t-dur-fast); }")).toHaveLength(1);
  });

  it("ignores `transition: none`", () => {
    expect(findUnscaledMotion(".t-x { transition: none; }")).toEqual([]);
  });

  it("follows a --_* token reassigned by a modifier", () => {
    const css = `.t-x {
      --_animation: none;
      animation: var(--_animation);
      &[data-state="open"] {
        --_animation: scale-in calc(var(--t-dur-enter-base) * var(--t-motion-scale)) ease;
      }
    }`;
    expect(findUnscaledMotion(css)).toEqual([]);
  });

  it("flags an unscaled duration hidden behind a --_* token", () => {
    const css = `.t-x {
      --_animation: scale-in 300ms ease;
      animation: var(--_animation);
    }`;
    expect(findUnscaledMotion(css)).toHaveLength(1);
  });
});
