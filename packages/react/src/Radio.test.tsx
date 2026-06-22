// @vitest-environment happy-dom
import {
  installDomPolyfills,
  resetDomPolyfills,
  uninstallDomPolyfills,
} from "@teseor/test-internals";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { Radio } from "./Radio.tsx";

beforeAll(installDomPolyfills);
afterAll(uninstallDomPolyfills);

afterEach(() => {
  cleanup();
  resetDomPolyfills();
});

describe("Radio (react)", () => {
  it("renders an <input type=radio> with the t-radio class", () => {
    const { container } = render(<Radio />);
    const root = container.firstElementChild as HTMLInputElement;
    expect(root.tagName).toBe("INPUT");
    expect(root.getAttribute("type")).toBe("radio");
    expect(root.classList.contains("t-radio")).toBe(true);
  });

  it("locks type=radio even when the consumer tries to override it", () => {
    const { container } = render(<Radio type="text" />);
    const root = container.firstElementChild as HTMLInputElement;
    expect(root.getAttribute("type")).toBe("radio");
  });

  it("forwards native checked / defaultChecked via fallthrough", () => {
    const { container } = render(<Radio defaultChecked />);
    const root = container.firstElementChild as HTMLInputElement;
    expect(root.checked).toBe(true);
  });

  it("respects native group exclusivity when three radios share a name", () => {
    const { container } = render(
      <form>
        <Radio name="plan" value="free" defaultChecked />
        <Radio name="plan" value="pro" />
        <Radio name="plan" value="team" />
      </form>,
    );
    const radios = Array.from(container.querySelectorAll<HTMLInputElement>("input.t-radio"));
    expect(radios).toHaveLength(3);
    expect(radios[0]?.checked).toBe(true);
    expect(radios[1]?.checked).toBe(false);
    expect(radios[2]?.checked).toBe(false);

    fireEvent.click(radios[1] as HTMLInputElement);
    expect(radios[0]?.checked).toBe(false);
    expect(radios[1]?.checked).toBe(true);
    expect(radios[2]?.checked).toBe(false);
  });

  it("does not affect radios in a different group", () => {
    const { container } = render(
      <form>
        <Radio name="a" defaultChecked />
        <Radio name="b" defaultChecked />
      </form>,
    );
    const radios = Array.from(container.querySelectorAll<HTMLInputElement>("input.t-radio"));
    expect(radios[0]?.checked).toBe(true);
    expect(radios[1]?.checked).toBe(true);
  });

  it("passes the formControl substrate attributes through to the DOM", () => {
    const { container } = render(<Radio name="plan" form="signup" required disabled />);
    const root = container.firstElementChild as HTMLInputElement;
    expect(root.getAttribute("name")).toBe("plan");
    expect(root.getAttribute("form")).toBe("signup");
    expect(root.hasAttribute("required")).toBe(true);
    expect(root.hasAttribute("disabled")).toBe(true);
  });

  it("emits per-breakpoint data-size-* attrs for a responsive size", () => {
    const { container } = render(<Radio size={{ base: "sm", md: "lg" }} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-size")).toBe("sm");
    expect(root.getAttribute("data-size-md")).toBe("lg");
  });

  it("merges consumer className with t-radio", () => {
    const { container } = render(<Radio className="my-extra" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains("t-radio")).toBe(true);
    expect(root.classList.contains("my-extra")).toBe(true);
  });
});
