import { describe, expect, it } from "vitest";
import { pascalCase } from "./pascal-case.ts";

describe("pascalCase", () => {
  it("converts kebab-case", () => {
    expect(pascalCase("date-picker")).toBe("DatePicker");
  });

  it("converts snake_case", () => {
    expect(pascalCase("date_picker")).toBe("DatePicker");
  });

  it("handles single words", () => {
    expect(pascalCase("button")).toBe("Button");
  });

  it("handles empty segments", () => {
    expect(pascalCase("tooltip--anchor")).toBe("TooltipAnchor");
  });
});
