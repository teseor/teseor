import { describe, expect, it } from "vitest";
import { loadVocabulary } from "./vocabulary.ts";

describe("loadVocabulary", () => {
  it("exposes the structured events block", async () => {
    const vocab = await loadVocabulary();
    expect(vocab.events).toMatchObject({
      verbs: expect.any(Object),
      synonyms: expect.any(Object),
      pattern: expect.any(String),
      builtins: expect.any(Object),
    });
  });

  it("registers the core verbs", async () => {
    const { events } = await loadVocabulary();
    for (const verb of ["activate", "select", "submit", "dismiss", "change", "click"]) {
      expect(events.verbs).toHaveProperty(verb);
      expect(events.verbs[verb]).toBeTruthy();
    }
  });

  it("maps every synonym to either a registered verb or the controllable sentinel", async () => {
    const { events } = await loadVocabulary();
    for (const [synonym, canonical] of Object.entries(events.synonyms)) {
      expect(events.verbs).not.toHaveProperty(synonym);
      if (canonical !== "—") {
        expect(events.verbs).toHaveProperty(canonical);
      }
    }
  });

  it("routes the open synonym to the controllable sentinel", async () => {
    const { events } = await loadVocabulary();
    expect(events.synonyms.open).toBe("—");
  });

  it("compiles the event-name pattern as a regex that accepts canonical forms", async () => {
    const { events } = await loadVocabulary();
    const re = new RegExp(events.pattern);
    expect(re.test("dismiss")).toBe(true);
    expect(re.test("fileAdd")).toBe(true);
    expect(re.test("endReach")).toBe(true);
    expect(re.test("rowDoubleClick")).toBe(true);
    expect(re.test("sort_change")).toBe(false);
    expect(re.test("Dismiss")).toBe(false);
    expect(re.test("")).toBe(false);
  });

  it("registers the documented built-in payload types", async () => {
    const { events } = await loadVocabulary();
    for (const builtin of [
      "Date",
      "MouseEvent",
      "KeyboardEvent",
      "PointerEvent",
      "FocusEvent",
      "File",
      "Error",
      "HTMLElement",
    ]) {
      expect(events.builtins).toHaveProperty(builtin);
    }
  });
});
