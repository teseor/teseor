// @vitest-environment happy-dom
import {
  installDomPolyfills,
  resetDomPolyfills,
  uninstallDomPolyfills,
} from "@teseor/test-internals";
import { cleanup, render } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { Textarea } from "./Textarea.tsx";

beforeAll(installDomPolyfills);
afterAll(uninstallDomPolyfills);

afterEach(() => {
  cleanup();
  resetDomPolyfills();
});

describe("Textarea (react)", () => {
  it("renders a <textarea> with the t-textarea class and no children", () => {
    const { container } = render(<Textarea />);
    const root = container.firstElementChild as HTMLTextAreaElement;
    expect(root.tagName).toBe("TEXTAREA");
    expect(root.classList.contains("t-textarea")).toBe(true);
    expect(root.textContent).toBe("");
  });

  it("forwards native rows / cols via fallthrough", () => {
    const { container } = render(<Textarea rows={4} cols={20} />);
    const root = container.firstElementChild as HTMLTextAreaElement;
    expect(root.getAttribute("rows")).toBe("4");
    expect(root.getAttribute("cols")).toBe("20");
  });

  it("forwards placeholder via fallthrough", () => {
    const { container } = render(<Textarea placeholder="Your message" />);
    const root = container.firstElementChild as HTMLTextAreaElement;
    expect(root.getAttribute("placeholder")).toBe("Your message");
  });

  it("passes the formControl substrate attributes through to the DOM", () => {
    const { container } = render(
      <Textarea name="comment" form="contact" required readOnly disabled />,
    );
    const root = container.firstElementChild as HTMLTextAreaElement;
    expect(root.getAttribute("name")).toBe("comment");
    expect(root.getAttribute("form")).toBe("contact");
    expect(root.hasAttribute("required")).toBe(true);
    expect(root.hasAttribute("readonly")).toBe(true);
    expect(root.hasAttribute("disabled")).toBe(true);
  });

  it("emits data-resize when resize is set", () => {
    const { container } = render(<Textarea resize="none" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-resize")).toBe("none");
  });

  it("omits data-resize when resize is unset (absence-of-attr state)", () => {
    const { container } = render(<Textarea />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.hasAttribute("data-resize")).toBe(false);
  });

  it("emits data-variant when variant is set", () => {
    const { container } = render(<Textarea variant="subtle" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-variant")).toBe("subtle");
  });

  it("emits per-breakpoint data-size-* attrs for a responsive size", () => {
    const { container } = render(<Textarea size={{ base: "sm", md: "lg" }} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-size")).toBe("sm");
    expect(root.getAttribute("data-size-md")).toBe("lg");
  });

  it("emits data-invalid only when invalid is true", () => {
    const { container: off } = render(<Textarea />);
    expect((off.firstElementChild as HTMLElement).hasAttribute("data-invalid")).toBe(false);

    const { container: on } = render(<Textarea invalid />);
    expect((on.firstElementChild as HTMLElement).getAttribute("data-invalid")).toBe("true");
  });

  it("merges consumer className with t-textarea", () => {
    const { container } = render(<Textarea className="my-extra" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains("t-textarea")).toBe(true);
    expect(root.classList.contains("my-extra")).toBe(true);
  });
});
