// @vitest-environment happy-dom
import {
  installDomPolyfills,
  resetDomPolyfills,
  uninstallDomPolyfills,
} from "@teseor/test-internals";
import { cleanup, render } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { Input } from "./Input.tsx";

beforeAll(installDomPolyfills);
afterAll(uninstallDomPolyfills);

afterEach(() => {
  cleanup();
  resetDomPolyfills();
});

describe("Input (react)", () => {
  it("renders an <input> with the t-input class", () => {
    const { container } = render(<Input />);
    const root = container.firstElementChild as HTMLInputElement;
    expect(root.tagName).toBe("INPUT");
    expect(root.classList.contains("t-input")).toBe(true);
  });

  it("forwards the native type attribute via fallthrough", () => {
    const { container } = render(<Input type="email" />);
    const root = container.firstElementChild as HTMLInputElement;
    expect(root.getAttribute("type")).toBe("email");
  });

  it("forwards placeholder via fallthrough", () => {
    const { container } = render(<Input placeholder="Email address" />);
    const root = container.firstElementChild as HTMLInputElement;
    expect(root.getAttribute("placeholder")).toBe("Email address");
  });

  it("passes the formControl substrate attributes through to the DOM", () => {
    const { container } = render(<Input name="email" form="contact" required readOnly disabled />);
    const root = container.firstElementChild as HTMLInputElement;
    expect(root.getAttribute("name")).toBe("email");
    expect(root.getAttribute("form")).toBe("contact");
    expect(root.hasAttribute("required")).toBe(true);
    expect(root.hasAttribute("readonly")).toBe(true);
    expect(root.hasAttribute("disabled")).toBe(true);
  });

  it("emits data-variant when variant is set", () => {
    const { container } = render(<Input variant="subtle" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-variant")).toBe("subtle");
  });

  it("omits data-variant when variant is unset (absence-of-attr state)", () => {
    const { container } = render(<Input />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.hasAttribute("data-variant")).toBe(false);
  });

  it("emits data-size for a plain string size", () => {
    const { container } = render(<Input size="sm" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-size")).toBe("sm");
  });

  it("emits per-breakpoint data-size-* attrs for a responsive size", () => {
    const { container } = render(<Input size={{ base: "sm", md: "lg" }} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-size")).toBe("sm");
    expect(root.getAttribute("data-size-md")).toBe("lg");
  });

  it("emits data-invalid only when invalid is true", () => {
    const { container: off } = render(<Input />);
    expect((off.firstElementChild as HTMLElement).hasAttribute("data-invalid")).toBe(false);

    const { container: on } = render(<Input invalid />);
    expect((on.firstElementChild as HTMLElement).getAttribute("data-invalid")).toBe("true");
  });

  it("merges consumer className with t-input", () => {
    const { container } = render(<Input className="my-extra" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains("t-input")).toBe(true);
    expect(root.classList.contains("my-extra")).toBe(true);
  });

  it("forwards ref to the underlying <input>", () => {
    let captured: HTMLInputElement | null = null;
    render(
      <Input
        ref={(node) => {
          captured = node;
        }}
      />,
    );
    expect(captured).not.toBeNull();
    expect((captured as unknown as HTMLInputElement).tagName).toBe("INPUT");
  });
});
