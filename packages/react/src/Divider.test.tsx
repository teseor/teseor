// @vitest-environment happy-dom
import {
  installDomPolyfills,
  resetDomPolyfills,
  uninstallDomPolyfills,
} from "@teseor/test-internals";
import { cleanup, render } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { Divider } from "./Divider.tsx";

beforeAll(installDomPolyfills);
afterAll(uninstallDomPolyfills);

afterEach(() => {
  cleanup();
  resetDomPolyfills();
});

describe("Divider (react)", () => {
  it("renders an <hr> with the t-divider class by default", () => {
    const { container } = render(<Divider />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe("HR");
    expect(root.classList.contains("t-divider")).toBe(true);
  });

  it("renders a <div> when orientation is vertical", () => {
    const { container } = render(<Divider orientation="vertical" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe("DIV");
    expect(root.classList.contains("t-divider")).toBe(true);
  });

  it('emits role="separator" on both branches', () => {
    const { container: h } = render(<Divider />);
    expect((h.firstElementChild as HTMLElement).getAttribute("role")).toBe("separator");

    const { container: v } = render(<Divider orientation="vertical" />);
    expect((v.firstElementChild as HTMLElement).getAttribute("role")).toBe("separator");
  });

  it("forwards aria-orientation from the orientation prop value", () => {
    // Absence-of-orientation leaves aria-orientation unset; <hr> carries the
    // implicit horizontal orientation natively, so no attribute is needed.
    const { container: implicit } = render(<Divider />);
    expect((implicit.firstElementChild as HTMLElement).hasAttribute("aria-orientation")).toBe(
      false,
    );

    const { container: v } = render(<Divider orientation="vertical" />);
    expect((v.firstElementChild as HTMLElement).getAttribute("aria-orientation")).toBe("vertical");

    const { container: h } = render(<Divider orientation="horizontal" />);
    expect((h.firstElementChild as HTMLElement).getAttribute("aria-orientation")).toBe(
      "horizontal",
    );
  });

  it('toggles role to "none" and adds aria-hidden when decorative is true', () => {
    const { container } = render(<Divider decorative />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("role")).toBe("none");
    expect(root.getAttribute("aria-hidden")).toBe("true");
    expect(root.getAttribute("data-decorative")).toBe("true");
  });

  it("omits aria-hidden + data-decorative when decorative is unset", () => {
    const { container } = render(<Divider />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.hasAttribute("aria-hidden")).toBe(false);
    expect(root.hasAttribute("data-decorative")).toBe(false);
  });

  it("forwards consumer attrs through {...rest} on the hr branch", () => {
    const { container } = render(<Divider id="rule-1" data-testid="x" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.id).toBe("rule-1");
    expect(root.getAttribute("data-testid")).toBe("x");
  });

  it("merges consumer className with t-divider", () => {
    const { container } = render(<Divider className="my-extra" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains("t-divider")).toBe(true);
    expect(root.classList.contains("my-extra")).toBe(true);
  });

  it("forwards ref to the underlying element on each branch", () => {
    let h: HTMLElement | null = null;
    render(
      <Divider
        ref={(node) => {
          h = node;
        }}
      />,
    );
    expect(h).not.toBeNull();
    expect((h as unknown as HTMLElement).tagName).toBe("HR");

    let v: HTMLElement | null = null;
    render(
      <Divider
        orientation="vertical"
        ref={(node) => {
          v = node;
        }}
      />,
    );
    expect(v).not.toBeNull();
    expect((v as unknown as HTMLElement).tagName).toBe("DIV");
  });

  it("asChild on the vertical branch renders the consumer's element", () => {
    const { container } = render(
      <Divider orientation="vertical" asChild>
        <span data-x="1" />
      </Divider>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe("SPAN");
    expect(root.classList.contains("t-divider")).toBe(true);
    expect(root.getAttribute("data-x")).toBe("1");
  });

  it("asChild on the horizontal (void) branch falls back to <hr>", () => {
    const { container } = render(
      <Divider asChild>
        <span />
      </Divider>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe("HR");
  });
});
