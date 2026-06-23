// @vitest-environment happy-dom
import {
  installDomPolyfills,
  resetDomPolyfills,
  uninstallDomPolyfills,
} from "@teseor/test-internals";
import { act, cleanup, render } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { Avatar } from "./Avatar.tsx";

beforeAll(installDomPolyfills);
afterAll(uninstallDomPolyfills);

afterEach(() => {
  cleanup();
  resetDomPolyfills();
});

describe("Avatar (react)", () => {
  it("renders a <span> wrapper with the t-avatar class", () => {
    const { container } = render(<Avatar name="Jane Doe" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe("SPAN");
    expect(root.classList.contains("t-avatar")).toBe(true);
  });

  it("renders <img> when src is set", () => {
    const { container } = render(<Avatar src="/a.jpg" alt="Jane Doe" name="Jane Doe" />);
    const root = container.firstElementChild as HTMLElement;
    const img = root.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe("/a.jpg");
    expect(img?.getAttribute("alt")).toBe("Jane Doe");
  });

  it("falls back to initials when src is absent and name is set", () => {
    const { container } = render(<Avatar name="Jane Doe" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.querySelector("img")).toBeNull();
    const initials = root.querySelector("span");
    expect(initials?.textContent).toBe("JD");
  });

  it("derives single-letter initials from a one-token name", () => {
    const { container } = render(<Avatar name="Madonna" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.querySelector("span")?.textContent).toBe("M");
  });

  it("honors an explicit initials override", () => {
    const { container } = render(<Avatar name="Jane Doe" initials="JA" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.querySelector("span")?.textContent).toBe("JA");
  });

  it("falls back to an empty span when neither src nor name is set", () => {
    const { container } = render(<Avatar />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.querySelector("img")).toBeNull();
    const fallback = root.querySelector("span");
    expect(fallback).not.toBeNull();
    expect(fallback?.textContent).toBe("");
  });

  it("swaps to the initials branch when the image errors", () => {
    const { container } = render(<Avatar src="/missing.jpg" alt="Jane" name="Jane Doe" />);
    const root = container.firstElementChild as HTMLElement;
    const img = root.querySelector("img") as HTMLImageElement;
    expect(img).not.toBeNull();
    act(() => {
      img.dispatchEvent(new Event("error"));
    });
    expect(root.querySelector("img")).toBeNull();
    expect(root.querySelector("span")?.textContent).toBe("JD");
  });

  it("emits data-size / data-shape / data-color attrs", () => {
    const { container } = render(
      <Avatar name="Jane Doe" size="lg" shape="square" color="primary" />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-size")).toBe("lg");
    expect(root.getAttribute("data-shape")).toBe("square");
    expect(root.getAttribute("data-color")).toBe("primary");
  });

  it("omits enum data-attrs when the prop is unset (absence-of)", () => {
    const { container } = render(<Avatar name="Jane Doe" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.hasAttribute("data-size")).toBe(false);
    expect(root.hasAttribute("data-shape")).toBe(false);
    expect(root.hasAttribute("data-color")).toBe(false);
  });

  it("forwards ref to the underlying element", () => {
    let node: HTMLElement | null = null;
    render(
      <Avatar
        name="Jane Doe"
        ref={(el) => {
          node = el;
        }}
      />,
    );
    expect(node).not.toBeNull();
    expect((node as unknown as HTMLElement).tagName).toBe("SPAN");
  });
});
