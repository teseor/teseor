import type { Spec } from "../../gen-contract.ts";
import { quote, responsiveType, vuePropType } from "./type-printer.ts";

/** Print a canonical-prop line pair (optional JSDoc + `name?: type;`) for
 *  `variant` / `intent` / `size`, pulling the description from the vocabulary. */
export function renderCanonicalProp(
  name: string,
  tsType: string,
  descriptions: Record<string, string>,
): string[] {
  const desc = descriptions[name];
  return [desc ? `  /** ${desc} */` : null, `  ${name}?: ${tsType};`].filter(
    (l): l is string => l !== null,
  );
}

/** Emit the `type {Name}Props = { … }` block for an atomic Vue wrapper.
 *  Slot-typed props are skipped (they flow as named slots, not props). */
export function renderPropsType(
  spec: Spec,
  Name: string,
  sizeIsResponsive: boolean,
  propDescriptions: Record<string, string>,
): string {
  const sizeType = sizeIsResponsive ? responsiveType(`${Name}Size`) : `${Name}Size`;
  const lines = Object.entries(spec.props ?? {})
    .filter(([, def]) => def.slot !== true)
    .flatMap(([propName, propDef]) => {
      const baseType = vuePropType(propName, propDef, Name);
      const tsType = propDef.responsive === true ? responsiveType(baseType) : baseType;
      const desc = propDef.description ?? propDescriptions[propName];
      return [desc ? `  /** ${desc} */` : null, `  ${propName}?: ${tsType};`].filter(
        (l): l is string => l !== null,
      );
    });
  const variantLines = spec.variants
    ? renderCanonicalProp("variant", `${Name}Variant`, propDescriptions)
    : [];
  const intentLines = spec.intents
    ? renderCanonicalProp("intent", `${Name}Intent`, propDescriptions)
    : [];
  const sizeLines = spec.sizes ? renderCanonicalProp("size", sizeType, propDescriptions) : [];
  const asChildLines =
    spec.polymorphic === "asChild"
      ? [
          `  /** Render directly on the consumer's child VNode via Slot (cloneVNode) instead of wrapping in a \`<${spec.element ?? "div"}>\`. Single-child invariant. */`,
          `  asChild?: boolean;`,
        ]
      : [];
  const imperativeProps = spec.kind === "atomic" ? (spec.imperativeProps ?? {}) : {};
  const imperativeLines = Object.entries(imperativeProps).flatMap(([name, def]) =>
    [def.description ? `  /** ${def.description} */` : null, `  ${name}?: boolean;`].filter(
      (l): l is string => l !== null,
    ),
  );
  return [
    `type ${Name}Props = {`,
    ...variantLines,
    ...intentLines,
    ...sizeLines,
    ...lines,
    ...imperativeLines,
    ...asChildLines,
    `};`,
  ].join("\n");
}

/** Emit the `defineProps` destructure block for an atomic Vue wrapper.
 *  Collapses to a bare `defineProps<…>()` call when there are no props to bind. */
export function renderPropsBlock(spec: Spec, Name: string): string {
  const nonSlotProps = Object.entries(spec.props ?? {}).filter(([, def]) => def.slot !== true);
  const imperativePropNames = spec.kind === "atomic" ? Object.keys(spec.imperativeProps ?? {}) : [];
  const enumPropNames: string[] = [];
  if (spec.variants) enumPropNames.push("variant");
  if (spec.intents) enumPropNames.push("intent");
  if (spec.sizes) enumPropNames.push("size");
  if (
    enumPropNames.length === 0 &&
    nonSlotProps.length === 0 &&
    imperativePropNames.length === 0 &&
    spec.polymorphic !== "asChild"
  ) {
    return `defineProps<${Name}Props>();`;
  }
  const lines = [
    ...enumPropNames.map((n) => `  ${n},`),
    ...nonSlotProps.map(([name, def]) => {
      if (def.default !== undefined && def.default !== null) {
        const v = def.default;
        const value = typeof v === "string" ? quote(v as string) : String(v);
        return `  ${name} = ${value},`;
      }
      return `  ${name},`;
    }),
    ...imperativePropNames.map((n) => `  ${n},`),
    ...(spec.polymorphic === "asChild" ? ["  asChild,"] : []),
  ];
  return `const {
${lines.join("\n")}
} = defineProps<${Name}Props>();`;
}
