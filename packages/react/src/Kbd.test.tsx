// @vitest-environment happy-dom
import {
  installDomPolyfills,
  resetDomPolyfills,
  uninstallDomPolyfills,
} from "@teseor/test-internals";
import { cleanup, render } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { Kbd } from "./Kbd.tsx";

beforeAll(installDomPolyfills);
afterAll(uninstallDomPolyfills);

afterEach(() => {
  cleanup();
  resetDomPolyfills();
});

describe("Kbd (react)", () => {
  it("renders a <kbd> with the t-kbd class", () => {
    const { container } = render(<Kbd>Cmd</Kbd>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe("KBD");
    expect(root.classList.contains("t-kbd")).toBe(true);
    expect(root.textContent).toBe("Cmd");
  });

  it("emits `data-size` only when `size` is set", () => {
    const { container, rerender } = render(<Kbd>K</Kbd>);
    let root = container.firstElementChild as HTMLElement;
    expect(root.hasAttribute("data-size")).toBe(false);

    rerender(<Kbd size="lg">K</Kbd>);
    root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-size")).toBe("lg");
  });

  it("composes keyboard combos via nested children, not a prop", () => {
    const { container } = render(
      <>
        <Kbd>Cmd</Kbd>
        <span>+</span>
        <Kbd>K</Kbd>
      </>,
    );
    const kbds = container.querySelectorAll("kbd");
    expect(kbds.length).toBe(2);
    expect(kbds[0]?.textContent).toBe("Cmd");
    expect(kbds[1]?.textContent).toBe("K");
  });

  it("merges consumer className with `t-kbd`", () => {
    const { container } = render(<Kbd className="my-extra">K</Kbd>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains("t-kbd")).toBe(true);
    expect(root.classList.contains("my-extra")).toBe(true);
  });

  it("asChild renders directly on the consumer's child element", () => {
    const { container } = render(
      <Kbd asChild>
        <span>K</span>
      </Kbd>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe("SPAN");
    expect(root.classList.contains("t-kbd")).toBe(true);
  });
});
