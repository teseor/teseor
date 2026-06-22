// @vitest-environment happy-dom
import {
  installDomPolyfills,
  resetDomPolyfills,
  uninstallDomPolyfills,
} from "@teseor/test-internals";
import { cleanup, render } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { Heading } from "./Heading.tsx";

beforeAll(installDomPolyfills);
afterAll(uninstallDomPolyfills);

afterEach(() => {
  cleanup();
  resetDomPolyfills();
});

describe("Heading (react)", () => {
  it("renders <h2> when `level` is omitted (spec default)", () => {
    const { container } = render(<Heading>Title</Heading>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe("H2");
    expect(root.classList.contains("t-heading")).toBe(true);
    expect(root.textContent).toBe("Title");
  });

  it("renders the matching heading tag for each `level` value", () => {
    for (const level of ["1", "2", "3", "4", "5", "6"] as const) {
      const { container } = render(<Heading level={level}>Title</Heading>);
      const root = container.firstElementChild as HTMLElement;
      expect(root.tagName).toBe(`H${level}`);
      cleanup();
    }
  });

  it("emits `data-size` when `size` is set; omits it otherwise", () => {
    const { container, rerender } = render(<Heading level="2">Title</Heading>);
    let root = container.firstElementChild as HTMLElement;
    expect(root.hasAttribute("data-size")).toBe(false);

    rerender(
      <Heading level="2" size="md">
        Title
      </Heading>,
    );
    root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-size")).toBe("md");
  });

  it("merges consumer className with `t-heading`", () => {
    const { container } = render(
      <Heading level="3" className="my-extra">
        Title
      </Heading>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains("t-heading")).toBe(true);
    expect(root.classList.contains("my-extra")).toBe(true);
  });

  it("asChild renders directly on the consumer's child element", () => {
    const { container } = render(
      <Heading asChild>
        <a href="#anchor">Linked heading</a>
      </Heading>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe("A");
    expect(root.classList.contains("t-heading")).toBe(true);
    expect(root.getAttribute("href")).toBe("#anchor");
  });
});
