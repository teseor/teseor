// @vitest-environment happy-dom

import {
  installDomPolyfills,
  resetDomPolyfills,
  uninstallDomPolyfills,
} from "@teseor/test-internals";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { createElement, Fragment, type MouseEvent } from "react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Slot } from "./Slot.tsx";

beforeAll(installDomPolyfills);
afterAll(uninstallDomPolyfills);

afterEach(() => {
  cleanup();
  resetDomPolyfills();
});

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
