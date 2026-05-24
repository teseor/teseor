// @vitest-environment happy-dom
import {
  installDomPolyfills,
  isPopoverShown,
  resetDomPolyfills,
  uninstallDomPolyfills,
} from "@teseor/test-internals";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { Tooltip } from "./Tooltip.tsx";

beforeAll(installDomPolyfills);
afterAll(uninstallDomPolyfills);

afterEach(() => {
  cleanup();
  resetDomPolyfills();
  delete (window as unknown as { __teseor_warned?: Set<string> }).__teseor_warned;
});

describe("Tooltip (react) — wrapper-level dismissable contract (#662)", () => {
  it("Escape closes an open tooltip", () => {
    render(
      <Tooltip text="hint" defaultOpen>
        <button type="button">trigger</button>
      </Tooltip>,
    );
    const content = document.querySelector(".t-tooltip") as HTMLElement;
    expect(isPopoverShown(content)).toBe(true);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(content.getAttribute("data-state")).toBe("closed");
  });

  it("pointer-down outside the content closes an open tooltip", () => {
    render(
      <Tooltip text="hint" defaultOpen>
        <button type="button">trigger</button>
      </Tooltip>,
    );
    const content = document.querySelector(".t-tooltip") as HTMLElement;
    expect(isPopoverShown(content)).toBe(true);
    fireEvent.pointerDown(document.body);
    expect(content.getAttribute("data-state")).toBe("closed");
  });

  it("Escape closes the topmost open tooltip when two are stacked", () => {
    render(
      <>
        <Tooltip text="outer" defaultOpen>
          <button type="button">outer-trigger</button>
        </Tooltip>
        <Tooltip text="inner" defaultOpen>
          <button type="button">inner-trigger</button>
        </Tooltip>
      </>,
    );
    const tooltips = document.querySelectorAll(".t-tooltip");
    const outer = tooltips[0] as HTMLElement;
    const inner = tooltips[1] as HTMLElement;
    fireEvent.keyDown(document, { key: "Escape" });
    // Topmost-wins: the most recently registered layer (inner) closes first;
    // outer stays open until the next Escape.
    expect(inner.getAttribute("data-state")).toBe("closed");
    expect(outer.getAttribute("data-state")).toBe("open");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(outer.getAttribute("data-state")).toBe("closed");
  });
});
