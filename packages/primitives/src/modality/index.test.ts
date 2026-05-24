// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createModalityScope } from "./index.ts";

afterEach(() => {
  document.body.innerHTML = "";
  delete (window as { __teseor_warned?: unknown }).__teseor_warned;
});

describe("createModalityScope", () => {
  it("sets inert on body siblings whose subtree does not contain the element", () => {
    const sibling = document.createElement("div");
    sibling.textContent = "background";
    const modal = document.createElement("div");
    document.body.append(sibling, modal);
    const scope = createModalityScope(modal);
    scope.activate();
    expect(sibling.hasAttribute("inert")).toBe(true);
    expect(modal.hasAttribute("inert")).toBe(false);
  });

  it("does not inert a body child whose subtree contains the element", () => {
    const wrapper = document.createElement("div");
    const modal = document.createElement("div");
    wrapper.appendChild(modal);
    document.body.appendChild(wrapper);
    const scope = createModalityScope(modal);
    scope.activate();
    expect(wrapper.hasAttribute("inert")).toBe(false);
  });

  it("preserves a pre-existing inert attribute on a sibling across deactivate", () => {
    const sibling = document.createElement("div");
    sibling.setAttribute("inert", "");
    const modal = document.createElement("div");
    document.body.append(sibling, modal);
    const scope = createModalityScope(modal);
    scope.activate();
    scope.deactivate();
    expect(sibling.hasAttribute("inert")).toBe(true);
  });

  it("removes inert on deactivate from siblings it set", () => {
    const sibling = document.createElement("div");
    const modal = document.createElement("div");
    document.body.append(sibling, modal);
    const scope = createModalityScope(modal);
    scope.activate();
    scope.deactivate();
    expect(sibling.hasAttribute("inert")).toBe(false);
  });

  it("nested activate skips already-inert siblings; outer deactivate restores them", () => {
    const outerSibling = document.createElement("div");
    const outerModal = document.createElement("div");
    const innerModal = document.createElement("div");
    outerModal.appendChild(innerModal);
    document.body.append(outerSibling, outerModal);
    const outer = createModalityScope(outerModal);
    const inner = createModalityScope(innerModal);
    outer.activate();
    inner.activate();
    expect(outerSibling.hasAttribute("inert")).toBe(true);
    expect(outerModal.hasAttribute("inert")).toBe(false);
    inner.deactivate();
    outer.deactivate();
    expect(outerSibling.hasAttribute("inert")).toBe(false);
  });

  it("activate is idempotent", () => {
    const sibling = document.createElement("div");
    const modal = document.createElement("div");
    document.body.append(sibling, modal);
    const scope = createModalityScope(modal);
    scope.activate();
    scope.activate();
    scope.deactivate();
    expect(sibling.hasAttribute("inert")).toBe(false);
  });

  it("deactivate is idempotent", () => {
    const sibling = document.createElement("div");
    const modal = document.createElement("div");
    document.body.append(sibling, modal);
    const scope = createModalityScope(modal);
    scope.activate();
    scope.deactivate();
    scope.deactivate();
    expect(sibling.hasAttribute("inert")).toBe(false);
  });

  it("throws when element.ownerDocument is unavailable", () => {
    const orphan = document.createElement("div");
    Object.defineProperty(orphan, "ownerDocument", { value: null });
    expect(() => createModalityScope(orphan)).toThrow(/ownerDocument/);
  });

  it("warns once and no-ops when `inert` is unsupported", () => {
    const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "inert");
    Reflect.deleteProperty(HTMLElement.prototype, "inert");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const sibling = document.createElement("div");
      const modal = document.createElement("div");
      document.body.append(sibling, modal);
      const scope = createModalityScope(modal);
      scope.activate();
      expect(sibling.hasAttribute("inert")).toBe(false);
      expect(warn).toHaveBeenCalledOnce();
    } finally {
      warn.mockRestore();
      if (original) Object.defineProperty(HTMLElement.prototype, "inert", original);
    }
  });
});
