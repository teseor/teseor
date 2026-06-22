// @vitest-environment happy-dom
import {
  installDomPolyfills,
  resetDomPolyfills,
  uninstallDomPolyfills,
} from "@teseor/test-internals";
import { cleanup, render } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { Badge } from "./Badge.tsx";

beforeAll(installDomPolyfills);
afterAll(uninstallDomPolyfills);

afterEach(() => {
  cleanup();
  resetDomPolyfills();
});

describe("Badge (react)", () => {
  it("renders a <span> with the t-badge class by default", () => {
    const { container } = render(<Badge>New</Badge>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe("SPAN");
    expect(root.classList.contains("t-badge")).toBe(true);
    expect(root.textContent).toBe("New");
  });

  it("emits `data-variant` only when `variant` is set", () => {
    const { container, rerender } = render(<Badge>New</Badge>);
    let root = container.firstElementChild as HTMLElement;
    expect(root.hasAttribute("data-variant")).toBe(false);

    for (const variant of ["solid", "outline", "ghost"] as const) {
      rerender(<Badge variant={variant}>New</Badge>);
      root = container.firstElementChild as HTMLElement;
      expect(root.getAttribute("data-variant")).toBe(variant);
    }
  });

  it("emits `data-intent` only when `intent` is set", () => {
    const { container, rerender } = render(<Badge>New</Badge>);
    let root = container.firstElementChild as HTMLElement;
    expect(root.hasAttribute("data-intent")).toBe(false);

    for (const intent of ["neutral", "primary", "success", "warning", "danger", "info"] as const) {
      rerender(<Badge intent={intent}>New</Badge>);
      root = container.firstElementChild as HTMLElement;
      expect(root.getAttribute("data-intent")).toBe(intent);
    }
  });

  it("emits `data-size` only when `size` is set", () => {
    const { container, rerender } = render(<Badge>New</Badge>);
    let root = container.firstElementChild as HTMLElement;
    expect(root.hasAttribute("data-size")).toBe(false);

    for (const size of ["sm", "md", "lg"] as const) {
      rerender(<Badge size={size}>New</Badge>);
      root = container.firstElementChild as HTMLElement;
      expect(root.getAttribute("data-size")).toBe(size);
    }
  });

  it("emits `data-shape` only when `shape` is set", () => {
    const { container, rerender } = render(<Badge>New</Badge>);
    let root = container.firstElementChild as HTMLElement;
    expect(root.hasAttribute("data-shape")).toBe(false);

    for (const shape of ["rounded", "pill"] as const) {
      rerender(<Badge shape={shape}>New</Badge>);
      root = container.firstElementChild as HTMLElement;
      expect(root.getAttribute("data-shape")).toBe(shape);
    }
  });

  it("renders the icon slot inside a [data-badge-icon] wrapper before the label", () => {
    const { container } = render(<Badge icon={<svg data-testid="icon" />}>Active</Badge>);
    const root = container.firstElementChild as HTMLElement;
    const iconWrap = root.querySelector("[data-badge-icon]");
    expect(iconWrap).not.toBeNull();
    expect(iconWrap?.firstElementChild?.tagName.toLowerCase()).toBe("svg");
    // Icon wrapper precedes the label text in DOM order.
    const firstChild = root.firstChild as HTMLElement;
    expect((firstChild as HTMLElement).getAttribute("data-badge-icon")).toBe("");
  });

  it("omits the icon wrapper when `icon` is unset", () => {
    const { container } = render(<Badge>New</Badge>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.querySelector("[data-badge-icon]")).toBeNull();
  });

  it("renders no implicit role (decorative by default)", () => {
    const { container } = render(<Badge>New</Badge>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.hasAttribute("role")).toBe(false);
    expect(root.hasAttribute("aria-label")).toBe(false);
  });

  it("forwards consumer-supplied aria-label through {...rest}", () => {
    const { container } = render(<Badge aria-label="3 unread notifications">3</Badge>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("aria-label")).toBe("3 unread notifications");
  });

  it("asChild renders directly on the consumer's child element", () => {
    const { container } = render(
      <Badge asChild>
        <a href="#status">Online</a>
      </Badge>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe("A");
    expect(root.classList.contains("t-badge")).toBe(true);
    expect(root.getAttribute("href")).toBe("#status");
  });

  it("merges consumer className with `t-badge`", () => {
    const { container } = render(<Badge className="my-extra">New</Badge>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains("t-badge")).toBe(true);
    expect(root.classList.contains("my-extra")).toBe(true);
  });

  it("forwards ref to the underlying element", () => {
    let node: HTMLElement | null = null;
    render(
      <Badge
        ref={(el) => {
          node = el;
        }}
      >
        New
      </Badge>,
    );
    expect(node).not.toBeNull();
    expect((node as unknown as HTMLElement).tagName).toBe("SPAN");
  });
});
