// @vitest-environment happy-dom
import {
  installDomPolyfills,
  resetDomPolyfills,
  uninstallDomPolyfills,
} from "@teseor/test-internals";
import { cleanup, render } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { Blockquote } from "./Blockquote.tsx";

beforeAll(installDomPolyfills);
afterAll(uninstallDomPolyfills);

afterEach(() => {
  cleanup();
  resetDomPolyfills();
});

describe("Blockquote (react)", () => {
  it("renders a <blockquote> with the t-blockquote class", () => {
    const { container } = render(<Blockquote>Body</Blockquote>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe("BLOCKQUOTE");
    expect(root.classList.contains("t-blockquote")).toBe(true);
    expect(root.textContent).toBe("Body");
  });

  it("emits `data-variant` only when `variant` is set", () => {
    const { container, rerender } = render(<Blockquote>Body</Blockquote>);
    let root = container.firstElementChild as HTMLElement;
    expect(root.hasAttribute("data-variant")).toBe(false);

    rerender(<Blockquote variant="subtle">Body</Blockquote>);
    root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-variant")).toBe("subtle");
  });

  it("passes native `cite` HTML attribute through", () => {
    const { container } = render(<Blockquote cite="https://example.com/source">Body</Blockquote>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("cite")).toBe("https://example.com/source");
  });

  it("composes a <cite> child for source attribution", () => {
    const { container } = render(
      <Blockquote>
        <p>The quote text.</p>
        <cite>— Author</cite>
      </Blockquote>,
    );
    const root = container.firstElementChild as HTMLElement;
    const citeEl = root.querySelector("cite");
    expect(citeEl).not.toBeNull();
    expect(citeEl?.textContent).toBe("— Author");
  });

  it("merges consumer className with `t-blockquote`", () => {
    const { container } = render(<Blockquote className="my-extra">Body</Blockquote>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains("t-blockquote")).toBe(true);
    expect(root.classList.contains("my-extra")).toBe(true);
  });

  it("asChild renders directly on the consumer's child element", () => {
    const { container } = render(
      <Blockquote asChild>
        <figure>Composed</figure>
      </Blockquote>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe("FIGURE");
    expect(root.classList.contains("t-blockquote")).toBe(true);
  });
});
