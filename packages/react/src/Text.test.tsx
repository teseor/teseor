// @vitest-environment happy-dom
import {
  installDomPolyfills,
  resetDomPolyfills,
  uninstallDomPolyfills,
} from "@teseor/test-internals";
import { cleanup, render } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { Text } from "./Text.tsx";

beforeAll(installDomPolyfills);
afterAll(uninstallDomPolyfills);

afterEach(() => {
  cleanup();
  resetDomPolyfills();
});

describe("Text (react)", () => {
  it("renders <span> when `as` is omitted (spec default)", () => {
    const { container } = render(<Text>Body</Text>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe("SPAN");
    expect(root.classList.contains("t-text")).toBe(true);
    expect(root.textContent).toBe("Body");
  });

  it("renders the matching tag for each `as` value", () => {
    for (const as of ["span", "p", "em", "strong", "small"] as const) {
      const { container } = render(<Text as={as}>Body</Text>);
      const root = container.firstElementChild as HTMLElement;
      expect(root.tagName).toBe(as.toUpperCase());
      cleanup();
    }
  });

  it("emits `data-variant` only when `variant` is set", () => {
    const { container, rerender } = render(<Text as="span">Body</Text>);
    let root = container.firstElementChild as HTMLElement;
    expect(root.hasAttribute("data-variant")).toBe(false);

    rerender(
      <Text as="span" variant="muted">
        Body
      </Text>,
    );
    root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-variant")).toBe("muted");

    rerender(
      <Text as="span" variant="highlight">
        Body
      </Text>,
    );
    root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-variant")).toBe("highlight");
  });

  it("renders `as: p` as the `<p>` element", () => {
    const { container } = render(<Text as="p">Body</Text>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe("P");
    expect(root.classList.contains("t-text")).toBe(true);
  });

  it("emits `data-size` when `size` is set; omits it otherwise", () => {
    const { container, rerender } = render(<Text as="p">Body</Text>);
    let root = container.firstElementChild as HTMLElement;
    expect(root.hasAttribute("data-size")).toBe(false);

    rerender(
      <Text as="p" size="lg">
        Body
      </Text>,
    );
    root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-size")).toBe("lg");
  });

  it("merges consumer className with `t-text`", () => {
    const { container } = render(
      <Text as="p" className="my-extra">
        Body
      </Text>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains("t-text")).toBe(true);
    expect(root.classList.contains("my-extra")).toBe(true);
  });

  it("asChild renders directly on the consumer's child element", () => {
    const { container } = render(
      <Text asChild>
        <a href="#anchor">Linked text</a>
      </Text>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe("A");
    expect(root.classList.contains("t-text")).toBe(true);
    expect(root.getAttribute("href")).toBe("#anchor");
  });
});
