// @vitest-environment happy-dom
import {
  installDomPolyfills,
  resetDomPolyfills,
  uninstallDomPolyfills,
} from "@teseor/test-internals";
import { cleanup, render } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { Link } from "./Link.tsx";

beforeAll(installDomPolyfills);
afterAll(uninstallDomPolyfills);

afterEach(() => {
  cleanup();
  resetDomPolyfills();
});

describe("Link (react)", () => {
  it("renders an <a> with the t-link class", () => {
    const { container } = render(<Link href="#anchor">Label</Link>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe("A");
    expect(root.classList.contains("t-link")).toBe(true);
    expect(root.getAttribute("href")).toBe("#anchor");
    expect(root.textContent).toBe("Label");
  });

  it("emits `data-variant` only when `variant` is set", () => {
    const { container, rerender } = render(<Link href="#a">Label</Link>);
    let root = container.firstElementChild as HTMLElement;
    expect(root.hasAttribute("data-variant")).toBe(false);

    rerender(
      <Link href="#a" variant="subtle">
        Label
      </Link>,
    );
    root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-variant")).toBe("subtle");

    rerender(
      <Link href="#a" variant="plain">
        Label
      </Link>,
    );
    root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-variant")).toBe("plain");
  });

  it("merges consumer className with `t-link`", () => {
    const { container } = render(
      <Link href="#a" className="my-extra">
        Label
      </Link>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains("t-link")).toBe(true);
    expect(root.classList.contains("my-extra")).toBe(true);
  });

  it("passes native attrs through (target, rel)", () => {
    const { container } = render(
      <Link href="https://example.com" target="_blank" rel="noopener noreferrer">
        External
      </Link>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("target")).toBe("_blank");
    expect(root.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("asChild renders directly on the consumer's child element", () => {
    function NextLink({ href, children, ...rest }: { href: string; children: React.ReactNode }) {
      return (
        <a href={href} data-router="next" {...rest}>
          {children}
        </a>
      );
    }
    const { container } = render(
      <Link asChild>
        <NextLink href="/route">Routed</NextLink>
      </Link>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe("A");
    expect(root.classList.contains("t-link")).toBe(true);
    expect(root.getAttribute("data-router")).toBe("next");
    expect(root.getAttribute("href")).toBe("/route");
  });
});
