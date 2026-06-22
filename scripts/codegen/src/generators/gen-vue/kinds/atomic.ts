import { collectSlots } from "../../../lib/collect-slots.ts";
import { renderEnumType } from "../../../lib/enum-primitives.ts";
import { isVoidElement } from "../../../lib/html-void-elements.ts";
import { renderComponentJsDoc, vueJsDocFlavor } from "../../../lib/jsdoc-shape.ts";
import { pascalCase } from "../../../lib/pascal-case.ts";
import type { Spec } from "../../gen-contract.ts";
import { renderAttrEntries } from "../_shared/attrs.ts";
import { renderPropsBlock, renderPropsType } from "../_shared/props.ts";
import { renderBody, renderSlotsType } from "../_shared/slots.ts";

/** Enum props whose values are also responsive — currently `size`. The
 *  generator wraps the prop type in `Responsive<…>` and emits per-breakpoint
 *  `data-{name}-{bp}` attrs at runtime. */
const RESPONSIVE_ENUM_PROPS = new Set(["size"]);

/** Emit a Vue SFC for an atomic spec — a single root element wrapping
 *  `<slot />` plus optional positioned slots and the `data-*` attribute
 *  surface (variant / intent / size / responsive). */
export function renderAtomicVueWrapper(
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

  const inactiveExpr = [hasDisabled ? "disabled" : null, hasLoading ? "loading" : null]
    .filter((p): p is string => p !== null)
    .join(" || ");

  const componentTag =
    hasAs || isPolymorphic || elementByProp ? "component" : (spec.element ?? "div");
  const elementByPropDefault =
    (elementByProp && (spec.props?.[elementByProp.prop]?.default as string | undefined)) ||
    (elementByProp && Object.keys(elementByProp.map)[0]) ||
    null;
  // Single-quoted literal so the expression nests inside v-bind's double-quoted
  // attribute without HTML escaping (`:is="tagMap[level ?? 'h1']"`).
  const tagFromProp =
    elementByProp && elementByPropDefault !== null
      ? `tagMap[${elementByProp.prop} ?? '${elementByPropDefault}']`
      : null;
  const polymorphicIsExpr = isPolymorphic
    ? `asChild ? Slot : ${tagFromProp ?? JSON.stringify(spec.element ?? "div")}`
    : (tagFromProp ?? null);

  const tagMapLine = elementByProp
    ? `const tagMap = { ${Object.entries(elementByProp.map)
        .map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`)
        .join(", ")} } as const;`
    : null;

  const helperLines = [
    tagMapLine,
    hasDisabled && hasAs ? `const isButton = computed(() => as === "button");` : null,
    inactiveExpr ? `const inactive = computed(() => ${inactiveExpr});` : null,
  ]
    .filter((l): l is string => l !== null)
    .join("\n");

  const attrEntries = renderAttrEntries(spec, responsiveProps, hasLoading, hasDisabled, hasAs);

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
  // self-closing template form and skip the body. Slot/loading state on a
  // void spec is a spec authoring error and is not validated here.
  const isVoid = spec.element ? isVoidElement(spec.element) : false;
  const innerBody = isVoid ? "" : renderBody(spec, slots, hasLoading);
  const bodyBlock =
    !isVoid && spec.kind === "atomic" && spec.slotElement
      ? `  <${spec.slotElement}>\n${innerBody}\n  </${spec.slotElement}>`
      : innerBody;
  const isExpr = polymorphicIsExpr ?? (hasAs ? "as" : null);
  const rootOpen = isVoid
    ? isExpr
      ? `<component :is="${isExpr}" class="${rootClass}" v-bind="attrs" />`
      : `<${componentTag} class="${rootClass}" v-bind="attrs" />`
    : isExpr
      ? `<component :is="${isExpr}" class="${rootClass}" v-bind="attrs">`
      : `<${componentTag} class="${rootClass}" v-bind="attrs">`;
  const rootClose = isVoid ? "" : isExpr ? `</component>` : `</${componentTag}>`;

  const imports = [
    `import "@teseor/css/components/${spec.name}.css";`,
    `import { computed, type VNode } from "vue";`,
    responsiveProps.length > 0
      ? `import { type Responsive, responsiveDataAttrs } from "./_runtime.ts";`
      : null,
    isPolymorphic ? `import { Slot } from "./components/Slot.ts";` : null,
  ]
    .filter((l): l is string => l !== null)
    .join("\n");

  return `<!-- AUTOGENERATED by gen-vue. Do not edit. -->
<!-- Source: specs/${spec.name}.yaml -->
<script setup lang="ts">
${renderComponentJsDoc(spec, Name, vueJsDocFlavor)}
${imports}

${typeBlock}
${renderPropsType(spec, Name, sizeIsResponsive, propDescriptions)}

${renderPropsBlock(spec, Name)}

${renderSlotsType(slots)}

${helperLines}

const attrs = computed(() => ({
${attrEntries}
}));
</script>

<template>
${
  isVoid
    ? `  ${rootOpen}`
    : `  ${rootOpen}
${bodyBlock}
  ${rootClose}`
}
</template>
`;
}
