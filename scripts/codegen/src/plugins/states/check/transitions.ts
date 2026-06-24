import type { Issue } from "../../../core/check-utils.ts";
import { issue, suggestionFragment } from "../../../core/check-utils.ts";
import type { PayloadEntry, SpecPart } from "../../../core/schema.ts";
import type { PartRef } from "./part-names.ts";

export function checkPartStates(
  specName: string,
  partName: string,
  part: SpecPart,
  partPath: string,
  ctx: {
    partsByName: Map<string, PartRef>;
    domEventNames: string[];
    domEvents: Record<string, string>;
    keyNames: string[];
    keys: Record<string, string>;
    declaredEvents: Record<string, { description: string; payload: Record<string, PayloadEntry> }>;
    declaredEventNames: string[];
    issues: Issue[];
  },
): void {
  const states = part.states ?? {};
  const stateNames = Object.keys(states);
  const statesPath = `${partPath}.states`;

  // Rule 1 — empty states block.
  if (stateNames.length === 0) {
    ctx.issues.push(
      issue(
        specName,
        statesPath,
        `\`states:\` is empty on part '${partName}'. Declare at least one state or omit the block entirely.`,
      ),
    );
    return;
  }

  const hasOverlay = part.overlay !== undefined;

  // Rule 9 — controllable prop mirrors a state name.
  const controllableProps = Object.entries(part.props ?? {})
    .filter(([, prop]) => prop.pattern === "controllable" && prop.type === "boolean")
    .map(([name]) => name);
  for (const propName of controllableProps) {
    if (!Object.hasOwn(states, propName)) {
      ctx.issues.push(
        issue(
          specName,
          `${partPath}.props.${propName}`,
          `controllable boolean prop '${propName}' must mirror a state name declared in \`states:\` on the same part. States declared: [${stateNames.map((s) => `'${s}'`).join(", ")}]. Codegen wires the prop value to the runtime's initial state.`,
        ),
      );
    }
  }

  for (const [stateName, stateDef] of Object.entries(states)) {
    const statePath = `${statesPath}.${stateName}`;
    const on = stateDef.on ?? {};
    for (const [sourceKey, target] of Object.entries(on)) {
      const sourcePath = `${statePath}.on.${JSON.stringify(sourceKey)}`;

      // Rules 3 / 4 / 7 — source key prefix resolves.
      const dotIdx = sourceKey.indexOf(".");
      if (dotIdx < 0) {
        ctx.issues.push(
          issue(
            specName,
            sourcePath,
            `source key '${sourceKey}' must use a '<prefix>.<name>' shape (e.g. 'trigger.click', 'key.escape', 'outside.click').`,
          ),
        );
        continue;
      }
      const prefix = sourceKey.slice(0, dotIdx);
      const eventName = sourceKey.slice(dotIdx + 1);
      if (prefix === "key") {
        if (!Object.hasOwn(ctx.keys, eventName)) {
          ctx.issues.push(
            issue(
              specName,
              sourcePath,
              `key name '${eventName}' is not registered in specs/_vocabulary.yaml keys:.${suggestionFragment(eventName, ctx.keyNames)}`,
            ),
          );
        }
      } else if (prefix === "outside") {
        if (!hasOverlay) {
          ctx.issues.push(
            issue(
              specName,
              sourcePath,
              `'outside.*' sources are only valid on parts that declare \`overlay:\`. Move the state machine onto the overlay-bearing part or drop the source.`,
            ),
          );
        }
        if (!Object.hasOwn(ctx.domEvents, eventName)) {
          ctx.issues.push(
            issue(
              specName,
              sourcePath,
              `DOM event '${eventName}' is not registered in specs/_vocabulary.yaml dom_events:.${suggestionFragment(eventName, ctx.domEventNames)}`,
            ),
          );
        }
      } else {
        const referenced = ctx.partsByName.get(prefix);
        if (!referenced) {
          ctx.issues.push(
            issue(
              specName,
              sourcePath,
              `source prefix '${prefix}' does not match any part in this spec.${suggestionFragment(prefix, [...ctx.partsByName.keys()])}`,
            ),
          );
        }
        if (!Object.hasOwn(ctx.domEvents, eventName)) {
          ctx.issues.push(
            issue(
              specName,
              sourcePath,
              `DOM event '${eventName}' is not registered in specs/_vocabulary.yaml dom_events:.${suggestionFragment(eventName, ctx.domEventNames)}`,
            ),
          );
        }
      }

      // Normalize the shorthand `"open"` to long form for the remaining
      // rules (2, 5, after, 10).
      const long = typeof target === "string" ? { to: target } : target;

      // Rule 2 — `to:` resolves.
      if (!Object.hasOwn(states, long.to)) {
        ctx.issues.push(
          issue(
            specName,
            sourcePath,
            `transition target '${long.to}' is not a state declared on part '${partName}'. States: [${stateNames.map((s) => `'${s}'`).join(", ")}].`,
          ),
        );
      }

      // `after:` references a `type: number` prop on this part.
      if ("after" in long && long.after !== undefined) {
        const propEntry = part.props?.[long.after];
        if (!propEntry) {
          ctx.issues.push(
            issue(
              specName,
              sourcePath,
              `\`after: '${long.after}'\` must reference a prop declared on part '${partName}'. The runtime reads the prop value as a millisecond delay.`,
            ),
          );
        } else if (propEntry.type !== "number") {
          ctx.issues.push(
            issue(
              specName,
              sourcePath,
              `\`after: '${long.after}'\` must reference a \`type: number\` prop. Prop '${long.after}' has type '${propEntry.type}'.`,
            ),
          );
        }
      }

      // Rule 10 — when guard parses as [!]<part>.<bool-prop>.
      if ("when" in long && long.when !== undefined) {
        const expr = long.when.trim();
        const negated = expr.startsWith("!");
        const body = (negated ? expr.slice(1) : expr).trim();
        const guardDot = body.indexOf(".");
        if (guardDot < 1 || guardDot === body.length - 1) {
          ctx.issues.push(
            issue(
              specName,
              sourcePath,
              `\`when: '${long.when}'\` does not match the supported grammar '[!]<part>.<bool-prop>'.`,
            ),
          );
        } else {
          const guardPart = body.slice(0, guardDot);
          const guardProp = body.slice(guardDot + 1);
          const referenced = ctx.partsByName.get(guardPart);
          if (!referenced) {
            ctx.issues.push(
              issue(
                specName,
                sourcePath,
                `\`when:\` references part '${guardPart}' which does not exist.${suggestionFragment(guardPart, [...ctx.partsByName.keys()])}`,
              ),
            );
          } else {
            const propEntry = referenced.part.props?.[guardProp];
            if (!propEntry) {
              ctx.issues.push(
                issue(
                  specName,
                  sourcePath,
                  `\`when:\` references prop '${guardProp}' which is not declared on part '${guardPart}'.`,
                ),
              );
            } else if (propEntry.type !== "boolean") {
              ctx.issues.push(
                issue(
                  specName,
                  sourcePath,
                  `\`when:\` prop '${guardPart}.${guardProp}' must be a \`type: boolean\` prop; got '${propEntry.type}'.`,
                ),
              );
            }
          }
        }
      }

      // Rule 5 — emits event names + payload literals.
      if ("emits" in long && long.emits !== undefined) {
        for (const [emittedName, payloadLiteral] of Object.entries(long.emits)) {
          const eventEntry = ctx.declaredEvents[emittedName];
          if (!eventEntry) {
            ctx.issues.push(
              issue(
                specName,
                sourcePath,
                `emits: '${emittedName}' is not declared in root \`events:\`.${suggestionFragment(emittedName, ctx.declaredEventNames)}`,
              ),
            );
            continue;
          }
          for (const [field, literal] of Object.entries(payloadLiteral)) {
            const fieldSchema = eventEntry.payload[field];
            if (!fieldSchema) {
              ctx.issues.push(
                issue(
                  specName,
                  sourcePath,
                  `emits: '${emittedName}' payload field '${field}' is not declared in events.${emittedName}.payload.`,
                ),
              );
              continue;
            }
            if (
              fieldSchema.type === "enum" &&
              typeof literal === "string" &&
              !fieldSchema.values.includes(literal)
            ) {
              ctx.issues.push(
                issue(
                  specName,
                  sourcePath,
                  `emits: '${emittedName}.${field}' value '${literal}' is not in the declared enum [${fieldSchema.values.map((v) => `'${v}'`).join(", ")}].`,
                ),
              );
            }
          }
        }
      }
    }
  }
}
