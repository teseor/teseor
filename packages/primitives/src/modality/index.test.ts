// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createModalityScope } from "./index.ts";

// Tests fully deactivate the scopes they create — module-level stack state
// drains cleanly so the next test starts from an empty Map. No test-only
// reset helper on the public surface.
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
    scope.deactivate();
  });

  it("does not inert a body child whose subtree contains the element", () => {
    const wrapper = document.createElement("div");
    const modal = document.createElement("div");
    wrapper.appendChild(modal);
    document.body.appendChild(wrapper);
    const scope = createModalityScope(modal);
    scope.activate();
    expect(wrapper.hasAttribute("inert")).toBe(false);
    scope.deactivate();
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

  it("out-of-order deactivation — outer pops while inner active, page state stays correct", () => {
    // Stacks recompute on every push/pop. Deactivating an outer scope while
    // an inner is still active must leave the inner's wants intact.
    const child1 = document.createElement("div");
    const modalA = document.createElement("div");
    child1.appendChild(modalA);
    const child2 = document.createElement("div");
    const modalB = document.createElement("div");
    child2.appendChild(modalB);
    document.body.append(child1, child2);

    const scopeA = createModalityScope(modalA);
    const scopeB = createModalityScope(modalB);

    scopeA.activate();
    scopeB.activate();
    // Top is B → child1 inert, child2 reachable.
    expect(child1.hasAttribute("inert")).toBe(true);
    expect(child2.hasAttribute("inert")).toBe(false);

    // Outer scope deactivates while inner is still active.
    scopeA.deactivate();
    // Top is still B → child1 stays inert, child2 stays reachable.
    expect(child1.hasAttribute("inert")).toBe(true);
    expect(child2.hasAttribute("inert")).toBe(false);

    // Inner deactivates last — stack empty, no inerts.
    scopeB.deactivate();
    expect(child1.hasAttribute("inert")).toBe(false);
    expect(child2.hasAttribute("inert")).toBe(false);
  });

  it("two scopes in sibling body-children — inner activates without leaving its container inert", () => {
    // Regression: a second modal whose container had been inerted by the first
    // scope was left unfocusable because applyInert skipped already-inert
    // children. The new pass un-inerts the second scope's container and
    // restores it on deactivate.
    const child1 = document.createElement("div");
    const modalA = document.createElement("div");
    child1.appendChild(modalA);
    const child2 = document.createElement("div");
    const modalB = document.createElement("div");
    child2.appendChild(modalB);
    document.body.append(child1, child2);

    const scopeA = createModalityScope(modalA);
    const scopeB = createModalityScope(modalB);

    scopeA.activate();
    expect(child1.hasAttribute("inert")).toBe(false);
    expect(child2.hasAttribute("inert")).toBe(true);

    scopeB.activate();
    expect(child2.hasAttribute("inert")).toBe(false);
    expect(child1.hasAttribute("inert")).toBe(true);

    scopeB.deactivate();
    expect(child1.hasAttribute("inert")).toBe(false);
    expect(child2.hasAttribute("inert")).toBe(true);

    scopeA.deactivate();
    expect(child1.hasAttribute("inert")).toBe(false);
    expect(child2.hasAttribute("inert")).toBe(false);
  });

  it("preserves inert added by consumer code to a body-child we don't own", () => {
    // Consumer adds inert to a body-child that wasn't a sibling at first
    // activation (or was added later). The pre-pass at the next reconcile
    // tags it as author-owned, so we don't claim and strip it.
    const sibling = document.createElement("div");
    const modal = document.createElement("div");
    document.body.append(sibling, modal);

    const scopeA = createModalityScope(modal);
    scopeA.activate();
    // Consumer adds a NEW body-child after activation and inerts it.
    const lateAuthor = document.createElement("div");
    document.body.appendChild(lateAuthor);
    lateAuthor.setAttribute("inert", "");

    // Trigger another reconcile (push a second scope, then pop it).
    const otherModal = document.createElement("div");
    document.body.appendChild(otherModal);
    const scopeB = createModalityScope(otherModal);
    scopeB.activate();
    scopeB.deactivate();
    scopeA.deactivate();

    // Author-owned inert survives the whole stack lifecycle.
    expect(lateAuthor.hasAttribute("inert")).toBe(true);
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
      scope.deactivate();
    } finally {
      warn.mockRestore();
      if (original) Object.defineProperty(HTMLElement.prototype, "inert", original);
    }
  });
});
