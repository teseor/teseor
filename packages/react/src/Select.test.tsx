// @vitest-environment happy-dom
import {
  installDomPolyfills,
  resetDomPolyfills,
  uninstallDomPolyfills,
} from "@teseor/test-internals";
import { cleanup, render } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { Select } from "./Select.tsx";

beforeAll(installDomPolyfills);
afterAll(uninstallDomPolyfills);

afterEach(() => {
  cleanup();
  resetDomPolyfills();
});

describe("Select (react)", () => {
  it("renders a <select> with the t-select class", () => {
    const { container } = render(<Select />);
    const root = container.firstElementChild as HTMLSelectElement;
    expect(root.tagName).toBe("SELECT");
    expect(root.classList.contains("t-select")).toBe(true);
  });

  it("passes <option> children through to the native element", () => {
    const { container } = render(
      <Select defaultValue="b">
        <option value="a">A</option>
        <option value="b">B</option>
        <option value="c">C</option>
      </Select>,
    );
    const root = container.firstElementChild as HTMLSelectElement;
    const options = Array.from(root.querySelectorAll("option"));
    expect(options).toHaveLength(3);
    expect(options.map((o) => o.value)).toEqual(["a", "b", "c"]);
    expect(root.value).toBe("b");
  });

  it("passes <optgroup> children through to the native element", () => {
    const { container } = render(
      <Select>
        <optgroup label="Group A">
          <option value="a1">A1</option>
          <option value="a2">A2</option>
        </optgroup>
        <optgroup label="Group B">
          <option value="b1">B1</option>
        </optgroup>
      </Select>,
    );
    const root = container.firstElementChild as HTMLSelectElement;
    const groups = Array.from(root.querySelectorAll("optgroup"));
    expect(groups).toHaveLength(2);
    expect(groups[0]?.getAttribute("label")).toBe("Group A");
    expect(root.querySelectorAll("option")).toHaveLength(3);
  });

  it("forwards the multiple attribute via fallthrough", () => {
    const { container } = render(
      <Select multiple>
        <option value="a">A</option>
      </Select>,
    );
    const root = container.firstElementChild as HTMLSelectElement;
    expect(root.multiple).toBe(true);
    expect(root.hasAttribute("multiple")).toBe(true);
  });

  it("passes the formControl substrate attributes through to the DOM", () => {
    const { container } = render(<Select name="country" form="contact" required disabled />);
    const root = container.firstElementChild as HTMLSelectElement;
    expect(root.getAttribute("name")).toBe("country");
    expect(root.getAttribute("form")).toBe("contact");
    expect(root.hasAttribute("required")).toBe(true);
    expect(root.hasAttribute("disabled")).toBe(true);
  });

  it("emits data-variant when variant is set", () => {
    const { container } = render(<Select variant="subtle" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-variant")).toBe("subtle");
  });

  it("omits data-variant when variant is unset (absence-of-attr state)", () => {
    const { container } = render(<Select />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.hasAttribute("data-variant")).toBe(false);
  });

  it("emits data-size for a plain string size", () => {
    const { container } = render(<Select size="sm" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-size")).toBe("sm");
  });

  it("emits per-breakpoint data-size-* attrs for a responsive size", () => {
    const { container } = render(<Select size={{ base: "sm", md: "lg" }} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-size")).toBe("sm");
    expect(root.getAttribute("data-size-md")).toBe("lg");
  });

  it("emits data-invalid only when invalid is true", () => {
    const { container: off } = render(<Select />);
    expect((off.firstElementChild as HTMLElement).hasAttribute("data-invalid")).toBe(false);

    const { container: on } = render(<Select invalid />);
    expect((on.firstElementChild as HTMLElement).getAttribute("data-invalid")).toBe("true");
  });

  it("merges consumer className with t-select", () => {
    const { container } = render(<Select className="my-extra" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains("t-select")).toBe(true);
    expect(root.classList.contains("my-extra")).toBe(true);
  });

  it("forwards ref to the underlying <select>", () => {
    let captured: HTMLSelectElement | null = null;
    render(
      <Select
        ref={(node) => {
          captured = node;
        }}
      />,
    );
    expect(captured).not.toBeNull();
    expect((captured as unknown as HTMLSelectElement).tagName).toBe("SELECT");
  });
});
