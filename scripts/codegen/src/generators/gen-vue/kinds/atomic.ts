import { collectSlots } from "../../../lib/collect-slots.ts";
import { renderEnumType } from "../../../lib/enum-primitives.ts";
import { specVoidStatus, voidTagsInMap } from "../../../lib/html-void-elements.ts";
import { renderComponentJsDoc, vueJsDocFlavor } from "../../../lib/jsdoc-shape.ts";
import { pascalCase } from "../../../lib/pascal-case.ts";
import { RESPONSIVE_BLOCK_PROPS } from "../../../lib/responsive-blocks.ts";
import type { Spec } from "../../gen-contract.ts";
import { renderA11yAttrEntries, renderAttrEntries } from "../_shared/attrs.ts";
import { renderPropsBlock, renderPropsType } from "../_shared/props.ts";
import { renderBody, renderSlotsType } from "../_shared/slots.ts";

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
  const elementByProp = spec.elementByProp;
  // When `as` is the `elementByProp` control it indexes a closed tag map at
  // runtime — the free `<component :is="as">` polymorphism path is the wrong
  // one. Suppress so the elementByProp branch wins.
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

  const voidStatus = specVoidStatus(spec);
  const isVoid = voidStatus === "all";
  const isMixedVoid = voidStatus === "mixed";

  // For a `mixed` elementByProp map (some void, some non-void), the rendered
  // tag's void-ness is only known at runtime. Resolve the tag into a computed
  // and emit a parallel `isVoidResolved` computed so the template can switch
  // between self-closing and with-children variants via v-if/v-else.
  const resolvedTagExpr = isMixedVoid ? tagFromProp : null;

  // For a `mixed` map the v-bind `:is` references the resolved tag computed
  // (`resolvedTag`) rather than re-evaluating the tagMap lookup inline.
  const tagBindExpr = isMixedVoid ? "resolvedTag" : tagFromProp;
  // Single-quoted literal so the expression nests inside v-bind's double-quoted
  // attribute (`:is="asChild ? Slot : 'a'"`); JSON.stringify would yield "a"
  // which collides with the surrounding double quotes.
  const polymorphicIsExpr = isPolymorphic
    ? isMixedVoid
      ? `asChild && !isVoidResolved ? Slot : ${tagBindExpr ?? `'${spec.element ?? "div"}'`}`
      : `asChild ? Slot : ${tagBindExpr ?? `'${spec.element ?? "div"}'`}`
    : (tagBindExpr ?? null);

  const tagMapLine = elementByProp
    ? `const tagMap = { ${Object.entries(elementByProp.map)
        .map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`)
        .join(", ")} } as const;`
    : null;

  const resolvedTagComputed =
    isMixedVoid && resolvedTagExpr
      ? `const resolvedTag = computed(() => ${resolvedTagExpr});`
      : null;
  const voidCheckExpr =
    isMixedVoid && elementByProp
      ? voidTagsInMap(elementByProp.map)
          .map((tag) => `resolvedTag.value === '${tag}'`)
          .join(" || ")
      : null;
  const isVoidResolvedComputed = voidCheckExpr
    ? `const isVoidResolved = computed(() => ${voidCheckExpr});`
    : null;

  const helperLines = [
    tagMapLine,
    resolvedTagComputed,
    isVoidResolvedComputed,
    hasDisabled && hasAs ? `const isButton = computed(() => as === "button");` : null,
    inactiveExpr ? `const inactive = computed(() => ${inactiveExpr});` : null,
  ]
    .filter((l): l is string => l !== null)
    .join("\n");

  const a11y = spec.kind === "atomic" ? spec.a11y : undefined;
  const a11yEntries = renderA11yAttrEntries(
    a11y?.role,
    a11y?.ariaProps ?? [],
    a11y?.decorativeProp,
  );
  const attrEntries = [
    a11yEntries || null,
    renderAttrEntries(
      spec,
      responsiveProps,
      hasLoading,
      hasDisabled,
      hasAs,
      booleanStateProps,
      stringEnumStateProps,
    ) || null,
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
  // self-closing template form and skip the body. Slot/loading state on a
  // void spec is a spec authoring error and is not validated here.
  const innerBody = isVoid ? "" : renderBody(spec, slots, hasLoading);
  const bodyBlock =
    !isVoid && spec.kind === "atomic" && spec.slotElement
      ? `  <${spec.slotElement}>\n${innerBody}\n  </${spec.slotElement}>`
      : innerBody;
  const isExpr = polymorphicIsExpr ?? (hasAs ? "as" : null);

  // For mixed-void maps the template branches at render time on
  // `isVoidResolved`: the void branch self-closes, the non-void branch renders
  // children. Both branches resolve the tag via `:is` so consumer-supplied
  // attrs land on the correct element.
  const mixedTemplate = isMixedVoid
    ? (() => {
        const opener = (closing: "self" | "open") =>
          isExpr
            ? `<component :is="${isExpr}" class="${rootClass}" v-bind="attrs"${closing === "self" ? " />" : ">"}`
            : `<${componentTag} class="${rootClass}" v-bind="attrs"${closing === "self" ? " />" : ">"}`;
        const closer = isExpr ? `</component>` : `</${componentTag}>`;
        const voidLine = `  <template v-if="isVoidResolved">\n    ${opener("self")}\n  </template>`;
        const nonVoidLine = `  <template v-else>\n    ${opener("open")}\n${bodyBlock}\n    ${closer}\n  </template>`;
        return `${voidLine}\n${nonVoidLine}`;
      })()
    : null;

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

  const templateBody = mixedTemplate
    ? mixedTemplate
    : isVoid
      ? `  ${rootOpen}`
      : `  ${rootOpen}
${bodyBlock}
  ${rootClose}`;

  return `<!-- AUTOGENERATED by gen-vue. Do not edit. -->
<!-- Source: specs/${spec.name}.yaml -->
<script setup lang="ts">
${renderComponentJsDoc(spec, Name, vueJsDocFlavor)}
${imports}

${typeBlock}
${renderPropsType(spec, Name, sizeIsResponsive, propDescriptions)}

${renderPropsBlock(spec, Name)}

${renderSlotsType(slots, { isVoid })}

${helperLines}

const attrs = computed(() => ({
${attrEntries}
}));
</script>

<template>
${templateBody}
</template>
`;
}
