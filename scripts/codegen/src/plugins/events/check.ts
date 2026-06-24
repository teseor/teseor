import type { Issue } from "../../core/check-utils.ts";
import {
  isAtomic,
  isComposite,
  issue,
  suggestionFragment,
  visitNodes,
} from "../../core/check-utils.ts";
import { pascalCase } from "../../lib/pascal-case.ts";
import type { Vocabulary } from "../../lib/vocabulary.ts";
import type { Spec, SpecPart } from "../../schema.ts";
import type { PayloadEntry } from "./schema.ts";

// Valid JS identifier: starts with letter/underscore/$, followed by alphanumerics/_/$.
const JS_IDENTIFIER_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

const CAMEL_TAIL_RE = /[A-Z][a-zA-Z0-9]*$/;

function eventVerb(name: string): string {
  const match = name.match(CAMEL_TAIL_RE);
  return match ? match[0].toLowerCase() : name.toLowerCase();
}

function visitPayload(
  entry: PayloadEntry,
  path: string,
  visit: (p: PayloadEntry, path: string) => void,
): void {
  visit(entry, path);
  if (entry.type === "array") visitPayload(entry.of, `${path}.of`, visit);
}

function collectControllableProps(spec: Spec): string[] {
  const names: string[] = [];
  visitNodes(spec, (node) => {
    for (const [propName, def] of Object.entries(node.props ?? {})) {
      if (def.pattern === "controllable") names.push(propName);
    }
  });
  return names;
}

/**
 * Validates `events:` declarations against the vocab + the spec's own
 * `generics:` and controllable props:
 *
 *  - Name doesn't match the vocab pattern.
 *  - Last camelCase token isn't a registered verb (Levenshtein suggestion).
 *  - Name's verb is a synonym for a canonical verb.
 *  - Name's verb is a synonym whose canonical is '—' (controllable).
 *  - Payload `generic.ref` not in this spec's `generics:` block.
 *  - Payload `builtin.name` not in vocab `events.builtins`.
 *  - Event name collides with a `<prop>Change` callback emitted by a
 *    controllable prop on this spec.
 *
 * Sub-part declarations fall out of the schema: `events:` lives on
 * `identityFields`, so a part-level declaration fails strictObject
 * with an "Unrecognized key" before semantic checks run.
 */
// Generic names that would shadow codegen-emitted globals when used as a
// type parameter. Two sources:
//  - Codegen helpers / imports: `Array` (array payload), `Record`
//    (empty-props sentinel), `Partial`, `ReadonlyArray` (repeating-part
//    prop type), `Responsive` (responsive-helper import).
//  - Closed-vocab event builtins (`File`, `Date`, `MouseEvent`, …) added
//    at check time from vocabulary.events.builtins.
const RESERVED_GENERIC_NAMES_BASE = new Set([
  "Array",
  "Record",
  "Partial",
  "ReadonlyArray",
  "Responsive",
]);

/**
 * Spec-local type aliases gen-contract emits for this spec. A generic
 * parameter named the same as one of these would shadow the alias inside
 * the Props/Event body, silently widening the contract.
 */
function collectSpecLocalAliases(spec: Spec): Set<string> {
  const Name = pascalCase(spec.name);
  const aliases = new Set<string>([`${Name}Props`]);
  if (spec.events && Object.keys(spec.events).length > 0) aliases.add(`${Name}Event`);

  // Mirror the contract printer: it reads FlatSpec, which drops repeating
  // parts from `variants`/`intents`/`sizes`/`props` and renders item-prop
  // value unions inline inside the generated item type — no standalone
  // `<Name><Prop>` alias is emitted for repeating-item props. Skipping
  // repeating parts here keeps the reserved set in sync with what's
  // actually emitted.
  if (isAtomic(spec)) {
    addNodeAliases(spec, Name, aliases);
  } else if (isComposite(spec)) {
    const visit = (parts: Record<string, SpecPart>): void => {
      for (const [partName, part] of Object.entries(parts)) {
        if (part.repeating === true) {
          aliases.add(repeatingItemTypeName(Name, part, partName));
          continue;
        }
        addNodeAliases(part, Name, aliases);
        if (part.parts) visit(part.parts);
      }
    };
    visit(spec.parts);
  }

  return aliases;
}

function addNodeAliases(
  node: {
    variants?: object;
    intents?: object;
    sizes?: object;
    props?: Record<string, { values?: string[] }>;
  },
  Name: string,
  aliases: Set<string>,
): void {
  if (node.variants && Object.keys(node.variants).length > 0) aliases.add(`${Name}Variant`);
  if (node.intents && Object.keys(node.intents).length > 0) aliases.add(`${Name}Intent`);
  if (node.sizes && Object.keys(node.sizes).length > 0) aliases.add(`${Name}Size`);
  for (const [propName, def] of Object.entries(node.props ?? {})) {
    if (def.values && def.values.length > 0) {
      aliases.add(`${Name}${pascalCase(propName)}`);
    }
  }
}

function repeatingItemTypeName(componentName: string, part: SpecPart, partName: string): string {
  if (typeof part.groupKey === "string") {
    if (part.groupKey.toLowerCase() === "items") return `${componentName}Item`;
    return `${componentName}${pascalCase(part.groupKey)}Item`;
  }
  return `${componentName}${pascalCase(partName)}Item`;
}

export function checkEvents(spec: Spec, vocabulary: Vocabulary): Issue[] {
  const issues: Issue[] = [];
  const { verbs, synonyms, pattern, builtins } = vocabulary.events;
  const reservedGenericNames = new Set<string>(RESERVED_GENERIC_NAMES_BASE);
  for (const builtin of Object.keys(builtins)) reservedGenericNames.add(builtin);
  for (const alias of collectSpecLocalAliases(spec)) reservedGenericNames.add(alias);

  // Generic-name validation runs regardless of whether `events:` is declared:
  // `<Spec>Props` carries the generic parameter list even when no events exist.
  const seenGenericNames = new Set<string>();
  for (const generic of spec.generics ?? []) {
    const gPath = `generics.${generic.name}`;
    if (reservedGenericNames.has(generic.name)) {
      issues.push(
        issue(
          spec.name,
          gPath,
          `'${generic.name}' is reserved; using it as a generic parameter would shadow the global/codegen-emitted type of the same name. Pick a distinct name.`,
        ),
      );
    }
    if (seenGenericNames.has(generic.name)) {
      issues.push(
        issue(
          spec.name,
          gPath,
          `'${generic.name}' is declared more than once in generics:. Each generic name must be unique.`,
        ),
      );
    }
    seenGenericNames.add(generic.name);
  }

  const events = spec.events;
  if (!events || Object.keys(events).length === 0) return issues;

  const nameRe = new RegExp(pattern);
  const verbList = Object.keys(verbs);
  const declaredGenerics = new Set((spec.generics ?? []).map((g) => g.name));
  const controllableCallbacks = new Set(collectControllableProps(spec).map((p) => `${p}Change`));

  // Codegen-emitted handler/channel prop names that must not collide with
  // consumer-declared props. The channel prop is always `onEvent` when any
  // event is declared; per-event handlers are `on<PascalCase(eventName)>`.
  // Repeating-part props surface inside the generated `Item` type, not on
  // the root `Props` surface — skip them so an item prop named `onDismiss`
  // doesn't trip a false collision.
  const declaredPropNames = new Set<string>();
  if (isAtomic(spec)) {
    for (const propName of Object.keys(spec.props ?? {})) declaredPropNames.add(propName);
  } else if (isComposite(spec)) {
    const walk = (parts: Record<string, SpecPart>): void => {
      for (const part of Object.values(parts)) {
        if (part.repeating === true) continue;
        for (const propName of Object.keys(part.props ?? {})) declaredPropNames.add(propName);
        if (part.parts) walk(part.parts);
      }
    };
    walk(spec.parts);
  }
  if (declaredPropNames.has("onEvent")) {
    issues.push(
      issue(
        spec.name,
        "props.onEvent",
        `'onEvent' is reserved — codegen emits an aggregated channel prop with that name on every spec that declares events:. Rename the prop or remove the events: block.`,
      ),
    );
  }

  for (const [name, entry] of Object.entries(events)) {
    const path = `events.${name}`;

    if (!nameRe.test(name)) {
      issues.push(
        issue(
          spec.name,
          path,
          `'${name}' is not a valid event name. Use camelCase: '<verb>' or '<subjectNoun><Verb>'.`,
        ),
      );
      continue;
    }

    const verb = eventVerb(name);

    if (Object.hasOwn(synonyms, verb)) {
      const canonical = synonyms[verb];
      if (canonical === "—") {
        issues.push(
          issue(
            spec.name,
            path,
            `'${name}' uses the state-mirror verb '${verb}'. Declare \`pattern: "controllable"\` on the '${verb}' prop instead of declaring an event.`,
          ),
        );
      } else {
        issues.push(
          issue(
            spec.name,
            path,
            `'${verb}' is registered as a synonym for '${canonical}'. Use '${canonical}' to keep event names consistent across components.`,
          ),
        );
      }
    } else if (!Object.hasOwn(verbs, verb)) {
      issues.push(
        issue(
          spec.name,
          path,
          `'${name}' verb '${verb}' is not registered.${suggestionFragment(verb, verbList)}`,
        ),
      );
    }

    if (controllableCallbacks.has(name)) {
      const propName = name.slice(0, -"Change".length);
      issues.push(
        issue(
          spec.name,
          path,
          `'${name}' collides with the on${propName[0]?.toUpperCase()}${propName.slice(1)}Change callback emitted by \`pattern: "controllable"\` on prop '${propName}'. Pick a distinct event name or remove the controllable pattern.`,
        ),
      );
    }

    const handlerName = `on${name[0]?.toUpperCase() ?? ""}${name.slice(1)}`;
    if (declaredPropNames.has(handlerName)) {
      issues.push(
        issue(
          spec.name,
          path,
          `event '${name}' would emit a '${handlerName}' prop, which is already declared on this spec. Rename the prop or the event.`,
        ),
      );
    }

    for (const [field, payload] of Object.entries(entry.payload)) {
      if (!JS_IDENTIFIER_RE.test(field)) {
        issues.push(
          issue(
            spec.name,
            `${path}.payload.${field}`,
            `'${field}' is not a valid payload field name. Codegen emits it as a property identifier; use letters/digits/_/$ (must not start with a digit).`,
          ),
        );
        continue;
      }
      if (field === "type") {
        issues.push(
          issue(
            spec.name,
            `${path}.payload.${field}`,
            `'type' is reserved as the channel discriminator on the generated event union. Rename the payload field.`,
          ),
        );
        continue;
      }
      visitPayload(payload, `${path}.payload.${field}`, (p, payloadPath) => {
        if (p.type === "generic" && !declaredGenerics.has(p.ref)) {
          issues.push(
            issue(
              spec.name,
              payloadPath,
              `'${name}' payload references generic '${p.ref}' which is not declared in this spec's generics: block.`,
            ),
          );
        }
        if (p.type === "builtin" && !Object.hasOwn(builtins, p.name)) {
          issues.push(
            issue(
              spec.name,
              payloadPath,
              `'${name}' payload references built-in type '${p.name}' which is not registered. Add it to specs/_vocabulary.yaml events.builtins.`,
            ),
          );
        }
      });
    }
  }
  return issues;
}

/**
 * Runtime-source check for declared events.
 *
 * `gen-contract` produces type surfaces for any declared event, but a
 * wrapper-runtime auto-fire path exists only for a small subset today. The
 * audit principle:
 * either the generator fires the event, or the semantic check rejects the
 * declaration. Without this rule, a spec can declare `select` /
 * `inputChange` / `rowClick`; consumers see the per-event prop on the
 * surface; the prop never fires from the wrapper.
 *
 * v1 supports `dismiss` only, only on overlay composites. Other declared
 * events must wait until their runtime source ships in the matching
 * `gen-*` template.
 */
export function checkEventsRuntimeSupport(spec: Spec): Issue[] {
  const events = spec.events;
  if (!events || Object.keys(events).length === 0) return [];
  const issues: Issue[] = [];

  // Today's runtime-supported event sources, scoped to spec shapes the
  // generator actually emits firing code for. Extending this set means
  // adding the firing path in the matching generator template + updating
  // this list in the same change. `supportsGenerics` tracks whether the
  // generated wrapper declares type parameters on its props / signature —
  // composite-overlay wrappers don't today, so a spec with `events:` AND
  // `generics:` would emit references to undeclared identifiers.
  const SUPPORTED_BY_SHAPE: ReadonlyArray<{
    matches: (s: Spec) => boolean;
    events: ReadonlyArray<string>;
    shape: string;
    supportsGenerics: boolean;
  }> = [
    {
      matches: (s) => isComposite(s) && Object.values(s.parts).some((p) => p.overlay !== undefined),
      events: ["dismiss"],
      shape: "composite-overlay",
      supportsGenerics: false,
    },
  ];

  // Per-event runtime payload contract — the closed-set values the wrapper
  // runtime actually fires. A spec whose payload diverges from this set
  // would produce a generated wrapper whose handler signature can't be
  // passed to the runtime hook (TS error downstream). Reject at the spec
  // layer with a clear path.
  const REQUIRED_REASON_VALUES: Record<string, ReadonlySet<string>> = {
    dismiss: new Set(["outside", "escape", "button"]),
  };

  const shape = SUPPORTED_BY_SHAPE.find((s) => s.matches(spec));

  // Generics + events combo: the wrapper template must declare the generic
  // parameters on its props and component signature for the emitted type
  // references to resolve. Until each shape's template gains that support,
  // reject the combination here so consumers don't ship a contract that
  // compiles in isolation but fails in the wrapper.
  const hasGenerics = (spec.generics ?? []).length > 0;
  if (shape && hasGenerics && !shape.supportsGenerics) {
    issues.push(
      issue(
        spec.name,
        "generics",
        `${shape.shape} wrappers do not declare generic type parameters yet, so an events: block together with generics: would emit undeclared identifiers in the React wrapper. Remove generics: or wait for the wrapper-template generic-parameter pass.`,
      ),
    );
  }

  for (const name of Object.keys(events)) {
    if (!shape) {
      issues.push(
        issue(
          spec.name,
          `events.${name}`,
          `Declared events are not supported on this spec shape yet. v1 supports composite-overlay specs and the 'dismiss' event only. Remove the events: block or migrate the spec to an overlay composite.`,
        ),
      );
      continue;
    }
    if (!shape.events.includes(name)) {
      const supported = shape.events.map((e) => `'${e}'`).join(", ");
      issues.push(
        issue(
          spec.name,
          `events.${name}`,
          `Event '${name}' has no wrapper-runtime source on ${shape.shape} specs (v1 supports ${supported} only). Extend the generator template to fire the event before re-declaring it here.`,
        ),
      );
      continue;
    }
    const expectedReasons = REQUIRED_REASON_VALUES[name];
    if (!expectedReasons) continue;
    const entry = events[name];
    const reasonEntry = entry?.payload?.reason;
    const expectedList = [...expectedReasons].map((v) => `'${v}'`).join(", ");
    if (reasonEntry?.type !== "enum") {
      issues.push(
        issue(
          spec.name,
          `events.${name}.payload.reason`,
          `event '${name}' must declare a 'reason' field of type 'enum' with values matching the wrapper-runtime contract (${expectedList}).`,
        ),
      );
      continue;
    }
    const declared = new Set(reasonEntry.values);
    const exact =
      declared.size === expectedReasons.size && [...expectedReasons].every((v) => declared.has(v));
    if (!exact) {
      issues.push(
        issue(
          spec.name,
          `events.${name}.payload.reason`,
          `event '${name}'.payload.reason.values must match the wrapper-runtime contract exactly. Required: [${expectedList}]; declared: [${[...declared].map((v) => `'${v}'`).join(", ")}].`,
        ),
      );
    }
  }
  return issues;
}
