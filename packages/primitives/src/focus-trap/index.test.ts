// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { createFocusTrap, getFocusableElements } from "./index.ts";

function makeContainer(html: string): HTMLElement {
  document.body.innerHTML = html;
  const container = document.getElementById("container");
  if (!container) throw new Error("container missing");
  return container;
}

function getEl(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} missing`);
  return el;
}

function activeId(): string | null {
  const el = document.activeElement;
  return el instanceof HTMLElement ? el.id : null;
}

function pressTab(shift = false): void {
  document.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
      shiftKey: shift,
    }),
  );
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("getFocusableElements", () => {
  it("returns focusable descendants in DOM order", () => {
    const c = makeContainer(`
      <div id="container">
        <button id="a">A</button>
        <a id="b" href="#">B</a>
        <input id="c" />
      </div>
    `);
    expect(getFocusableElements(c).map((el) => el.id)).toEqual(["a", "b", "c"]);
  });

  it("skips disabled buttons and inputs", () => {
    const c = makeContainer(`
      <div id="container">
        <button id="a">A</button>
        <button id="b" disabled>B</button>
        <input id="c" disabled />
        <button id="d">D</button>
      </div>
    `);
    expect(getFocusableElements(c).map((el) => el.id)).toEqual(["a", "d"]);
  });

  it("skips elements inside an [inert] subtree", () => {
    const c = makeContainer(`
      <div id="container">
        <div inert>
          <button id="hidden">H</button>
        </div>
        <button id="a">A</button>
      </div>
    `);
    expect(getFocusableElements(c).map((el) => el.id)).toEqual(["a"]);
  });

  it("includes [tabindex='0'] but excludes [tabindex='-1']", () => {
    const c = makeContainer(`
      <div id="container">
        <button id="a">A</button>
        <div id="b" tabindex="0">B</div>
        <div id="c" tabindex="-1">C</div>
      </div>
    `);
    expect(getFocusableElements(c).map((el) => el.id)).toEqual(["a", "b"]);
  });

  it("excludes any element whose computed tabIndex is negative", () => {
    // The CSS selector matches `[tabindex]:not([tabindex="-1"])` so values
    // like `-2` slip past the selector — the tabIndex filter catches them.
    const c = makeContainer(`
      <div id="container">
        <button id="a">A</button>
        <div id="b" tabindex="-2">B</div>
      </div>
    `);
    expect(getFocusableElements(c).map((el) => el.id)).toEqual(["a"]);
  });
});

describe("createFocusTrap", () => {
  it("focuses the first focusable on activate", () => {
    const c = makeContainer(`
      <div id="container">
        <button id="a">A</button>
        <button id="b">B</button>
      </div>
    `);
    const trap = createFocusTrap(c);
    trap.activate();
    expect(activeId()).toBe("a");
    trap.deactivate();
  });

  it("wraps from last to first on Tab", () => {
    const c = makeContainer(`
      <div id="container">
        <button id="a">A</button>
        <button id="b">B</button>
      </div>
    `);
    const trap = createFocusTrap(c);
    trap.activate();
    getEl("b").focus();
    pressTab();
    expect(activeId()).toBe("a");
    trap.deactivate();
  });

  it("wraps from first to last on Shift+Tab", () => {
    const c = makeContainer(`
      <div id="container">
        <button id="a">A</button>
        <button id="b">B</button>
      </div>
    `);
    const trap = createFocusTrap(c);
    trap.activate();
    pressTab(true);
    expect(activeId()).toBe("b");
    trap.deactivate();
  });

  it("pulls focus back when it escapes the container", () => {
    makeContainer(`
      <div>
        <button id="outside">O</button>
        <div id="container">
          <button id="a">A</button>
        </div>
      </div>
    `);
    const c = getEl("container");
    const trap = createFocusTrap(c);
    trap.activate();
    getEl("outside").focus();
    pressTab();
    expect(activeId()).toBe("a");
    trap.deactivate();
  });

  it("focuses the container itself when there are no focusables", () => {
    const c = makeContainer(`<div id="container"></div>`);
    const trap = createFocusTrap(c);
    trap.activate();
    expect(document.activeElement).toBe(c);
    expect(c.getAttribute("tabindex")).toBe("-1");
    trap.deactivate();
    expect(c.hasAttribute("tabindex")).toBe(false);
  });

  it("pulls focus back to the container on Tab when there are no focusables and focus escaped", () => {
    makeContainer(`
      <div>
        <button id="outside">O</button>
        <div id="container"></div>
      </div>
    `);
    const c = getEl("container");
    const trap = createFocusTrap(c);
    trap.activate();
    getEl("outside").focus();
    pressTab();
    expect(document.activeElement).toBe(c);
    expect(c.getAttribute("tabindex")).toBe("-1");
    trap.deactivate();
  });

  it("pulls focus back via focusin when an outside element is clicked or focused programmatically", () => {
    makeContainer(`
      <div>
        <button id="outside">O</button>
        <div id="container">
          <button id="a">A</button>
        </div>
      </div>
    `);
    const trap = createFocusTrap(getEl("container"));
    trap.activate();
    getEl("outside").focus();
    // No Tab — just a programmatic focus change. The focusin handler should
    // pull focus back without us pressing any key.
    expect(activeId()).toBe("a");
    trap.deactivate();
  });

  it("restores focus to the previously focused element on deactivate", () => {
    document.body.innerHTML = `
      <button id="trigger">T</button>
      <div id="container">
        <button id="a">A</button>
      </div>
    `;
    getEl("trigger").focus();
    expect(activeId()).toBe("trigger");
    const trap = createFocusTrap(getEl("container"));
    trap.activate();
    expect(activeId()).toBe("a");
    trap.deactivate();
    expect(activeId()).toBe("trigger");
  });

  it("honors `initialFocus` as an HTMLElement", () => {
    const c = makeContainer(`
      <div id="container">
        <button id="a">A</button>
        <button id="b">B</button>
      </div>
    `);
    const trap = createFocusTrap(c, { initialFocus: getEl("b") });
    trap.activate();
    expect(activeId()).toBe("b");
    trap.deactivate();
  });

  it("skips initial focus when `initialFocus` is false", () => {
    const c = makeContainer(`
      <div id="container">
        <button id="a">A</button>
      </div>
    `);
    document.body.tabIndex = -1;
    document.body.focus();
    const before = document.activeElement;
    const trap = createFocusTrap(c, { initialFocus: false });
    trap.activate();
    expect(document.activeElement).toBe(before);
    trap.deactivate();
  });

  it("honors `returnFocus` as an HTMLElement", () => {
    document.body.innerHTML = `
      <button id="trigger">T</button>
      <button id="elsewhere">E</button>
      <div id="container">
        <button id="a">A</button>
      </div>
    `;
    getEl("trigger").focus();
    const trap = createFocusTrap(getEl("container"), {
      returnFocus: getEl("elsewhere"),
    });
    trap.activate();
    trap.deactivate();
    expect(activeId()).toBe("elsewhere");
  });

  it("ignores repeated activate / deactivate calls", () => {
    const c = makeContainer(`
      <div id="container"><button id="a">A</button></div>
    `);
    const trap = createFocusTrap(c);
    trap.activate();
    trap.activate(); // no-op
    expect(activeId()).toBe("a");
    trap.deactivate();
    trap.deactivate(); // no-op
  });
});
