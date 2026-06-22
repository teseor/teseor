// @vitest-environment happy-dom
import {
  installDomPolyfills,
  resetDomPolyfills,
  uninstallDomPolyfills,
} from "@teseor/test-internals";
import { cleanup, render } from "@testing-library/react";
import { useRef } from "react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { Checkbox } from "./Checkbox.tsx";

beforeAll(installDomPolyfills);
afterAll(uninstallDomPolyfills);

afterEach(() => {
  cleanup();
  resetDomPolyfills();
});

describe("Checkbox (react)", () => {
  it("renders an <input type=checkbox> with the t-checkbox class", () => {
    const { container } = render(<Checkbox />);
    const root = container.firstElementChild as HTMLInputElement;
    expect(root.tagName).toBe("INPUT");
    expect(root.getAttribute("type")).toBe("checkbox");
    expect(root.classList.contains("t-checkbox")).toBe(true);
  });

  it("locks type=checkbox even when the consumer tries to override it", () => {
    const { container } = render(<Checkbox type="text" />);
    const root = container.firstElementChild as HTMLInputElement;
    expect(root.getAttribute("type")).toBe("checkbox");
  });

  it("forwards native checked / defaultChecked via fallthrough", () => {
    const { container } = render(<Checkbox defaultChecked />);
    const root = container.firstElementChild as HTMLInputElement;
    expect(root.checked).toBe(true);
  });

  it("sets the native indeterminate DOM property when indeterminate is true", () => {
    const { container } = render(<Checkbox indeterminate />);
    const root = container.firstElementChild as HTMLInputElement;
    expect(root.indeterminate).toBe(true);
  });

  it("clears the indeterminate DOM property when the prop is false", () => {
    const { container } = render(<Checkbox indeterminate={false} />);
    const root = container.firstElementChild as HTMLInputElement;
    expect(root.indeterminate).toBe(false);
  });

  it("does not emit an `indeterminate` HTML attribute (it is a JS property only)", () => {
    const { container } = render(<Checkbox indeterminate />);
    const root = container.firstElementChild as HTMLInputElement;
    expect(root.hasAttribute("indeterminate")).toBe(false);
  });

  it("composes the consumer ref alongside the wrapper's internal ref", () => {
    let captured: HTMLInputElement | null = null;
    function Harness() {
      const ref = useRef<HTMLInputElement | null>(null);
      return (
        <Checkbox
          indeterminate
          ref={(node) => {
            ref.current = node;
            captured = node;
          }}
        />
      );
    }
    render(<Harness />);
    expect(captured).not.toBeNull();
    expect((captured as unknown as HTMLInputElement).indeterminate).toBe(true);
  });

  it("passes the formControl substrate attributes through to the DOM", () => {
    const { container } = render(<Checkbox name="terms" form="signup" required disabled />);
    const root = container.firstElementChild as HTMLInputElement;
    expect(root.getAttribute("name")).toBe("terms");
    expect(root.getAttribute("form")).toBe("signup");
    expect(root.hasAttribute("required")).toBe(true);
    expect(root.hasAttribute("disabled")).toBe(true);
  });

  it("emits per-breakpoint data-size-* attrs for a responsive size", () => {
    const { container } = render(<Checkbox size={{ base: "sm", md: "lg" }} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-size")).toBe("sm");
    expect(root.getAttribute("data-size-md")).toBe("lg");
  });

  it("merges consumer className with t-checkbox", () => {
    const { container } = render(<Checkbox className="my-extra" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains("t-checkbox")).toBe(true);
    expect(root.classList.contains("my-extra")).toBe(true);
  });
});
