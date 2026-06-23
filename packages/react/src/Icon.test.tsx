// @vitest-environment happy-dom
import {
  installDomPolyfills,
  resetDomPolyfills,
  uninstallDomPolyfills,
} from "@teseor/test-internals";
import { cleanup, render } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { Icon } from "./Icon.tsx";

beforeAll(installDomPolyfills);
afterAll(uninstallDomPolyfills);

afterEach(() => {
  cleanup();
  resetDomPolyfills();
});

function svg() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" data-glyph="x" aria-hidden="true">
      <title>square</title>
      <path d="M3 3h18v18H3z" />
    </svg>
  );
}

describe("Icon (react)", () => {
  it("renders a <span> with the t-icon class by default", () => {
    const { container } = render(<Icon>{svg()}</Icon>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe("SPAN");
    expect(root.classList.contains("t-icon")).toBe(true);
  });

  it("renders caller-supplied SVG children as-is", () => {
    const { container } = render(<Icon>{svg()}</Icon>);
    const root = container.firstElementChild as HTMLElement;
    const child = root.firstElementChild as Element;
    expect(child.tagName).toBe("svg");
    expect(child.getAttribute("data-glyph")).toBe("x");
    expect(child.getAttribute("fill")).toBe("currentColor");
  });

  it("is decorative by default (aria-hidden=true, no aria-label)", () => {
    const { container } = render(<Icon>{svg()}</Icon>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("aria-hidden")).toBe("true");
    expect(root.hasAttribute("aria-label")).toBe(false);
    expect(root.hasAttribute("role")).toBe(false);
  });

  it("becomes meaningful when label is set (aria-label, no aria-hidden)", () => {
    const { container } = render(<Icon label="Settings">{svg()}</Icon>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("aria-label")).toBe("Settings");
    expect(root.hasAttribute("aria-hidden")).toBe(false);
  });

  it("emits no data-size attribute when size is unset", () => {
    const { container } = render(<Icon>{svg()}</Icon>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.hasAttribute("data-size")).toBe(false);
  });

  it.each(["sm", "md", "lg"] as const)("emits data-size=%s when size is set", (s) => {
    const { container } = render(<Icon size={s}>{svg()}</Icon>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-size")).toBe(s);
  });

  it("inherits color from a parent's text color via currentColor", () => {
    const { container } = render(
      <div style={{ color: "rgb(0, 128, 0)" }}>
        <Icon>{svg()}</Icon>
      </div>,
    );
    const root = container.querySelector(".t-icon") as HTMLElement;
    // The `.t-icon` rule applies `color: var(--_color)` and `--_color` falls
    // back to `currentColor` when no `--t-icon-color` is set. happy-dom does
    // not resolve cascaded custom-property fallbacks deterministically, so we
    // assert the wiring (no inline color override on the wrapper) and that
    // the parent's color is what the icon will inherit.
    expect(root.style.color).toBe("");
    const parentEl = root.parentElement as HTMLElement;
    expect(parentEl.style.color).toBe("rgb(0, 128, 0)");
    expect(root.hasAttribute("data-color")).toBe(false);
  });

  it("emits data-color when color is set", () => {
    const { container } = render(<Icon color="success">{svg()}</Icon>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-color")).toBe("success");
  });

  it("asChild renders on the consumer's element and forwards class + attrs", () => {
    const { container } = render(
      <Icon asChild label="Star">
        <i data-x="1" />
      </Icon>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe("I");
    expect(root.classList.contains("t-icon")).toBe(true);
    expect(root.getAttribute("data-x")).toBe("1");
    expect(root.getAttribute("aria-label")).toBe("Star");
  });

  it("forwards consumer attrs through {...rest}", () => {
    const { container } = render(
      <Icon id="ic-1" data-testid="i">
        {svg()}
      </Icon>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.id).toBe("ic-1");
    expect(root.getAttribute("data-testid")).toBe("i");
  });

  it("merges consumer className with t-icon", () => {
    const { container } = render(<Icon className="my-extra">{svg()}</Icon>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains("t-icon")).toBe(true);
    expect(root.classList.contains("my-extra")).toBe(true);
  });

  it("forwards ref to the underlying span", () => {
    let el: HTMLElement | null = null;
    render(
      <Icon
        ref={(node) => {
          el = node;
        }}
      >
        {svg()}
      </Icon>,
    );
    expect(el).not.toBeNull();
    expect((el as unknown as HTMLElement).tagName).toBe("SPAN");
  });
});
