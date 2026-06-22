import { collectSlots } from "../../../lib/collect-slots.ts";
import { renderEnumType } from "../../../lib/enum-primitives.ts";
import { isVoidElement } from "../../../lib/html-void-elements.ts";
import { reactJsDocFlavor, renderComponentJsDoc } from "../../../lib/jsdoc-shape.ts";
import { pascalCase } from "../../../lib/pascal-case.ts";
import type { Spec } from "../../gen-contract.ts";
import { renderDataAttrs, renderStateAttrs } from "../_shared/attrs.ts";
import {
  renderDestructure,
  renderOwnProps,
  renderPropsTypeIntersection,
} from "../_shared/props.ts";
import { renderBody } from "../_shared/slots.ts";
import { quote } from "../_shared/type-printer.ts";

/** Enum props whose values are also responsive — currently `size`. The
 *  generator wraps the prop type in `Responsive<…>` and emits per-breakpoint
 *  `data-{name}-{bp}` attrs at runtime. */
const RESPONSIVE_ENUM_PROPS = new Set(["size"]);

/** Emit a React wrapper for an atomic spec — a single root element wrapping
 *  `{children}` plus optional positioned slots and the `data-*` attribute
 *  surface (variant / intent / size / responsive). */
export function renderAtomicReactWrapper(
  spec: Spec,
  propDescriptions: Record<string, string>,
): string {
  const Name = pascalCase(spec.name);
  const rootClass = spec.rootClass ?? `t-${spec.name}`;
  const propMap = spec.props ?? {};
  const hasAs = "as" in propMap;
  const hasDisabled = "disabled" in propMap;
  const hasLoading = "loading" in propMap;
  const isPolymorphic = spec.polymorphic === "asChild";
  const elementByProp = spec.elementByProp;
  const slots = collectSlots(spec);

  const sizeIsResponsive = Boolean(spec.sizes) && RESPONSIVE_ENUM_PROPS.has("size");
  const responsiveProps: string[] = [
    ...(sizeIsResponsive ? ["size"] : []),
    ...Object.entries(propMap)
      .filter(([, d]) => d.responsive === true)
      .map(([n]) => n),
  ];

  const inactiveExpr = [
    hasDisabled ? "disabled === true" : null,
    hasLoading ? "loading === true" : null,
  ]
    .filter((p): p is string => p !== null)
    .join(" || ");

  const rootExpr = hasAs ? `as ?? ${quote(spec.element ?? "div")}` : quote(spec.element ?? "div");
  const componentTag =
    hasAs || isPolymorphic || elementByProp ? "Component" : (spec.element ?? "div");

  const tagMapLine = elementByProp
    ? `  const tagMap = { ${Object.entries(elementByProp.map)
        .map(([k, v]) => `${quote(k)}: ${quote(v)}`)
        .join(", ")} } as const;`
    : null;
  const elementByPropDefault =
    (elementByProp && (spec.props?.[elementByProp.prop]?.default as string | undefined)) ||
    (elementByProp && Object.keys(elementByProp.map)[0]) ||
    null;
  const tagFromProp =
    elementByProp && elementByPropDefault !== null
      ? `tagMap[${elementByProp.prop} ?? ${quote(elementByPropDefault)}]`
      : null;

  // With elementByProp the rendered tag is one of the map values; annotating
  // Component as ElementType widens the JSX inference past the literal-string
  // union, so the consumer-facing `ref?: Ref<HTMLElement>` passes through.
  const componentLine = isPolymorphic
    ? tagFromProp
      ? `  const Component: ElementType = asChild ? Slot : ${tagFromProp};`
      : `  const Component = asChild ? Slot : ${quote(spec.element ?? "div")};`
    : hasAs
      ? `  const Component = asElement(${rootExpr});`
      : tagFromProp
        ? `  const Component: ElementType = ${tagFromProp};`
        : null;

  const helperBlock = [
    tagMapLine,
    componentLine,
    hasDisabled && hasAs ? `  const isButton = Component === "button";` : null,
    inactiveExpr ? `  const inactive = ${inactiveExpr};` : null,
    `  const mergedClassName = mergeClass("${rootClass}", className);`,
  ]
    .filter((l): l is string => l !== null)
    .join("\n");

  const attrBlock = [
    `      {...rest}`,
    `      ref={ref}`,
    `      className={mergedClassName}`,
    renderDataAttrs(spec, responsiveProps, hasLoading) || null,
    renderStateAttrs(hasAs, hasDisabled, hasLoading) || null,
  ]
    .filter((l): l is string => l !== null && l !== "")
    .join("\n");

  const propEnumTypes = Object.entries(spec.props ?? {})
    .filter(([, d]) => Array.isArray(d.values) && d.values.length > 0)
    .map(([propName, d]) => renderEnumType(Name, pascalCase(propName), d.values ?? []));

  const typeBlock = [
    renderEnumType(Name, "Variant", Object.keys(spec.variants ?? {})),
    renderEnumType(Name, "Intent", Object.keys(spec.intents ?? {})),
    renderEnumType(Name, "Size", Object.keys(spec.sizes ?? {})),
    ...propEnumTypes,
  ]
    .filter(Boolean)
    .join("\n");

  // Void elements (hr, img, input, br, …) cannot have children — emit a
  // self-closing JSX form and skip the body. Slot/loading state on a void
  // spec is a spec authoring error and is not validated here.
  const isVoid = spec.element ? isVoidElement(spec.element) : false;
  const innerBody = isVoid ? "" : renderBody(spec, slots, hasLoading);
  const bodyBlock =
    !isVoid && spec.kind === "atomic" && spec.slotElement
      ? `      <${spec.slotElement}>\n${innerBody}\n      </${spec.slotElement}>`
      : innerBody;
  const typeBlockPrefix = typeBlock ? `${typeBlock}\n` : "";
  // With elementByProp the root tag is runtime-resolved across a set of
  // elements; intersect against `div` for the consumer's pass-through props
  // (the common HTMLAttributes surface). Refs widen to HTMLElement separately
  // via renderOwnProps.
  const propsTypeLine = renderPropsTypeIntersection(Name, spec.element ?? "div");

  const imports = [
    `import "@teseor/css/components/${spec.name}.css";`,
    elementByProp
      ? `import type { ComponentProps, ElementType, ReactNode, Ref } from "react";`
      : `import type { ComponentProps, ReactNode, Ref } from "react";`,
    hasAs && responsiveProps.length > 0
      ? `import { asElement, mergeClass, type Responsive, responsiveDataAttrs } from "./_runtime.ts";`
      : hasAs
        ? `import { asElement, mergeClass } from "./_runtime.ts";`
        : responsiveProps.length > 0
          ? `import { mergeClass, type Responsive, responsiveDataAttrs } from "./_runtime.ts";`
          : `import { mergeClass } from "./_runtime.ts";`,
    isPolymorphic ? `import { Slot } from "./components/Slot.tsx";` : null,
  ]
    .filter((l): l is string => l !== null)
    .join("\n");

  const renderElement = isVoid
    ? `    <${componentTag}\n${attrBlock}\n    />`
    : `    <${componentTag}\n${attrBlock}\n    >\n${bodyBlock}\n    </${componentTag}>`;

  return `"use client";

// AUTOGENERATED by gen-react. Do not edit.
// Source: specs/${spec.name}.yaml

${imports}

${typeBlockPrefix}${renderOwnProps(spec, Name, sizeIsResponsive, propDescriptions)}

${propsTypeLine}

${renderComponentJsDoc(spec, Name, reactJsDocFlavor)}export function ${Name}(props: ${Name}Props) {
${renderDestructure(spec)}

${helperBlock}

  return (
${renderElement}
  );
}
`;
}
