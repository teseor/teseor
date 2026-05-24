import { describe, expect, it } from "vitest";
import {
  diffVocabularies,
  parseHandlerKeys,
  parseVocabulary,
} from "./react-event-vocabulary-sync.ts";

describe("parseVocabulary", () => {
  it("extracts the array literals from a well-formed block", () => {
    const source = `
      export const REACT_EVENT_VOCABULARY = [
        "click",
        "keydown",
        "pointerenter",
      ] as const;
    `;
    expect(parseVocabulary(source)).toEqual(["click", "keydown", "pointerenter"]);
  });

  it("ignores comments inside the block", () => {
    const source = `
      export const REACT_EVENT_VOCABULARY = [
        // a leading line comment
        "click",
        "keydown", // trailing
      ] as const;
    `;
    expect(parseVocabulary(source)).toEqual(["click", "keydown"]);
  });

  it("returns sorted output regardless of source order", () => {
    const source = `
      export const REACT_EVENT_VOCABULARY = [
        "pointerenter",
        "click",
        "keydown",
      ] as const;
    `;
    expect(parseVocabulary(source)).toEqual(["click", "keydown", "pointerenter"]);
  });

  it("returns undefined when the marker is missing", () => {
    expect(parseVocabulary("export const SOMETHING_ELSE = [] as const;")).toBeUndefined();
  });
});

describe("parseHandlerKeys", () => {
  it("extracts bare-identifier keys from the EVENT_TO_HANDLER block", () => {
    const source = `
      const EVENT_TO_HANDLER: Record<string, string> = {
        pointerenter: "onPointerEnter",
        click: "onClick",
        keydown: "onKeyDown",
      };
    `;
    expect(parseHandlerKeys(source)).toEqual(["click", "keydown", "pointerenter"]);
  });

  it("extracts quoted keys", () => {
    const source = `
      const EVENT_TO_HANDLER: Record<string, string> = {
        "pointerenter": "onPointerEnter",
        'click': "onClick",
      };
    `;
    expect(parseHandlerKeys(source)).toEqual(["click", "pointerenter"]);
  });

  it("returns undefined when the const is missing", () => {
    expect(parseHandlerKeys("const SOMETHING_ELSE = {};")).toBeUndefined();
  });

  it("returns undefined when the block is unterminated", () => {
    // Defensive: the closing `};` is the anchor; without it the regex won't match.
    const source = `const EVENT_TO_HANDLER: Record<string, string> = {
      pointerenter: "onPointerEnter",
    `;
    expect(parseHandlerKeys(source)).toBeUndefined();
  });
});

describe("diffVocabularies", () => {
  it("returns empty arrays when both lists agree", () => {
    expect(diffVocabularies(["a", "b", "c"], ["a", "b", "c"])).toEqual({
      onlyInVocab: [],
      onlyInHandler: [],
    });
  });

  it("flags entries only in the vocabulary", () => {
    expect(diffVocabularies(["a", "b", "c"], ["a", "b"])).toEqual({
      onlyInVocab: ["c"],
      onlyInHandler: [],
    });
  });

  it("flags entries only in the handler keys", () => {
    expect(diffVocabularies(["a", "b"], ["a", "b", "c"])).toEqual({
      onlyInVocab: [],
      onlyInHandler: ["c"],
    });
  });

  it("flags mismatches in both directions", () => {
    expect(diffVocabularies(["a", "b", "x"], ["a", "b", "y"])).toEqual({
      onlyInVocab: ["x"],
      onlyInHandler: ["y"],
    });
  });
});

describe("end-to-end against the real repo", () => {
  // The check is workspace-scoped — at this point in the PR both files
  // exist and should agree. If a later commit drifts either side, this is
  // the first signal.
  it("the real REACT_EVENT_VOCABULARY equals the real EVENT_TO_HANDLER keys", async () => {
    const { readFile } = await import("node:fs/promises");
    const { resolve, dirname } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
    const vocabSrc = await readFile(
      resolve(repoRoot, "scripts/codegen/src/lib/react-events.ts"),
      "utf8",
    );
    const hookSrc = await readFile(
      resolve(repoRoot, "packages/react/src/hooks/useOverlay.ts"),
      "utf8",
    );
    expect(parseVocabulary(vocabSrc)).toEqual(parseHandlerKeys(hookSrc));
  });
});
