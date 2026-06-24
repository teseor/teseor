import type { Issue } from "../../../core/check-utils.ts";
import { isAtomic, isComposite, issue, suggestionFragment } from "../../../core/check-utils.ts";
import type { Spec, SpecPart } from "../../../core/schema.ts";
import type { Vocabulary } from "../../../lib/vocabulary.ts";
import {
  collectControllableProps,
  eventVerb,
  JS_IDENTIFIER_RE,
  visitPayload,
} from "./event-name.ts";
import { collectSpecLocalAliases, RESERVED_GENERIC_NAMES_BASE } from "./generics.ts";

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
