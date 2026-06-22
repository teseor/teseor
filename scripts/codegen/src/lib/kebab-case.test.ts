import { describe, expect, it } from "vitest";
import { kebabCase } from "./kebab-case.ts";

describe("kebabCase", () => {
  it("leaves single-word lowercase names unchanged", () => {
    expect(kebabCase("size")).toBe("size");
    expect(kebabCase("variant")).toBe("variant");
  });

  it("converts camelCase", () => {
    expect(kebabCase("minHeight")).toBe("min-height");
    expect(kebabCase("aspectRatio")).toBe("aspect-ratio");
  });

  it("converts PascalCase", () => {
    expect(kebabCase("MinHeight")).toBe("min-height");
  });

  it("converts snake_case", () => {
    expect(kebabCase("min_height")).toBe("min-height");
  });

  it("collapses runs of separators", () => {
    expect(kebabCase("min   height")).toBe("min-height");
    expect(kebabCase("min__height")).toBe("min-height");
  });

  it("handles digit boundaries", () => {
    expect(kebabCase("size2X")).toBe("size2-x");
    expect(kebabCase("v1Major")).toBe("v1-major");
  });
});
