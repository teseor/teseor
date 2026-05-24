import { describe, expect, test } from "vitest";
import { renderTable, section, tableRows } from "./table-printer.ts";

describe("tableRows", () => {
  test("returns empty string for no rows", () => {
    expect(tableRows([])).toBe("");
  });

  test("renders one row with cells", () => {
    expect(tableRows([["a", "b"]])).toBe("        <tr><td>a</td><td>b</td></tr>");
  });

  test("joins multiple rows with a newline", () => {
    expect(tableRows([["a"], ["b"]])).toBe(
      ["        <tr><td>a</td></tr>", "        <tr><td>b</td></tr>"].join("\n"),
    );
  });
});

describe("section", () => {
  test("wraps body in a `t-stack` section with the title", () => {
    expect(section("Props", "      <p>body</p>")).toBe(
      [
        '    <section class="t-stack" data-gap="3">',
        "      <h2>Props</h2>",
        "      <p>body</p>",
        "    </section>",
      ].join("\n"),
    );
  });
});

describe("renderTable", () => {
  test("emits a full `<table>` with thead and tbody", () => {
    expect(renderTable(["A", "B"], [["1", "2"]])).toBe(
      [
        "      <table>",
        "        <thead><tr><th>A</th><th>B</th></tr></thead>",
        "        <tbody>",
        "        <tr><td>1</td><td>2</td></tr>",
        "        </tbody>",
        "      </table>",
      ].join("\n"),
    );
  });

  test("emits an empty tbody when no rows are given", () => {
    expect(renderTable(["A"], [])).toBe(
      [
        "      <table>",
        "        <thead><tr><th>A</th></tr></thead>",
        "        <tbody>",
        "",
        "        </tbody>",
        "      </table>",
      ].join("\n"),
    );
  });
});
