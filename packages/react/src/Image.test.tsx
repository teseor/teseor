// @vitest-environment happy-dom
import {
  installDomPolyfills,
  resetDomPolyfills,
  uninstallDomPolyfills,
} from "@teseor/test-internals";
import { cleanup, render } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { Image } from "./Image.tsx";

beforeAll(installDomPolyfills);
afterAll(uninstallDomPolyfills);

afterEach(() => {
  cleanup();
  resetDomPolyfills();
});

describe("Image (react)", () => {
  it("renders an <img> with the t-image class and forwards src + alt", () => {
    const { container } = render(<Image src="/a.jpg" alt="alpha" />);
    const root = container.firstElementChild as HTMLImageElement;
    expect(root.tagName).toBe("IMG");
    expect(root.classList.contains("t-image")).toBe(true);
    expect(root.getAttribute("src")).toBe("/a.jpg");
    expect(root.getAttribute("alt")).toBe("alpha");
  });

  it("forwards native dimension and loading attrs through {...rest}", () => {
    const { container } = render(
      <Image src="/a.jpg" alt="" width={320} height={180} loading="lazy" decoding="async" />,
    );
    const root = container.firstElementChild as HTMLImageElement;
    expect(root.getAttribute("width")).toBe("320");
    expect(root.getAttribute("height")).toBe("180");
    expect(root.getAttribute("loading")).toBe("lazy");
    expect(root.getAttribute("decoding")).toBe("async");
  });

  it("omits data-fit when fit is unset (absence-of-attr state)", () => {
    const { container } = render(<Image src="/a.jpg" alt="" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.hasAttribute("data-fit")).toBe(false);
  });

  it("emits data-fit with the value when fit is a plain string", () => {
    const { container } = render(<Image src="/a.jpg" alt="" fit="cover" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-fit")).toBe("cover");
  });

  it("emits per-breakpoint data-fit-* attrs when fit is responsive", () => {
    const { container } = render(
      <Image src="/a.jpg" alt="" fit={{ base: "contain", md: "cover" }} />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-fit")).toBe("contain");
    expect(root.getAttribute("data-fit-md")).toBe("cover");
  });

  it("merges consumer className with t-image", () => {
    const { container } = render(<Image src="/a.jpg" alt="" className="my-extra" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains("t-image")).toBe(true);
    expect(root.classList.contains("my-extra")).toBe(true);
  });

  it("forwards ref to the underlying <img>", () => {
    let captured: HTMLImageElement | null = null;
    render(
      <Image
        src="/a.jpg"
        alt=""
        ref={(node) => {
          captured = node;
        }}
      />,
    );
    expect(captured).not.toBeNull();
    expect((captured as unknown as HTMLImageElement).tagName).toBe("IMG");
  });
});
