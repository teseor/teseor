import { collectSlots } from "../../../lib/collect-slots.ts";
import { renderEnumType } from "../../../lib/enum-primitives.ts";
import { specVoidStatus, voidTagsInMap } from "../../../lib/html-void-elements.ts";
import { reactJsDocFlavor, renderComponentJsDoc } from "../../../lib/jsdoc-shape.ts";
import { pascalCase } from "../../../lib/pascal-case.ts";
import { RESPONSIVE_BLOCK_PROPS } from "../../../lib/responsive-blocks.ts";
import type { Spec } from "../../gen-contract.ts";
import { renderA11yAttrs, renderDataAttrs, renderStateAttrs } from "../_shared/attrs.ts";
import {
  collectBranchComputes,
  renderReactBranches,
  renderReactStateInits,
} from "../_shared/branches.ts";
import {
  renderDestructure,
  renderOwnProps,
  renderPropsTypeIntersection,
} from "../_shared/props.ts";
import { renderBody } from "../_shared/slots.ts";
import { quote } from "../_shared/type-printer.ts";

/** Biome lint rules to suppress on specific void elements. Biome's JSX lint
 *  can't see required HTML attributes forwarded through the `{...rest}`
 *  spread; the suppression is targeted at the exact rule + element pair. */
const VOID_ELEMENT_BIOME_IGNORES: Partial<Record<string, string>> = {
  img: "lint/a11y/useAltText: alt is forwarded via {...rest}",
};

/** Biome lint rules to suppress on specific element + a11y role combinations.
 *  Native form controls (`<input type="checkbox" role="switch">`) carry the
 *  required ARIA state implicitly via their HTML attributes; Biome's lint
 *  can't see across that boundary. */
const ROLE_BIOME_IGNORES: Partial<Record<string, Partial<Record<string, string>>>> = {
  input: {
    switch: 'lint/a11y/useAriaPropsForRole: aria-checked is implicit from type="checkbox"',
  },
};

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
  const elementByProp = spec.elementByProp;
  // When `as` is the `elementByProp` control it indexes a closed tag map at
  // runtime — `asElement(as ?? "div")` is the wrong path. Suppress the free
  // polymorphism branch so the elementByProp branch wins.
  const hasAs = "as" in propMap && !elementByProp;
  const hasDisabled = "disabled" in propMap;
  const hasLoading = "loading" in propMap;
  const isPolymorphic = spec.polymorphic === "asChild";
  const slots = collectSlots(spec);

  const sizeIsResponsive = Boolean(spec.sizes) && RESPONSIVE_BLOCK_PROPS.has("size");
  const responsiveProps: string[] = [
    ...(sizeIsResponsive ? ["size"] : []),
    ...Object.entries(propMap)
      .filter(([, d]) => d.responsive === true)
      .map(([n]) => n),
  ];

  // Boolean spec props become `data-{name}` flags on the root element. The
  // controlling prop for `elementByProp`, the `disabled` / `loading` pair,
  // controllable booleans, and responsive booleans are emitted by their
  // dedicated paths and are excluded here.
  const booleanStateProps: string[] = Object.entries(propMap)
    .filter(
      ([name, d]) =>
        d.type === "boolean" &&
        d.responsive !== true &&
        d.pattern !== "controllable" &&
        name !== "disabled" &&
        name !== "loading" &&
        name !== elementByProp?.prop,
    )
    .map(([name]) => name);

  // Non-responsive string-enum spec props become `data-{name}={value}` on
  // the root. Responsive enums go through `responsiveDataAttrs`; the
  // polymorphic `as` prop, the `elementByProp` controlling prop, ariaProps
  // (emitted as `aria-{name}`), and slot props are excluded.
  const ariaPropNames = new Set(spec.kind === "atomic" ? (spec.a11y?.ariaProps ?? []) : []);
  const stringEnumStateProps: string[] = Object.entries(propMap)
    .filter(
      ([name, d]) =>
        d.type === "string" &&
        Array.isArray(d.values) &&
        d.values.length > 0 &&
        d.responsive !== true &&
        d.slot !== true &&
        name !== "as" &&
        name !== elementByProp?.prop &&
        !ariaPropNames.has(name),
    )
    .map(([name]) => name);

  const inactiveExpr = [
    hasDisabled ? "disabled === true" : null,
    hasLoading ? "loading === true" : null,
  ]
    .filter((p): p is string => p !== null)
    .join(" || ");

  const rootExpr = hasAs ? `as ?? ${quote(spec.element ?? "div")}` : quote(spec.element ?? "div");
  const componentTag =
    hasAs || isPolymorphic || elementByProp ? "Component" : (spec.element ?? "div");

  const voidStatus = specVoidStatus(spec);
  const isVoid = voidStatus === "all";
  const isMixedVoid = voidStatus === "mixed";

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

  // For a `mixed` elementByProp map (some void, some non-void), the rendered
  // tag's void-ness can only be known at runtime. Hoist the resolved tag into
  // a local so JSX can branch self-closing vs with-children, and asChild can
  // skip Slot on the void path (Slot wraps children, which void tags reject).
  const resolvedTagLine =
    isMixedVoid && tagFromProp ? `  const resolvedTag = ${tagFromProp};` : null;
  const voidCheckExpr =
    isMixedVoid && elementByProp
      ? voidTagsInMap(elementByProp.map)
          .map((tag) => `resolvedTag === ${quote(tag)}`)
          .join(" || ")
      : null;
  const isVoidResolvedLine = voidCheckExpr ? `  const isVoidResolved = ${voidCheckExpr};` : null;

  // With elementByProp the rendered tag is one of the map values; `asElement`
  // widens the narrow literal-string union back to ElementType so JSX's ref
  // slot isn't pinned to one HTMLElement subtype. The same widening covers
  // heterogeneous maps (e.g. `span | p | em`) where the union is not a single
  // shared HTMLElement subclass — JSX would otherwise infer the last entry's
  // ref type and reject `Ref<HTMLElement>` from the consumer.
  const tagExpr = isMixedVoid ? "resolvedTag" : tagFromProp;
  const componentLine = isPolymorphic
    ? isMixedVoid
      ? `  const Component = asChild && !isVoidResolved ? Slot : asElement(resolvedTag);`
      : tagExpr
        ? `  const Component = asChild ? Slot : asElement(${tagExpr});`
        : `  const Component = asChild ? Slot : asElement(${quote(spec.element ?? "div")});`
    : hasAs
      ? `  const Component = asElement(${rootExpr});`
      : tagExpr
        ? `  const Component = asElement(${tagExpr});`
        : null;

  // Imperative DOM-property props (e.g. `<input>.indeterminate`) — set via
  // `useEffect` after mount because no HTML attribute exists for them. The
  // consumer ref composes with an internal ref via `mergeRefs`. The inner ref
  // types against the rendered element's interface.
  const imperativePropEntries =
    spec.kind === "atomic" ? Object.entries(spec.imperativeProps ?? {}) : [];
  const hasImperativeProps = imperativePropEntries.length > 0;
  const imperativeRefElement = spec.element ?? "div";
  const imperativeRefLine = hasImperativeProps
    ? `  const innerRef = useRef<HTMLElementTagNameMap[${quote(imperativeRefElement)}]>(null);`
    : null;
  const imperativeEffectLines = imperativePropEntries
    .map(
      ([name]) =>
        `  useEffect(() => {\n    if (innerRef.current) innerRef.current.${name} = ${name} ?? false;\n  }, [${name}]);`,
    )
    .join("\n");
  const refExpr = hasImperativeProps ? `mergeRefs(innerRef, ref)` : "ref";

  const stateInitsBlock = spec.kind === "atomic" ? renderReactStateInits(spec.state) : "";
  const helperBlock = [
    tagMapLine,
    resolvedTagLine,
    isVoidResolvedLine,
    componentLine,
    hasDisabled && hasAs ? `  const isButton = Component === "button";` : null,
    inactiveExpr ? `  const inactive = ${inactiveExpr};` : null,
    `  const mergedClassName = mergeClass("${rootClass}", className);`,
    imperativeRefLine,
    imperativeEffectLines || null,
    stateInitsBlock || null,
  ]
    .filter((l): l is string => l !== null && l !== "")
    .join("\n");

  const a11y = spec.kind === "atomic" ? spec.a11y : undefined;
  // Static HTML attrs sit AFTER `{...rest}` so the consumer can't override the
  // component contract (Switch is `type="checkbox"`, not negotiable).
  const htmlAttrs = spec.kind === "atomic" ? (spec.htmlAttrs ?? {}) : {};
  const htmlAttrLines = Object.entries(htmlAttrs)
    .map(([k, v]) => `      ${k}=${JSON.stringify(v)}`)
    .join("\n");
  const roleBiomeIgnore =
    spec.element && a11y?.role ? ROLE_BIOME_IGNORES[spec.element]?.[a11y.role] : undefined;
  const attrBlock = [
    `      {...rest}`,
    `      ref={${refExpr}}`,
    `      className={mergedClassName}`,
    htmlAttrLines || null,
    renderA11yAttrs(
      a11y?.role,
      a11y?.ariaProps ?? [],
      a11y?.decorativeProp,
      a11y?.labelProp,
      roleBiomeIgnore,
    ) || null,
    renderDataAttrs(spec, responsiveProps, hasLoading, booleanStateProps, stringEnumStateProps) ||
      null,
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
  const branches = spec.kind === "atomic" ? spec.branches : undefined;
  const innerBody = isVoid
    ? ""
    : branches !== undefined
      ? renderReactBranches(branches, "      ")
      : renderBody(spec, slots, hasLoading);
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

  // `asElement` is the runtime widener for any spec that resolves its root
  // tag from a value (free `as` polymorphism or `elementByProp` map) AND for
  // polymorphic specs whose Component constant alternates between `Slot` and
  // an intrinsic tag literal — without it the JSX ref slot pins to that one
  // intrinsic's HTMLElement subtype and rejects the widened consumer ref.
  const usesAsElement = hasAs || Boolean(elementByProp) || isPolymorphic;
  const stateEntries = spec.kind === "atomic" ? Object.entries(spec.state ?? {}) : [];
  const hasState = stateEntries.length > 0;
  const branchComputes = collectBranchComputes(branches);
  const reactValueImports = [
    hasImperativeProps ? "useEffect" : null,
    hasImperativeProps ? "useRef" : null,
    hasState ? "useState" : null,
  ].filter((l): l is string => l !== null);
  const reactTypeImports = ["ComponentProps", ...(isVoid ? [] : ["ReactNode"]), "Ref"];
  const runtimeImports = [
    usesAsElement ? "asElement" : null,
    "mergeClass",
    hasImperativeProps ? "mergeRefs" : null,
    responsiveProps.length > 0 ? "type Responsive" : null,
    responsiveProps.length > 0 ? "responsiveDataAttrs" : null,
    ...branchComputes,
  ].filter((l): l is string => l !== null);
  const imports = [
    `import "@teseor/css/components/${spec.name}.css";`,
    reactValueImports.length > 0
      ? `import { ${reactValueImports.join(", ")} } from "react";`
      : null,
    `import type { ${reactTypeImports.join(", ")} } from "react";`,
    `import { ${runtimeImports.join(", ")} } from "./_runtime.ts";`,
    isPolymorphic ? `import { Slot } from "./components/Slot.tsx";` : null,
  ]
    .filter((l): l is string => l !== null)
    .join("\n");

  const voidBiomeIgnore =
    isVoid && spec.element ? VOID_ELEMENT_BIOME_IGNORES[spec.element] : undefined;
  const biomeIgnoreLine = voidBiomeIgnore ? `    // biome-ignore ${voidBiomeIgnore}\n` : "";

  const indent = (text: string, prefix: string): string =>
    text
      .split("\n")
      .map((line) => (line.length > 0 ? `${prefix}${line}` : line))
      .join("\n");

  const renderElement = isVoid
    ? `${biomeIgnoreLine}    <${componentTag}\n${attrBlock}\n    />`
    : isMixedVoid
      ? // Runtime branch on the resolved tag's void-ness: void tag → self-closing
        // (children rejected by HTML); non-void tag → with-children, where Slot
        // may have replaced Component when `asChild` is true.
        `    isVoidResolved ? (\n      <${componentTag}\n${indent(attrBlock, "  ")}\n      />\n    ) : (\n      <${componentTag}\n${indent(attrBlock, "  ")}\n      >\n${indent(bodyBlock, "  ")}\n      </${componentTag}>\n    )`
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
