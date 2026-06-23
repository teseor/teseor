import { describe, expect, it } from "vitest";
import type { Spec, SpecPart } from "../schema.ts";
import { Spec as SpecSchema } from "../schema.ts";
import type { AtomicSpec, Issue } from "./check-utils.ts";
import {
  collectDimensionValues,
  isAtomic,
  isComposite,
  issue,
  levenshtein,
  suggest,
  suggestionFragment,
  visitAllNodes,
  visitCompositeParts,
  visitNodes,
  visitPart,
} from "./check-utils.ts";

function makeAtomicSpec(overrides: Partial<Spec> = {}): Spec {
  return SpecSchema.parse({
    name: "button",
    kind: "atomic",
    element: "button",
    rootClass: "t-button",
    ...overrides,
  });
}

function makeCompositeSpec(overrides: Partial<Spec> = {}): Spec {
  return SpecSchema.parse({
    name: "dialog",
    kind: "composite",
    parts: {
      trigger: { element: "button" },
      panel: { element: "div" },
    },
    ...overrides,
  });
}

function makePart(overrides: Partial<SpecPart> = {}): SpecPart {
  return { element: "div", ...overrides };
}

describe("levenshtein", () => {
  it("returns 0 for equal strings", () => {
    expect(levenshtein("foo", "foo")).toBe(0);
  });

  it("is symmetric", () => {
    expect(levenshtein("abc", "xyz")).toBe(levenshtein("xyz", "abc"));
  });

  it("returns b.length when a is empty", () => {
    expect(levenshtein("", "hello")).toBe(5);
  });

  it("returns a.length when b is empty", () => {
    expect(levenshtein("world", "")).toBe(5);
  });

  it("returns 1 for one substitution", () => {
    expect(levenshtein("cat", "bat")).toBe(1);
  });

  it("returns 1 for one insertion", () => {
    expect(levenshtein("cat", "cats")).toBe(1);
  });

  it("returns 1 for one deletion", () => {
    expect(levenshtein("cats", "cat")).toBe(1);
  });
});

describe("suggest", () => {
  it("finds a close match within default distance", () => {
    const result = suggest("priamry", ["primary", "secondary", "danger"]);
    expect(result).toBe("primary");
  });

  it("returns undefined when no option is within range", () => {
    const result = suggest("zzz", ["primary", "secondary"]);
    expect(result).toBeUndefined();
  });

  it("respects custom maxDistance", () => {
    const result = suggest("abc", ["xyz"], 10);
    expect(result).toBe("xyz");
  });

  it("returns the closest option when multiple are in range", () => {
    const result = suggest("cta", ["cat", "bat", "zzzz"]);
    expect(result).toBe("cat");
  });
});

describe("suggestionFragment", () => {
  it("returns a hint string when a close match exists", () => {
    const fragment = suggestionFragment("priamry", ["primary", "secondary"]);
    expect(fragment).toBe(" Did you mean 'primary'?");
  });

  it("returns empty string when no match is close enough", () => {
    const fragment = suggestionFragment("zzz", ["primary", "secondary"]);
    expect(fragment).toBe("");
  });
});

describe("issue", () => {
  it("returns the correct shape", () => {
    const result: Issue = issue("button", "props.color", "unknown value");
    expect(result).toEqual({ spec: "button", path: "props.color", message: "unknown value" });
  });
});

describe("isAtomic", () => {
  it("returns true for atomic specs", () => {
    const spec = makeAtomicSpec();
    expect(isAtomic(spec)).toBe(true);
  });

  it("returns false for composite specs", () => {
    const spec = makeCompositeSpec();
    expect(isAtomic(spec)).toBe(false);
  });
});

describe("isComposite", () => {
  it("returns true for composite specs", () => {
    const spec = makeCompositeSpec();
    expect(isComposite(spec)).toBe(true);
  });

  it("returns false for atomic specs", () => {
    const spec = makeAtomicSpec();
    expect(isComposite(spec)).toBe(false);
  });
});

describe("visitPart", () => {
  it("visits the part itself", () => {
    const part = makePart();
    const visited: string[] = [];
    visitPart(part, "parts.root", (_, path) => visited.push(path));
    expect(visited).toContain("parts.root");
  });

  it("visits nested child parts recursively", () => {
    const child = makePart();
    const parent = makePart({ parts: { child: child } });
    const visited: string[] = [];
    visitPart(parent, "parts.root", (_, path) => visited.push(path));
    expect(visited).toContain("parts.root");
    expect(visited).toContain("parts.root.parts.child");
  });
});

describe("visitNodes", () => {
  it("visits the atomic root with empty path", () => {
    const spec = makeAtomicSpec();
    const visited: Array<{ path: string }> = [];
    visitNodes(spec, (_, path) => visited.push({ path }));
    expect(visited).toHaveLength(1);
    expect(visited[0]?.path).toBe("");
  });

  it("visits composite parts", () => {
    const spec = makeCompositeSpec();
    const visited: string[] = [];
    visitNodes(spec, (_, path) => visited.push(path));
    expect(visited).toContain("parts.trigger");
    expect(visited).toContain("parts.panel");
  });

  it("visits composite parts recursively", () => {
    const spec = makeCompositeSpec({
      parts: {
        trigger: { element: "button" },
        panel: { element: "div", parts: { header: { element: "div" } } },
      },
    });
    const visited: string[] = [];
    visitNodes(spec, (_, path) => visited.push(path));
    expect(visited).toContain("parts.panel");
    expect(visited).toContain("parts.panel.parts.header");
  });
});

describe("visitCompositeParts", () => {
  it("visits all parts at root level", () => {
    const parts = {
      trigger: makePart(),
      panel: makePart(),
    };
    const visited: SpecPart[] = [];
    visitCompositeParts(parts, (p) => visited.push(p));
    expect(visited).toHaveLength(2);
  });

  it("visits nested parts recursively", () => {
    const child = makePart();
    const parent = makePart({ parts: { child } });
    const parts = { parent };
    const visited: SpecPart[] = [];
    visitCompositeParts(parts, (p) => visited.push(p));
    expect(visited).toHaveLength(2);
  });
});

describe("visitAllNodes", () => {
  it("invokes fn once with the atomic root for an atomic spec", () => {
    const spec = makeAtomicSpec();
    const visited: Array<AtomicSpec | SpecPart> = [];
    visitAllNodes(spec, (node) => visited.push(node));
    expect(visited).toHaveLength(1);
    expect(visited[0]).toBe(spec);
  });

  it("invokes fn once per part for a flat composite spec", () => {
    const spec = makeCompositeSpec();
    const visited: Array<AtomicSpec | SpecPart> = [];
    visitAllNodes(spec, (node) => visited.push(node));
    expect(visited).toHaveLength(2);
  });

  it("invokes fn for all nested parts in a composite spec", () => {
    const spec = makeCompositeSpec({
      parts: {
        trigger: { element: "button" },
        panel: { element: "div", parts: { header: { element: "div" } } },
      },
    });
    const visited: Array<AtomicSpec | SpecPart> = [];
    visitAllNodes(spec, (node) => visited.push(node));
    expect(visited).toHaveLength(3);
  });

  it("passes SpecPart nodes (not AtomicSpec) for composite parts", () => {
    const spec = makeCompositeSpec();
    const visited: Array<AtomicSpec | SpecPart> = [];
    visitAllNodes(spec, (node) => visited.push(node));
    for (const node of visited) {
      expect("element" in node).toBe(true);
    }
  });
});

describe("collectDimensionValues", () => {
  it("returns variant keys for 'variant' dim", () => {
    const spec = makeAtomicSpec({
      variants: { solid: { description: "Solid." }, outline: { description: "Outlined." } },
    }) as AtomicSpec;
    expect(collectDimensionValues(spec, "variant")).toEqual(["solid", "outline"]);
  });

  it("returns intent keys for 'intent' dim", () => {
    const spec = makeAtomicSpec({
      intents: { primary: { description: "Primary." }, danger: { description: "Danger." } },
    }) as AtomicSpec;
    expect(collectDimensionValues(spec, "intent")).toEqual(["primary", "danger"]);
  });

  it("returns size keys for 'size' dim", () => {
    const spec = makeAtomicSpec({
      sizes: { sm: { description: "Small." }, lg: { description: "Large." } },
    }) as AtomicSpec;
    expect(collectDimensionValues(spec, "size")).toEqual(["sm", "lg"]);
  });

  it("returns visualStates keys for 'visualStates' dim", () => {
    const spec = makeAtomicSpec({
      visualStates: { disabled: { description: "Disabled." } },
    }) as AtomicSpec;
    expect(collectDimensionValues(spec, "visualStates")).toEqual(["disabled"]);
  });

  it("returns prop values for a prop-name dim", () => {
    const spec = makeAtomicSpec({
      props: {
        weight: {
          type: "string",
          description: "Weight.",
          responsive: false,
          values: ["bold", "regular"],
        },
      },
    }) as AtomicSpec;
    expect(collectDimensionValues(spec, "weight")).toEqual(["bold", "regular"]);
  });

  it("returns empty array for unknown dim with no prop match", () => {
    const spec = makeAtomicSpec() as AtomicSpec;
    expect(collectDimensionValues(spec, "nonexistent")).toEqual([]);
  });
});
