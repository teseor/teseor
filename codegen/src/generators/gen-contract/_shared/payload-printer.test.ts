import { describe, expect, it } from "vitest";
import { payloadEntryToTS, renderPayloadFields } from "./payload-printer.ts";

describe("payloadEntryToTS", () => {
  it("maps primitive variants to their TS equivalents", () => {
    expect(payloadEntryToTS({ type: "string" })).toBe("string");
    expect(payloadEntryToTS({ type: "number" })).toBe("number");
    expect(payloadEntryToTS({ type: "boolean" })).toBe("boolean");
  });

  it("renders enum variants as a string union", () => {
    expect(payloadEntryToTS({ type: "enum", values: ["outside", "escape"] })).toBe(
      '"outside" | "escape"',
    );
  });

  it("renders generic refs as the bare type name", () => {
    expect(payloadEntryToTS({ type: "generic", ref: "Item" })).toBe("Item");
  });

  it("renders builtin payloads as the bare builtin name", () => {
    expect(payloadEntryToTS({ type: "builtin", name: "File" })).toBe("File");
  });

  it("renders arrays as Array<…>", () => {
    expect(payloadEntryToTS({ type: "array", of: { type: "generic", ref: "Row" } })).toBe(
      "Array<Row>",
    );
  });

  it("renders nested arrays", () => {
    expect(
      payloadEntryToTS({
        type: "array",
        of: { type: "array", of: { type: "string" } },
      }),
    ).toBe("Array<Array<string>>");
  });

  it("unions a nullable variant with null", () => {
    expect(payloadEntryToTS({ type: "string", nullable: true })).toBe("string | null");
    expect(payloadEntryToTS({ type: "enum", values: ["asc", "desc"], nullable: true })).toBe(
      '"asc" | "desc" | null',
    );
  });
});

describe("renderPayloadFields", () => {
  it("renders a multi-field payload joined by '; '", () => {
    expect(
      renderPayloadFields({
        reason: { type: "enum", values: ["outside", "escape"] },
        depth: { type: "number" },
      }),
    ).toBe('reason: "outside" | "escape"; depth: number');
  });

  it("returns an empty string for an empty payload", () => {
    expect(renderPayloadFields({})).toBe("");
  });
});
