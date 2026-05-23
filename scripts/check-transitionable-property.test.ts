import { describe, expect, it } from "vitest";
import { findDisallowedTransitions } from "./check-transitionable-property.ts";

describe("findDisallowedTransitions", () => {
  it("accepts a transition targeting allow-listed properties", () => {
    const css = `.t-x {
      transition:
        background-color calc(var(--t-dur-base) * var(--t-motion-scale)) ease,
        transform calc(var(--t-dur-base) * var(--t-motion-scale)) ease;
    }`;
    expect(findDisallowedTransitions(css)).toEqual([]);
  });

  it("rejects a transition of `width`", () => {
    const css = `.t-x { transition: width calc(var(--t-dur-base) * var(--t-motion-scale)) ease; }`;
    expect(findDisallowedTransitions(css)).toHaveLength(1);
  });

  it("rejects a transition of `padding-inline`", () => {
    const css = `.t-x { transition: padding-inline 200ms ease; }`;
    expect(findDisallowedTransitions(css)).toHaveLength(1);
  });

  it("rejects `transition: all`", () => {
    const css = `.t-x { transition: all 200ms ease; }`;
    expect(findDisallowedTransitions(css)).toHaveLength(1);
  });

  it("rejects a shorthand that omits the property (defaults to `all`)", () => {
    const css = `.t-x { transition: 200ms ease; }`;
    const issues = findDisallowedTransitions(css);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatch(/all/);
  });

  it("accepts `transition: none`", () => {
    expect(findDisallowedTransitions(`.t-x { transition: none; }`)).toEqual([]);
  });

  it("flags one disallowed layer among allowed ones", () => {
    const css = `.t-x {
      transition:
        opacity 200ms ease,
        margin 200ms ease;
    }`;
    expect(findDisallowedTransitions(css)).toHaveLength(1);
  });

  it("checks `transition-property` as a comma list", () => {
    const css = `.t-x {
      transition-property: opacity, transform, height;
      transition-duration: calc(var(--t-dur-base) * var(--t-motion-scale));
    }`;
    const issues = findDisallowedTransitions(css);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatch(/height/);
  });

  it("follows `--_*` indirection (modifier reassignment)", () => {
    const css = `.t-x {
      --_transition: width 200ms ease;
      transition: var(--_transition);
    }`;
    expect(findDisallowedTransitions(css)).toHaveLength(1);
  });

  it("skips a `transition: var(--_x)` whose target is allow-listed", () => {
    const css = `.t-x {
      --_transition: opacity calc(var(--t-dur-base) * var(--t-motion-scale)) ease;
      transition: var(--_transition);
    }`;
    expect(findDisallowedTransitions(css)).toEqual([]);
  });

  it("recognises leading-dot durations (`.2s`) when they precede the property", () => {
    // Shorthand allows duration-first ordering; `.2s` must not be misread as
    // the transitioned property.
    expect(findDisallowedTransitions(`.t-x { transition: .2s opacity ease; }`)).toEqual([]);
  });

  it("recognises negative delays (`-100ms`) without confusing them for properties", () => {
    expect(findDisallowedTransitions(`.t-x { transition: opacity 200ms -100ms ease; }`)).toEqual(
      [],
    );
  });
});
