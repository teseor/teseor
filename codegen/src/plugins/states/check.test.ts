import { describe, expect, test } from "vitest";
import { Spec } from "../../core/schema.ts";
import type { Vocabulary } from "../../lib/vocabulary.ts";
import { checkStateMachines } from "./check/index.ts";

const vocabulary: Vocabulary = {
  components: ["Button", "Stack"],
  props: ["size", "variant", "intent", "disabled", "loading"],
  propDescriptions: {},
  variants: ["solid", "outline", "ghost", "link"],
  intents: ["primary", "neutral", "danger", "success", "warning"],
  sizes: ["sm", "md", "lg"],
  sizeMap: { sm: 2, md: 4, lg: 6 },
  states: ["disabled", "loading", "error", "success"],
  parts: [],
  events: {
    verbs: {
      dismiss: "Surface closed.",
      change: "Value changed.",
      select: "User chose an item.",
      add: "Item added.",
      reach: "Sentinel reached.",
      activate: "Primary action.",
    },
    synonyms: {
      close: "dismiss",
      update: "change",
      press: "activate",
      open: "—",
    },
    pattern: "^([a-z]+|[a-z]+([A-Z][a-zA-Z0-9]+)+)$",
    builtins: {
      File: "DOM File.",
      Date: "ECMAScript Date.",
    },
  },
  dom_events: {
    click: "Pointer click.",
    pointerenter: "Pointer entered.",
    pointerleave: "Pointer left.",
    focusin: "Focus moved in.",
    focusout: "Focus moved out.",
  },
  keys: {
    escape: "Escape key.",
    enter: "Enter key.",
    tab: "Tab key.",
  },
  formControl: {
    elements: ["input", "textarea", "select"],
    props: {
      name: { type: "string", description: "HTML form field name." },
      form: { type: "string", description: "Form id association." },
      required: { type: "boolean", description: "Required field." },
      readOnly: { type: "boolean", description: "Read-only field." },
      disabled: { type: "boolean", description: "Disabled field." },
    },
  },
};

/** Validates the literal at runtime via Zod. The lint rule
 *  `no-as-unknown-cast` forbids the bare schema-cast in test files (it
 *  hides drift); route every fixture through this helper so a renamed
 *  field, dropped block, or new required nesting fails at construction
 *  with a structural error rather than rolling through every check. */
function makeSpec(s: unknown): Spec {
  return Spec.parse(s);
}

describe("checkStateMachines (RFC-0007)", () => {
  const baseOverlay = {
    anchor: "trigger",
    anchorVar: "--t-modal-anchor",
    mode: "manual" as const,
    modal: false,
  };
  const baseEvents = {
    dismiss: {
      description: "Closed.",
      payload: { reason: { type: "enum", values: ["outside", "escape", "button"] } },
    },
  };

  function modalSpec(contentExtras: Record<string, unknown> = {}): Spec {
    return makeSpec({
      name: "modal",
      kind: "composite",
      events: baseEvents,
      parts: {
        trigger: {
          fromChildren: true,
          props: {
            open: {
              type: "boolean",
              default: false,
              pattern: "controllable",
              responsive: false,
              description: "Open state.",
            },
          },
        },
        content: {
          root: { kind: "static", tag: "div" },
          overlay: baseOverlay,
          ...contentExtras,
        },
      },
    });
  }

  test("rule 1 — empty states: rejected", () => {
    const spec = modalSpec({ states: {} });
    const issues = checkStateMachines(spec, vocabulary);
    expect(issues.some((i) => /\bis empty\b/.test(i.message))).toBe(true);
  });

  test("rule 2 — transition `to:` must resolve in the same part's states map", () => {
    const spec = modalSpec({
      states: {
        closed: { on: { "trigger.click": "open" } },
        open: { on: { "trigger.click": { to: "missing" } } },
      },
    });
    const issues = checkStateMachines(spec, vocabulary);
    expect(issues.some((i) => /target 'missing'/.test(i.message))).toBe(true);
  });

  test("rule 3 — source prefix must match a part in the spec", () => {
    const spec = modalSpec({
      states: {
        closed: { on: { "ghost.click": "open" } },
        open: {},
      },
    });
    const issues = checkStateMachines(spec, vocabulary);
    expect(issues.some((i) => /source prefix 'ghost'/.test(i.message))).toBe(true);
  });

  test("rule 3 — key.<name> must match key vocabulary", () => {
    const spec = modalSpec({
      states: {
        closed: { on: { "key.bogus": "open" } },
        open: {},
      },
    });
    const issues = checkStateMachines(spec, vocabulary);
    expect(issues.some((i) => /key name 'bogus'/.test(i.message))).toBe(true);
  });

  test("rule 3 — DOM event must match dom_events vocabulary", () => {
    const spec = modalSpec({
      states: {
        closed: { on: { "trigger.tappp": "open" } },
        open: {},
      },
    });
    const issues = checkStateMachines(spec, vocabulary);
    expect(issues.some((i) => /DOM event 'tappp'/.test(i.message))).toBe(true);
  });

  test("rule 3a — duplicate part names across the parts tree are rejected", () => {
    const spec = makeSpec({
      name: "card",
      kind: "composite",
      parts: {
        header: {
          root: { kind: "static", tag: "header" },
          parts: {
            inner: { root: { kind: "static", tag: "div" } },
          },
        },
        body: {
          root: { kind: "static", tag: "div" },
          parts: {
            inner: { root: { kind: "static", tag: "div" } },
          },
        },
      },
    });
    const issues = checkStateMachines(spec, vocabulary);
    expect(issues.some((i) => /part name 'inner'/.test(i.message))).toBe(true);
  });

  test("rule 5 — `emits:` must reference a declared root event", () => {
    const spec = modalSpec({
      states: {
        closed: {
          on: {
            "trigger.click": { to: "open", emits: { ghostEvent: { reason: "button" } } },
          },
        },
        open: {},
      },
    });
    const issues = checkStateMachines(spec, vocabulary);
    expect(issues.some((i) => /'ghostEvent' is not declared in root/.test(i.message))).toBe(true);
  });

  test("rule 5 — emits payload literal must match declared enum values", () => {
    const spec = modalSpec({
      states: {
        closed: {
          on: {
            "trigger.click": { to: "open", emits: { dismiss: { reason: "swipe" } } },
          },
        },
        open: {},
      },
    });
    const issues = checkStateMachines(spec, vocabulary);
    expect(issues.some((i) => /value 'swipe' is not in the declared enum/.test(i.message))).toBe(
      true,
    );
  });

  test("rule 6 — overlay anchor must name a sibling part with fromChildren: true", () => {
    const spec = makeSpec({
      name: "modal",
      kind: "composite",
      parts: {
        trigger: {},
        content: { root: { kind: "static", tag: "div" }, overlay: baseOverlay },
      },
    });
    const issues = checkStateMachines(spec, vocabulary);
    expect(
      issues.some((i) =>
        /must declare `fromChildren: true` to serve as an overlay anchor/.test(i.message),
      ),
    ).toBe(true);
  });

  test("rule 6 — overlay anchor must point at an existing sibling", () => {
    const spec = makeSpec({
      name: "modal",
      kind: "composite",
      parts: {
        content: { root: { kind: "static", tag: "div" }, overlay: baseOverlay },
      },
    });
    const issues = checkStateMachines(spec, vocabulary);
    expect(issues.some((i) => /is not a sibling part of 'content'/.test(i.message))).toBe(true);
  });

  test("rule 7 — outside.* sources only on overlay parts", () => {
    const spec = makeSpec({
      name: "modal",
      kind: "composite",
      parts: {
        trigger: {
          fromChildren: true,
          states: {
            closed: { on: { "outside.click": "open" } },
            open: {},
          },
        },
        content: { root: { kind: "static", tag: "div" }, overlay: baseOverlay },
      },
    });
    const issues = checkStateMachines(spec, vocabulary);
    expect(issues.some((i) => /only valid on parts that declare `overlay:`/.test(i.message))).toBe(
      true,
    );
  });

  test("rule 9 — controllable boolean prop must mirror a declared state name", () => {
    const spec = modalSpec({
      props: {
        active: {
          type: "boolean",
          default: false,
          pattern: "controllable",
          responsive: false,
          description: "Active.",
        },
      },
      states: {
        closed: { on: { "trigger.click": "open" } },
        open: { on: { "trigger.click": "closed" } },
      },
    });
    const issues = checkStateMachines(spec, vocabulary);
    expect(issues.some((i) => /'active' must mirror a state name/.test(i.message))).toBe(true);
  });

  test("rule 10 — when: must use the `[!]<part>.<bool-prop>` grammar", () => {
    const spec = modalSpec({
      states: {
        closed: {
          on: { "trigger.click": { to: "open", when: "open && enabled" } },
        },
        open: {},
      },
    });
    const issues = checkStateMachines(spec, vocabulary);
    expect(issues.some((i) => /does not match the supported grammar/.test(i.message))).toBe(true);
  });

  test("rule 10 — when: must reference a boolean prop on the named part", () => {
    const spec = modalSpec({
      states: {
        closed: {
          on: { "trigger.click": { to: "open", when: "!trigger.title" } },
        },
        open: {},
      },
    });
    // The fixture's trigger declares `open: boolean` (controllable) but no
    // `title` prop — the guard reference should fail to resolve.
    const issues = checkStateMachines(spec, vocabulary);
    expect(issues.some((i) => /references prop 'title'/.test(i.message))).toBe(true);
  });

  test("after: must reference a declared `type: number` prop on the same part", () => {
    const spec = modalSpec({
      states: {
        closed: {
          on: { "trigger.click": { to: "open", after: "missingDelay" } },
        },
        open: {},
      },
    });
    const issues = checkStateMachines(spec, vocabulary);
    expect(issues.some((i) => /'missingDelay'.*reference a prop/.test(i.message))).toBe(true);
  });

  test("accepts a fully-wired modal spec", () => {
    const spec = makeSpec({
      name: "modal",
      kind: "composite",
      events: baseEvents,
      parts: {
        trigger: {
          fromChildren: true,
          props: {
            open: {
              type: "boolean",
              default: false,
              pattern: "controllable",
              responsive: false,
              description: "Open.",
            },
          },
        },
        content: {
          root: { kind: "static", tag: "div" },
          overlay: { ...baseOverlay, modal: true },
          states: {
            closed: { on: { "trigger.click": "open" } },
            open: {
              on: {
                "trigger.click": { to: "closed", emits: { dismiss: { reason: "button" } } },
                "key.escape": { to: "closed", emits: { dismiss: { reason: "escape" } } },
                "outside.click": { to: "closed", emits: { dismiss: { reason: "outside" } } },
              },
            },
          },
        },
      },
    });
    expect(checkStateMachines(spec, vocabulary)).toEqual([]);
  });
});
