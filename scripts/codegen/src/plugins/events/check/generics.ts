import { isAtomic, isComposite } from "../../../core/check-utils.ts";
import { pascalCase } from "../../../lib/pascal-case.ts";
import type { Spec, SpecPart } from "../../../schema.ts";

// Generic names that would shadow codegen-emitted globals when used as a
// type parameter. Two sources:
//  - Codegen helpers / imports: `Array` (array payload), `Record`
//    (empty-props sentinel), `Partial`, `ReadonlyArray` (repeating-part
//    prop type), `Responsive` (responsive-helper import).
//  - Closed-vocab event builtins (`File`, `Date`, `MouseEvent`, …) added
//    at check time from vocabulary.events.builtins.
export const RESERVED_GENERIC_NAMES_BASE = new Set([
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
export function collectSpecLocalAliases(spec: Spec): Set<string> {
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

export function addNodeAliases(
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

export function repeatingItemTypeName(
  componentName: string,
  part: SpecPart,
  partName: string,
): string {
  if (typeof part.groupKey === "string") {
    if (part.groupKey.toLowerCase() === "items") return `${componentName}Item`;
    return `${componentName}${pascalCase(part.groupKey)}Item`;
  }
  return `${componentName}${pascalCase(partName)}Item`;
}
