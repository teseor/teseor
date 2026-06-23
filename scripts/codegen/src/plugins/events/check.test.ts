import { describe, expect, test } from "vitest";
import type { Vocabulary } from "../../lib/vocabulary.ts";
import { Spec } from "../../schema.ts";
import { checkEvents, checkEventsRuntimeSupport } from "./check.ts";

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

function makeButton(overrides: Partial<Spec> = {}): Spec {
  return Spec.parse({
    name: "button",
    kind: "atomic",
    element: "button",
    rootClass: "t-button",
    variants: { solid: { description: "Filled." }, outline: { description: "Outlined." } },
    intents: {
      primary: { description: "Primary." },
      danger: { description: "Danger." },
    },
    sizes: { sm: { description: "Small." }, md: { description: "Medium." } },
    tokens: {
      bg: { fallback: "--t-accent", desc: "Background." },
      fg: { fallback: "--t-on-accent", desc: "Foreground." },
    },
    ...overrides,
  });
}

function makeSpec(s: unknown): Spec {
  return Spec.parse(s);
}

describe("checkEvents", () => {
  function makeEvents(events: Record<string, unknown>, extra: Partial<Spec> = {}): Spec {
    return makeButton({
      events: events as Spec["events"],
      ...extra,
    });
  }

  test("returns no issues when events: is absent", () => {
    expect(checkEvents(makeButton(), vocabulary)).toEqual([]);
  });

  test("returns no issues for a declared event with a registered verb", () => {
    const spec = makeEvents({
      dismiss: { description: "Closed.", payload: {} },
    });
    expect(checkEvents(spec, vocabulary)).toEqual([]);
  });

  test("E1: rejects an event name that doesn't match the vocab pattern", () => {
    const spec = makeEvents({
      sort_change: { description: "x", payload: {} },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.map((i) => i.path)).toEqual(["events.sort_change"]);
    expect(issues[0]?.message).toMatch(/valid event name/);
  });

  test("E1: rejects PascalCase event names", () => {
    const spec = makeEvents({
      Dismiss: { description: "x", payload: {} },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.map((i) => i.path)).toEqual(["events.Dismiss"]);
  });

  test("E2: rejects an unregistered verb with a Levenshtein suggestion", () => {
    const spec = makeEvents({
      activatee: { description: "x", payload: {} },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.map((i) => i.path)).toEqual(["events.activatee"]);
    expect(issues[0]?.message).toMatch(/not registered/);
    expect(issues[0]?.message).toMatch(/'activate'/);
  });

  test("E2: extracts the last camelCase token as the verb", () => {
    const spec = makeEvents({
      rowMutate: { description: "x", payload: {} },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues[0]?.message).toMatch(/'mutate' is not registered/);
  });

  test("E3: rejects a synonym with the canonical suggestion", () => {
    const spec = makeEvents({
      close: { description: "x", payload: {} },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.map((i) => i.path)).toEqual(["events.close"]);
    expect(issues[0]?.message).toMatch(/synonym for 'dismiss'/);
  });

  test("E3: synonym in subject+verb form is detected by the last token", () => {
    const spec = makeEvents({
      modalClose: { description: "x", payload: {} },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues[0]?.message).toMatch(/'close' is registered as a synonym/);
  });

  test("E4: routes the open synonym to pattern: controllable", () => {
    const spec = makeEvents({
      open: { description: "x", payload: {} },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.map((i) => i.path)).toEqual(["events.open"]);
    expect(issues[0]?.message).toMatch(/pattern: "controllable"/);
  });

  test("E5: rejects a generic ref not declared on the spec", () => {
    const spec = makeEvents({
      select: {
        description: "x",
        payload: { item: { type: "generic", ref: "Item" } },
      },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.map((i) => i.path)).toEqual(["events.select.payload.item"]);
    expect(issues[0]?.message).toMatch(/generic 'Item'/);
  });

  test("E5: accepts a generic ref that is declared", () => {
    const spec = makeEvents(
      {
        select: {
          description: "x",
          payload: { item: { type: "generic", ref: "Item" } },
        },
      },
      { generics: [{ name: "Item", description: "Item shape." }] },
    );
    expect(checkEvents(spec, vocabulary)).toEqual([]);
  });

  test("E5: walks generic refs inside array.of", () => {
    const spec = makeEvents({
      select: {
        description: "x",
        payload: {
          items: { type: "array", of: { type: "generic", ref: "Row" } },
        },
      },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.map((i) => i.path)).toEqual(["events.select.payload.items.of"]);
  });

  test("E6: rejects an unregistered builtin name", () => {
    const spec = makeEvents({
      add: {
        description: "x",
        payload: { entry: { type: "builtin", name: "Blob" } },
      },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.map((i) => i.path)).toEqual(["events.add.payload.entry"]);
    expect(issues[0]?.message).toMatch(/built-in type 'Blob'/);
  });

  test("E6: accepts a registered builtin name", () => {
    const spec = makeEvents({
      add: {
        description: "x",
        payload: { file: { type: "builtin", name: "File" } },
      },
    });
    expect(checkEvents(spec, vocabulary)).toEqual([]);
  });

  test("E8: rejects an event name that collides with a controllable callback", () => {
    const spec = makeEvents(
      { valueChange: { description: "x", payload: {} } },
      {
        props: {
          value: {
            type: "string",
            description: "Value.",
            pattern: "controllable",
          },
        },
      },
    );
    const issues = checkEvents(spec, vocabulary);
    expect(issues.some((i) => /onValueChange/.test(i.message))).toBe(true);
  });

  test("E8: composite spec checks controllable props across all parts", () => {
    const spec = makeSpec({
      name: "combobox",
      kind: "composite",
      events: { openChange: { description: "x", payload: {} } },
      parts: {
        root: {
          element: "div",
          props: {
            open: {
              type: "boolean",
              description: "Open state.",
              pattern: "controllable",
            },
          },
        },
      },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.some((i) => /onOpenChange/.test(i.message))).toBe(true);
  });

  test("verb-registered check is mutually exclusive with synonym check", () => {
    // 'close' is a synonym; the verb-not-registered message should NOT also fire.
    const spec = makeEvents({
      close: { description: "x", payload: {} },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.length).toBe(1);
    expect(issues[0]?.message).not.toMatch(/not registered/);
  });

  test("rejects verbs that collide with Object.prototype method names", () => {
    // `in` operator would treat `toString` / `valueOf` / `hasOwnProperty`
    // as registered via inheritance — Object.hasOwn keeps the vocab closed.
    const spec = makeEvents({
      toString: { description: "x", payload: {} },
      valueOf: { description: "x", payload: {} },
      hasOwnProperty: { description: "x", payload: {} },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.length).toBe(3);
    for (const verb of ["toString", "valueOf", "hasOwnProperty"]) {
      expect(issues.some((i) => i.message.includes(`'${verb}'`))).toBe(true);
    }
  });

  test("rejects payload builtin names that collide with Object.prototype", () => {
    const spec = makeEvents({
      add: {
        description: "x",
        payload: { thing: { type: "builtin", name: "toString" } },
      },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.some((i) => /built-in type 'toString'/.test(i.message))).toBe(true);
  });

  test("rejects payload field names that are not valid JS identifiers", () => {
    const spec = makeEvents({
      dismiss: {
        description: "x",
        payload: { "error-code": { type: "string" } },
      },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.map((i) => i.path)).toEqual(["events.dismiss.payload.error-code"]);
    expect(issues[0]?.message).toMatch(/valid payload field name/);
  });

  test("rejects payload field named 'type' (channel discriminator collision)", () => {
    const spec = makeEvents({
      dismiss: {
        description: "x",
        payload: { type: { type: "string" } },
      },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.map((i) => i.path)).toEqual(["events.dismiss.payload.type"]);
    expect(issues[0]?.message).toMatch(/reserved as the channel discriminator/);
  });

  test("rejects generic names that shadow the Array codegen helper", () => {
    const spec = makeButton({ generics: [{ name: "Array", description: "x" }] });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.map((i) => i.path)).toEqual(["generics.Array"]);
    expect(issues[0]?.message).toMatch(/reserved/);
  });

  test("rejects generic names that collide with vocab builtins", () => {
    const spec = makeButton({ generics: [{ name: "File", description: "x" }] });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.map((i) => i.path)).toEqual(["generics.File"]);
  });

  test("rejects duplicate generic names within a spec", () => {
    const spec = makeButton({
      generics: [
        { name: "Item", description: "x" },
        { name: "Item", description: "y" },
      ],
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.some((i) => i.path === "generics.Item" && /more than once/.test(i.message))).toBe(
      true,
    );
  });

  test("accepts non-reserved generic names alongside events", () => {
    const spec = makeButton({
      generics: [{ name: "Item", description: "x" }],
      events: {
        select: {
          description: "x",
          payload: { item: { type: "generic", ref: "Item" } },
        },
      },
    });
    expect(checkEvents(spec, vocabulary)).toEqual([]);
  });

  test("rejects each codegen-emitted helper as a generic name", () => {
    for (const reserved of ["Record", "Partial", "ReadonlyArray", "Responsive"]) {
      const spec = makeButton({ generics: [{ name: reserved, description: "x" }] });
      const issues = checkEvents(spec, vocabulary);
      expect(issues.map((i) => i.path)).toEqual([`generics.${reserved}`]);
    }
  });

  test("rejects a per-event handler name that collides with a declared prop", () => {
    const spec = makeEvents(
      { dismiss: { description: "x", payload: {} } },
      {
        props: {
          onDismiss: { type: "string", description: "Existing prop." },
        },
      },
    );
    const issues = checkEvents(spec, vocabulary);
    expect(issues.some((i) => /'onDismiss' prop/.test(i.message))).toBe(true);
  });

  test("rejects a declared prop named 'onEvent' when events: is non-empty", () => {
    const spec = makeEvents(
      { dismiss: { description: "x", payload: {} } },
      {
        props: {
          onEvent: { type: "string", description: "Existing prop." },
        },
      },
    );
    const issues = checkEvents(spec, vocabulary);
    expect(issues.some((i) => i.path === "props.onEvent")).toBe(true);
  });

  test("does not flag 'onEvent' as a prop when no events are declared", () => {
    const spec = makeButton({
      props: {
        onEvent: { type: "string", description: "Existing prop." },
      },
    });
    expect(checkEvents(spec, vocabulary)).toEqual([]);
  });

  test("composite spec collision check walks parts for prop names", () => {
    const spec = makeSpec({
      name: "modal",
      kind: "composite",
      events: { dismiss: { description: "x", payload: {} } },
      parts: {
        root: {
          element: "div",
          props: {
            onDismiss: { type: "string", description: "x" },
          },
        },
      },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.some((i) => /'onDismiss' prop/.test(i.message))).toBe(true);
  });

  test("handler-collision check ignores repeating part item props", () => {
    // `onDismiss` lives inside the generated <Spec>Item type, not on root
    // Props, so it should not trigger a false handler collision.
    const spec = makeSpec({
      name: "modal",
      kind: "composite",
      events: { dismiss: { description: "x", payload: {} } },
      parts: {
        root: { element: "div" },
        row: {
          element: "div",
          repeating: true,
          props: {
            onDismiss: { type: "string", description: "Item-level prop." },
          },
        },
      },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.some((i) => /'onDismiss' prop/.test(i.message))).toBe(false);
  });

  test("rejects a generic that shadows a spec-local emitted alias (<Spec>Variant)", () => {
    const spec = makeButton({ generics: [{ name: "ButtonVariant", description: "x" }] });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.map((i) => i.path)).toEqual(["generics.ButtonVariant"]);
  });

  test("rejects a generic that shadows a per-prop enum alias", () => {
    const spec = makeButton({
      props: {
        align: {
          type: "string",
          description: "Alignment.",
          values: ["start", "end"],
        },
      },
      generics: [{ name: "ButtonAlign", description: "x" }],
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.map((i) => i.path)).toEqual(["generics.ButtonAlign"]);
  });

  test("does NOT reserve per-prop enum alias names for repeating item props", () => {
    // Repeating-item props with `values` are rendered inline inside the
    // generated <Spec>Item type; no <Spec><Prop> alias is ever emitted, so
    // a generic of that name is safe.
    const spec = makeSpec({
      name: "tablist",
      kind: "composite",
      generics: [{ name: "TablistDirection", description: "x" }],
      parts: {
        root: { element: "div" },
        tab: {
          element: "button",
          repeating: true,
          props: {
            direction: {
              type: "string",
              description: "Per-item direction.",
              values: ["asc", "desc"],
            },
          },
        },
      },
    });
    expect(checkEvents(spec, vocabulary)).toEqual([]);
  });

  test("rejects a generic that shadows a repeating item type alias", () => {
    const spec = makeSpec({
      name: "tablist",
      kind: "composite",
      generics: [{ name: "TablistItem", description: "x" }],
      parts: {
        root: { element: "div" },
        tab: {
          element: "button",
          repeating: true,
          groupKey: "items",
          props: { label: { type: "string", slot: true, description: "Tab label." } },
        },
      },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.some((i) => i.path === "generics.TablistItem")).toBe(true);
  });
});

describe("checkEventsRuntimeSupport", () => {
  const overlayPart = {
    anchor: "trigger",
    anchorVar: "--t-modal-anchor",
    mode: "manual" as const,
    modal: false,
  };
  const overlayParts = (anchorVar = "--t-modal-anchor") => ({
    trigger: { fromChildren: true },
    content: { element: "div", overlay: { ...overlayPart, anchorVar } },
  });

  test("returns no issues when events: is absent", () => {
    expect(checkEventsRuntimeSupport(makeButton())).toEqual([]);
  });

  test("accepts 'dismiss' on a composite-overlay spec", () => {
    const spec = makeSpec({
      name: "modal",
      kind: "composite",
      parts: overlayParts(),
      events: {
        dismiss: {
          description: "Closed.",
          payload: { reason: { type: "enum", values: ["outside", "escape", "button"] } },
        },
      },
    });
    expect(checkEventsRuntimeSupport(spec)).toEqual([]);
  });

  test("rejects non-dismiss events on a composite-overlay spec until their runtime ships", () => {
    const spec = makeSpec({
      name: "combobox",
      kind: "composite",
      parts: overlayParts("--t-combobox-anchor"),
      events: {
        select: { description: "Selected.", payload: { value: { type: "string" } } },
      },
    });
    const issues = checkEventsRuntimeSupport(spec);
    expect(issues.map((i) => i.path)).toEqual(["events.select"]);
    expect(issues[0]?.message).toMatch(/no wrapper-runtime source/);
  });

  test("rejects any events declaration on an atomic spec", () => {
    const spec = makeButton({
      events: {
        dismiss: { description: "x", payload: {} },
      } as Spec["events"],
    });
    const issues = checkEventsRuntimeSupport(spec);
    expect(issues.map((i) => i.path)).toEqual(["events.dismiss"]);
    expect(issues[0]?.message).toMatch(/not supported on this spec shape/);
  });

  test("rejects events on a composite-list spec (no overlay block)", () => {
    const spec = makeSpec({
      name: "pagination",
      kind: "composite",
      parts: {
        nav: { element: "nav" },
        page: {
          element: "a",
          repeating: true,
          props: { label: { type: "string", slot: true, description: "Page label." } },
        },
      },
      events: {
        pageChange: { description: "x", payload: { page: { type: "number" } } },
      },
    });
    const issues = checkEventsRuntimeSupport(spec);
    expect(issues.map((i) => i.path)).toEqual(["events.pageChange"]);
    expect(issues[0]?.message).toMatch(/not supported on this spec shape/);
  });

  test("flags every unsupported event when multiple are declared", () => {
    const spec = makeSpec({
      name: "combobox",
      kind: "composite",
      parts: overlayParts("--t-combobox-anchor"),
      events: {
        dismiss: {
          description: "Closed.",
          payload: { reason: { type: "enum", values: ["outside", "escape", "button"] } },
        },
        select: { description: "Selected.", payload: { value: { type: "string" } } },
        inputChange: { description: "Input changed.", payload: { value: { type: "string" } } },
      },
    });
    const issues = checkEventsRuntimeSupport(spec);
    expect(issues.map((i) => i.path).sort()).toEqual(["events.inputChange", "events.select"]);
  });

  test("rejects dismiss whose reason values diverge from the runtime contract", () => {
    const spec = makeSpec({
      name: "modal",
      kind: "composite",
      parts: overlayParts(),
      events: {
        dismiss: {
          description: "Closed.",
          payload: { reason: { type: "enum", values: ["outside", "escape"] } },
        },
      },
    });
    const issues = checkEventsRuntimeSupport(spec);
    expect(issues.map((i) => i.path)).toEqual(["events.dismiss.payload.reason"]);
    expect(issues[0]?.message).toMatch(/match the wrapper-runtime contract exactly/);
  });

  test("rejects dismiss with a missing or non-enum reason field", () => {
    const missing = makeSpec({
      name: "modal",
      kind: "composite",
      parts: overlayParts(),
      events: { dismiss: { description: "Closed.", payload: {} } },
    });
    const wrongType = makeSpec({
      name: "modal",
      kind: "composite",
      parts: overlayParts(),
      events: {
        dismiss: { description: "Closed.", payload: { reason: { type: "string" } } },
      },
    });
    for (const spec of [missing, wrongType]) {
      const issues = checkEventsRuntimeSupport(spec);
      expect(issues.map((i) => i.path)).toEqual(["events.dismiss.payload.reason"]);
      expect(issues[0]?.message).toMatch(/type 'enum'/);
      expect(issues[0]?.message).toMatch(/must declare a 'reason' field/);
    }
  });

  test("rejects events: + generics: until composite-overlay wrappers support generic parameters", () => {
    const spec = makeSpec({
      name: "modal",
      kind: "composite",
      parts: overlayParts(),
      generics: [{ name: "Item", description: "Item shape." }],
      events: {
        dismiss: {
          description: "Closed.",
          payload: { reason: { type: "enum", values: ["outside", "escape", "button"] } },
        },
      },
    });
    const issues = checkEventsRuntimeSupport(spec);
    expect(issues.some((i) => i.path === "generics")).toBe(true);
    const generic = issues.find((i) => i.path === "generics");
    expect(generic?.message).toMatch(/do not declare generic type parameters/);
  });

  test("accepts generics: alone (no events:)", () => {
    const spec = makeSpec({
      name: "modal",
      kind: "composite",
      parts: overlayParts(),
      generics: [{ name: "Item", description: "Item shape." }],
    });
    expect(checkEventsRuntimeSupport(spec)).toEqual([]);
  });
});
