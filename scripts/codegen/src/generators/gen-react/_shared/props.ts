import { pascalCase } from "../../../lib/pascal-case.ts";
import type { Spec, SpecProp } from "../../gen-contract.ts";
import { quote, reactPropType, responsiveType } from "./type-printer.ts";

const LINE_WIDTH = 100;

/** Print the prop-type line(s) for a single spec prop. Controllable booleans
 *  expand to a triple (`name`, `defaultName`, `onNameChange`); everything else
 *  collapses to a single `name?: type;` line, optionally preceded by JSDoc. */
export function renderPropLine(
  propName: string,
  propDef: SpecProp,
  propDescriptions: Record<string, string>,
  Name: string,
): string[] {
  // Controllable boolean expands to a triple: `name`, `defaultName`, `onNameChange`.
  if (propDef.pattern === "controllable" && propDef.type === "boolean") {
    const PName = pascalCase(propName);
    const desc = propDef.description ?? propDescriptions[propName];
    return [
      desc ? `  /** ${desc} */` : null,
      `  ${propName}?: boolean;`,
      `  /** Initial open state (uncontrolled). */`,
      `  default${PName}?: boolean;`,
      `  /** Fires when the open state changes. */`,
      `  on${PName}Change?: (${propName}: boolean) => void;`,
    ].filter((l): l is string => l !== null);
  }
  const baseType = reactPropType(propName, propDef, Name);
  const tsType = propDef.responsive === true ? responsiveType(baseType) : baseType;
  const desc = propDef.description ?? propDescriptions[propName];
  return [desc ? `  /** ${desc} */` : null, `  ${propName}?: ${tsType};`].filter(
    (l): l is string => l !== null,
  );
}

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

/** Emit the `type {Name}OwnProps = { … }` block — the React-specific shape
 *  the wrapper intersects with `ComponentProps<element>` to get its full
 *  props surface. Includes the `children?: ReactNode` and `ref?: …` slots. */
export function renderOwnProps(
  spec: Spec,
  Name: string,
  sizeIsResponsive: boolean,
  propDescriptions: Record<string, string>,
): string {
  const sizeType = sizeIsResponsive ? responsiveType(`${Name}Size`) : `${Name}Size`;
  const propLines = Object.entries(spec.props ?? {}).flatMap(([n, d]) =>
    renderPropLine(n, d, propDescriptions, Name),
  );
  const variantLines = spec.variants
    ? renderCanonicalProp("variant", `${Name}Variant`, propDescriptions)
    : [];
  const intentLines = spec.intents
    ? renderCanonicalProp("intent", `${Name}Intent`, propDescriptions)
    : [];
  const sizeLines = spec.sizes ? renderCanonicalProp("size", sizeType, propDescriptions) : [];
  const hasAs = "as" in (spec.props ?? {});
  const isPolymorphic = spec.polymorphic === "asChild";
  const isElementByProp = Boolean(spec.elementByProp);
  const refType =
    hasAs || (isPolymorphic && !isElementByProp)
      ? "Ref<HTMLElement>"
      : isElementByProp && spec.elementByProp
        ? `Ref<HTMLElementTagNameMap[${[...new Set(Object.values(spec.elementByProp.map))]
            .map((tag) => quote(tag))
            .join(" | ")}]>`
        : `Ref<HTMLElementTagNameMap[${quote(spec.element ?? "div")}]>`;
  const asChildLines = isPolymorphic
    ? [
        `  /** Render directly on the consumer's child element via Slot (cloneElement) instead of wrapping in a \`<${spec.element ?? "div"}>\`. Single-child invariant. */`,
        `  asChild?: boolean;`,
      ]
    : [];
  return [
    `type ${Name}OwnProps = {`,
    ...variantLines,
    ...intentLines,
    ...sizeLines,
    ...propLines,
    ...asChildLines,
    `  children?: ReactNode;`,
    `  ref?: ${refType};`,
    `};`,
  ].join("\n");
}

/** Emit the `const { … } = props;` destructure block for the wrapper body.
 *  Collapses to a one-liner under the 100-col line width, breaks to a
 *  multi-line block otherwise. */
export function renderDestructure(spec: Spec): string {
  const names = [
    spec.variants ? "variant" : null,
    spec.intents ? "intent" : null,
    spec.sizes ? "size" : null,
    ...Object.keys(spec.props ?? {}),
    spec.polymorphic === "asChild" ? "asChild" : null,
    "children",
    "ref",
    "className",
    "...rest",
  ].filter((n): n is string => n !== null);
  const oneLine = `  const { ${names.join(", ")} } = props;`;
  if (oneLine.length <= LINE_WIDTH) return oneLine;
  return [
    "  const {",
    ...names.map((n) => `    ${n}${n.startsWith("...") ? "" : ","}`),
    "  } = props;",
  ].join("\n");
}

/** Emit the `export type {Name}Props = Readonly<… & Omit<ComponentProps<…>, keyof OwnProps>>;`
 *  intersection. Collapses to a one-liner under 100 cols, otherwise breaks
 *  the intersection across multiple lines. */
export function renderPropsTypeIntersection(Name: string, element: string): string {
  const oneLine = `export type ${Name}Props = Readonly<${Name}OwnProps & Omit<ComponentProps<"${element}">, keyof ${Name}OwnProps>>;`;
  if (oneLine.length <= LINE_WIDTH) return oneLine;
  return [
    `export type ${Name}Props = Readonly<`,
    `  ${Name}OwnProps & Omit<ComponentProps<"${element}">, keyof ${Name}OwnProps>`,
    `>;`,
  ].join("\n");
}
