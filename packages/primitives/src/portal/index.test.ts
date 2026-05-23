// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { createPortal } from "./index.ts";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("createPortal", () => {
  it("attaches a fresh container to document.body by default", () => {
    const portal = createPortal();
    expect(portal.container.parentElement).toBe(document.body);
    expect(portal.container.tagName).toBe("DIV");
    expect(portal.container.children.length).toBe(0);
    portal.unmount();
  });

  it("attaches the container to a custom target", () => {
    const target = document.createElement("section");
    document.body.appendChild(target);
    const portal = createPortal({ target });
    expect(portal.container.parentElement).toBe(target);
    portal.unmount();
  });

  it("uses the provided container instead of creating a new one", () => {
    const reused = document.createElement("aside");
    reused.id = "shared";
    const portal = createPortal({ container: reused });
    expect(portal.container).toBe(reused);
    expect(reused.parentElement).toBe(document.body);
    portal.unmount();
  });

  it("hosts arbitrary content appended to the container", () => {
    const portal = createPortal();
    const child = document.createElement("p");
    child.textContent = "hello";
    portal.container.appendChild(child);
    expect(portal.container.querySelector("p")?.textContent).toBe("hello");
    portal.unmount();
  });

  it("removes the container from the DOM on unmount", () => {
    const portal = createPortal();
    portal.unmount();
    expect(portal.container.parentElement).toBeNull();
  });

  it("is idempotent — calling unmount twice does not throw", () => {
    const portal = createPortal();
    portal.unmount();
    expect(() => {
      portal.unmount();
    }).not.toThrow();
  });

  it("supports independent stacked portals", () => {
    const a = createPortal();
    const b = createPortal();
    expect(a.container.parentElement).toBe(document.body);
    expect(b.container.parentElement).toBe(document.body);
    expect(document.body.children.length).toBe(2);
    a.unmount();
    expect(document.body.children.length).toBe(1);
    expect(b.container.parentElement).toBe(document.body);
    b.unmount();
  });
});
