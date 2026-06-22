// @vitest-environment happy-dom
import {
  installDomPolyfills,
  resetDomPolyfills,
  uninstallDomPolyfills,
} from "@teseor/test-internals";
import { cleanup, render } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { Switch } from "./Switch.tsx";

beforeAll(installDomPolyfills);
afterAll(uninstallDomPolyfills);

afterEach(() => {
  cleanup();
  resetDomPolyfills();
});

describe("Switch (react)", () => {
  it("renders an <input type=checkbox role=switch> with the t-switch class", () => {
    const { container } = render(<Switch />);
    const root = container.firstElementChild as HTMLInputElement;
    expect(root.tagName).toBe("INPUT");
    expect(root.getAttribute("type")).toBe("checkbox");
    expect(root.getAttribute("role")).toBe("switch");
    expect(root.classList.contains("t-switch")).toBe(true);
  });

  it("locks type=checkbox even when the consumer tries to override it", () => {
    // The wrapper emits `type="checkbox"` after `{...rest}` so the static attr
    // wins; a Switch with any other type would be a contract violation.
    const { container } = render(<Switch type="text" />);
    const root = container.firstElementChild as HTMLInputElement;
    expect(root.getAttribute("type")).toBe("checkbox");
  });

  it("forwards native checked / defaultChecked via fallthrough", () => {
    const { container } = render(<Switch defaultChecked />);
    const root = container.firstElementChild as HTMLInputElement;
    expect(root.checked).toBe(true);
  });

  it("passes the formControl substrate attributes through to the DOM", () => {
    const { container } = render(<Switch name="notifications" form="settings" required disabled />);
    const root = container.firstElementChild as HTMLInputElement;
    expect(root.getAttribute("name")).toBe("notifications");
    expect(root.getAttribute("form")).toBe("settings");
    expect(root.hasAttribute("required")).toBe(true);
    expect(root.hasAttribute("disabled")).toBe(true);
  });

  it("emits per-breakpoint data-size-* attrs for a responsive size", () => {
    const { container } = render(<Switch size={{ base: "sm", md: "lg" }} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-size")).toBe("sm");
    expect(root.getAttribute("data-size-md")).toBe("lg");
  });

  it("merges consumer className with t-switch", () => {
    const { container } = render(<Switch className="my-extra" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains("t-switch")).toBe(true);
    expect(root.classList.contains("my-extra")).toBe(true);
  });
});
