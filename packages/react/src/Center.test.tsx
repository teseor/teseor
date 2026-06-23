// @vitest-environment happy-dom
import {
  installDomPolyfills,
  resetDomPolyfills,
  uninstallDomPolyfills,
} from "@teseor/test-internals";
import { cleanup, render } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { Center } from "./Center.tsx";

beforeAll(installDomPolyfills);
afterAll(uninstallDomPolyfills);

afterEach(() => {
  cleanup();
  resetDomPolyfills();
});

describe("Center (react)", () => {
  it("renders a <div> with the t-center class by default", () => {
    const { container } = render(
      <Center>
        <span>child</span>
      </Center>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe("DIV");
    expect(root.classList.contains("t-center")).toBe(true);
  });

  it("omits data-min-height when minHeight is unset", () => {
    const { container } = render(
      <Center>
        <span>child</span>
      </Center>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.hasAttribute("data-min-height")).toBe(false);
  });

  it("emits kebab-cased data-min-height when minHeight is set", () => {
    const { container } = render(
      <Center minHeight="screen">
        <span>child</span>
      </Center>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-min-height")).toBe("screen");
  });

  it("emits per-breakpoint data-min-height-* attrs when minHeight is responsive", () => {
    const { container } = render(
      <Center minHeight={{ md: "screen" }}>
        <span>child</span>
      </Center>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.hasAttribute("data-min-height")).toBe(false);
    expect(root.getAttribute("data-min-height-md")).toBe("screen");
  });

  it("renders no implicit ARIA (transparent wrapper)", () => {
    const { container } = render(
      <Center>
        <span>child</span>
      </Center>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.hasAttribute("role")).toBe(false);
    expect(root.hasAttribute("aria-label")).toBe(false);
    expect(root.hasAttribute("aria-hidden")).toBe(false);
  });

  it("asChild renders directly on the consumer's child element", () => {
    const { container } = render(
      <Center asChild>
        <section data-testid="custom">
          <span>child</span>
        </section>
      </Center>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe("SECTION");
    expect(root.classList.contains("t-center")).toBe(true);
  });

  it("merges consumer className with t-center", () => {
    const { container } = render(
      <Center className="my-extra">
        <span>child</span>
      </Center>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains("t-center")).toBe(true);
    expect(root.classList.contains("my-extra")).toBe(true);
  });

  it("forwards ref to the underlying element", () => {
    let node: HTMLElement | null = null;
    render(
      <Center
        ref={(el) => {
          node = el;
        }}
      >
        <span>child</span>
      </Center>,
    );
    expect(node).not.toBeNull();
    expect((node as unknown as HTMLElement).tagName).toBe("DIV");
  });
});
