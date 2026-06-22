// @vitest-environment happy-dom
import {
  installDomPolyfills,
  resetDomPolyfills,
  uninstallDomPolyfills,
} from "@teseor/test-internals";
import { cleanup, render } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { List } from "./List.tsx";

beforeAll(installDomPolyfills);
afterAll(uninstallDomPolyfills);

afterEach(() => {
  cleanup();
  resetDomPolyfills();
});

describe("List (react)", () => {
  it("renders <ul> when `ordered` is omitted (spec default)", () => {
    const { container } = render(
      <List>
        <li>One</li>
      </List>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe("UL");
    expect(root.classList.contains("t-list")).toBe(true);
  });

  it('renders <ul> when `ordered` is "false"', () => {
    const { container } = render(
      <List ordered="false">
        <li>One</li>
      </List>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe("UL");
  });

  it('renders <ol> when `ordered` is "true"', () => {
    const { container } = render(
      <List ordered="true">
        <li>One</li>
      </List>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe("OL");
  });

  it("passes native <ol> attributes through via `asChild` (start, type)", () => {
    const { container } = render(
      <List ordered="true" asChild>
        <ol start={5} type="i">
          <li>One</li>
        </ol>
      </List>,
    );
    const root = container.firstElementChild as HTMLOListElement;
    expect(root.tagName).toBe("OL");
    expect(root.classList.contains("t-list")).toBe(true);
    expect(root.getAttribute("start")).toBe("5");
    expect(root.getAttribute("type")).toBe("i");
  });

  it("renders bare <li> children directly", () => {
    const { container } = render(
      <List>
        <li>First</li>
        <li>Second</li>
      </List>,
    );
    const root = container.firstElementChild as HTMLElement;
    const items = root.querySelectorAll(":scope > li");
    expect(items.length).toBe(2);
    expect(items[0]?.textContent).toBe("First");
    expect(items[1]?.textContent).toBe("Second");
  });

  it("renders a nested list via children composition", () => {
    const { container } = render(
      <List>
        <li>
          Outer
          <List ordered="true">
            <li>Inner</li>
          </List>
        </li>
      </List>,
    );
    const outer = container.firstElementChild as HTMLElement;
    expect(outer.tagName).toBe("UL");
    const inner = outer.querySelector("ol");
    expect(inner).not.toBeNull();
    expect(inner?.classList.contains("t-list")).toBe(true);
    expect(inner?.textContent).toBe("Inner");
  });

  it("emits `data-spacing` when `spacing` is set; omits it otherwise", () => {
    const { container, rerender } = render(
      <List>
        <li>One</li>
      </List>,
    );
    let root = container.firstElementChild as HTMLElement;
    expect(root.hasAttribute("data-spacing")).toBe(false);

    rerender(
      <List spacing="compact">
        <li>One</li>
      </List>,
    );
    root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-spacing")).toBe("compact");
  });

  it("emits responsive `data-spacing-<bp>` attributes for the object form", () => {
    const { container } = render(
      <List spacing={{ base: "compact", md: "comfortable" }}>
        <li>One</li>
      </List>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-spacing")).toBe("compact");
    expect(root.getAttribute("data-spacing-md")).toBe("comfortable");
  });

  it("merges consumer className with `t-list`", () => {
    const { container } = render(
      <List className="my-extra">
        <li>One</li>
      </List>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains("t-list")).toBe(true);
    expect(root.classList.contains("my-extra")).toBe(true);
  });

  it("asChild renders directly on the consumer's child element", () => {
    const { container } = render(
      <List asChild>
        <nav aria-label="primary">
          <li>One</li>
        </nav>
      </List>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe("NAV");
    expect(root.classList.contains("t-list")).toBe(true);
    expect(root.getAttribute("aria-label")).toBe("primary");
  });
});
