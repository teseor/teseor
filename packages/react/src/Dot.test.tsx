// @vitest-environment happy-dom
import {
  installDomPolyfills,
  resetDomPolyfills,
  uninstallDomPolyfills,
} from "@teseor/test-internals";
import { cleanup, render } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { Dot } from "./Dot.tsx";

beforeAll(installDomPolyfills);
afterAll(uninstallDomPolyfills);

afterEach(() => {
  cleanup();
  resetDomPolyfills();
});

describe("Dot (react)", () => {
  it("renders a <span> with the t-dot class by default", () => {
    const { container } = render(<Dot />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe("SPAN");
    expect(root.classList.contains("t-dot")).toBe(true);
  });

  it('is decorative by default (role="none", aria-hidden="true", no aria-label)', () => {
    const { container } = render(<Dot />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("role")).toBe("none");
    expect(root.getAttribute("aria-hidden")).toBe("true");
    expect(root.hasAttribute("aria-label")).toBe(false);
  });

  it('flips to role="img" + aria-label when label is set, dropping aria-hidden', () => {
    const { container } = render(<Dot label="Online" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("role")).toBe("img");
    expect(root.getAttribute("aria-label")).toBe("Online");
    expect(root.hasAttribute("aria-hidden")).toBe(false);
  });

  it("emits `data-color` only when `color` is set", () => {
    const { container, rerender } = render(<Dot />);
    let root = container.firstElementChild as HTMLElement;
    expect(root.hasAttribute("data-color")).toBe(false);

    for (const color of ["neutral", "primary", "success", "warning", "danger", "info"] as const) {
      rerender(<Dot color={color} />);
      root = container.firstElementChild as HTMLElement;
      expect(root.getAttribute("data-color")).toBe(color);
    }
  });

  it("emits `data-size` only when `size` is set", () => {
    const { container, rerender } = render(<Dot />);
    let root = container.firstElementChild as HTMLElement;
    expect(root.hasAttribute("data-size")).toBe(false);

    for (const size of ["sm", "md"] as const) {
      rerender(<Dot size={size} />);
      root = container.firstElementChild as HTMLElement;
      expect(root.getAttribute("data-size")).toBe(size);
    }
  });

  it("emits `data-status` only when `status` is set", () => {
    const { container, rerender } = render(<Dot />);
    let root = container.firstElementChild as HTMLElement;
    expect(root.hasAttribute("data-status")).toBe(false);

    for (const status of ["online", "offline", "away", "busy", "idle"] as const) {
      rerender(<Dot status={status} />);
      root = container.firstElementChild as HTMLElement;
      expect(root.getAttribute("data-status")).toBe(status);
    }
  });

  it("composes color and status independently on the same root", () => {
    const { container } = render(<Dot color="primary" status="online" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-color")).toBe("primary");
    expect(root.getAttribute("data-status")).toBe("online");
  });

  it("asChild renders directly on the consumer's child element", () => {
    const { container } = render(
      <Dot asChild>
        <button type="button" data-x="1" />
      </Dot>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe("BUTTON");
    expect(root.classList.contains("t-dot")).toBe(true);
    expect(root.getAttribute("data-x")).toBe("1");
  });

  it("merges consumer className with `t-dot`", () => {
    const { container } = render(<Dot className="my-extra" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains("t-dot")).toBe(true);
    expect(root.classList.contains("my-extra")).toBe(true);
  });

  it("forwards ref to the underlying element", () => {
    let node: HTMLElement | null = null;
    render(
      <Dot
        ref={(el) => {
          node = el;
        }}
      />,
    );
    expect(node).not.toBeNull();
    expect((node as unknown as HTMLElement).tagName).toBe("SPAN");
  });

  it("forwards consumer attrs through {...rest}", () => {
    const { container } = render(<Dot id="presence-1" data-testid="x" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.id).toBe("presence-1");
    expect(root.getAttribute("data-testid")).toBe("x");
  });
});
