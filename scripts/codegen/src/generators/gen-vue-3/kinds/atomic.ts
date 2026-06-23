import { emptyAnalysis, type SpecAnalysis } from "../../../core/analysis.ts";
import { collectSlots } from "../../../lib/collect-slots.ts";
import { renderEnumType } from "../../../lib/enum-primitives.ts";
import { specVoidStatus, voidTagsInMap } from "../../../lib/html-void-elements.ts";
import { renderComponentJsDoc, vueJsDocFlavor } from "../../../lib/jsdoc-shape.ts";
import { pascalCase } from "../../../lib/pascal-case.ts";
import { RESPONSIVE_BLOCK_PROPS } from "../../../lib/responsive-blocks.ts";
import type { Spec } from "../../gen-contract.ts";
import { renderA11yAttrEntries, renderAttrEntries } from "../_shared/attrs.ts";
import { renderVueBranches, renderVueStateInits } from "../_shared/branches.ts";
import { renderPropsBlock, renderPropsType } from "../_shared/props.ts";
import { renderBody, renderSlotsType } from "../_shared/slots.ts";

/** Derive SpecAnalysis facts directly from a FlatSpec (atomic). Called only
 *  when no pre-computed analysis is threaded from the outer generator; in
 *  production, the generator computes analysis from the raw schema spec before
 *  flattening and threads it in as the `analysis` parameter. */
function deriveAnalysis(spec: Spec): SpecAnalysis {
  const propMap = spec.props ?? {};
  const responsive = new Set<string>();
  let hasAs = false;
  let hasDisabled = false;
  let hasLoading = false;
  for (const [name, def] of Object.entries(propMap)) {
    if (def.responsive === true) responsive.add(name);
    if (name === "as") hasAs = true;
    if (name === "disabled") hasDisabled = true;
    if (name === "loading") hasLoading = true;
  }
  const ariaPropNames = new Set<string>(spec.kind === "atomic" ? (spec.a11y?.ariaProps ?? []) : []);
  const branchComputes = new Set<string>();
  if (spec.kind === "atomic") {
    for (const branch of spec.branches ?? []) {
      const text = branch.text;
      if (text && "compute" in text) branchComputes.add(text.compute);
    }
  }
  return {
    ...emptyAnalysis(),
    responsivePropNames: responsive,
    hasAs,
    hasDisabled,
    hasLoading,
    hasPolymorphic: spec.kind === "atomic" && spec.polymorphic === "asChild",
    ariaPropNames,
    branchComputes,
    voidStatus: specVoidStatus(spec),
    elementByPropControllingProp: spec.kind === "atomic" ? spec.elementByProp?.prop : undefined,
  };
}

/** Emit a Vue SFC for an atomic spec — a single root element wrapping
 *  `<slot />` plus optional positioned slots and the `data-*` attribute
 *  surface (variant / intent / size / responsive). */
export function renderAtomicVueWrapper(
  spec: Spec,
  propDescriptions: Record<string, string>,
  analysis?: SpecAnalysis,
): string {
  const resolved = analysis ?? deriveAnalysis(spec);
  const Name = pascalCase(spec.name);
  const rootClass = spec.rootClass ?? `t-${spec.name}`;
  const propMap = spec.props ?? {};
  const elementByProp = spec.elementByProp;
  // When `as` is the `elementByProp` control it indexes a closed tag map at
  // runtime — the free `<component :is="as">` polymorphism path is the wrong
  // one. Suppress so the elementByProp branch wins.
  const hasAs = resolved.hasAs && !elementByProp;
  const hasDisabled = resolved.hasDisabled;
  const hasLoading = resolved.hasLoading;
  const isPolymorphic = resolved.hasPolymorphic;
  const slots = collectSlots(spec);

  // Plugin's responsivePropNames does not include "size" when spec.sizes is
  // set (that name is synthesised here, not declared in props). Merge inline.
  const sizeIsResponsive = Boolean(spec.sizes) && RESPONSIVE_BLOCK_PROPS.has("size");
  const responsiveProps: string[] = [
    ...(sizeIsResponsive ? ["size"] : []),
    ...Array.from(resolved.responsivePropNames),
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
  // For atomic specs, plugin's ariaPropNames (via visitAllNodes) is equivalent
  // to the inline read of spec.a11y?.ariaProps — visitAllNodes on atomic calls
  // fn(spec) exactly once.
  const ariaPropNames = resolved.ariaPropNames;
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

  const isVoid = resolved.voidStatus === "all";
  const isMixedVoid = resolved.voidStatus === "mixed";

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

  // Imperative DOM-property props (e.g. `<input>.indeterminate`) — set via
  // `watch` because no HTML attribute exists; v-bind="attrs" can't reach them.
  // `flush: 'post'` runs the setter after the DOM update, `immediate: true`
  // covers the initial mount.
  const imperativePropEntries =
    spec.kind === "atomic" ? Object.entries(spec.imperativeProps ?? {}) : [];
  const hasImperativeProps = imperativePropEntries.length > 0;
  const imperativeRefLine = hasImperativeProps
    ? `const rootRef = useTemplateRef<HTMLElementTagNameMap['${spec.element ?? "div"}']>("rootRef");`
    : null;
  const imperativeWatchLines = imperativePropEntries
    .map(
      ([name]) =>
        `watch(() => ${name}, (value) => {\n  if (rootRef.value) rootRef.value.${name} = value ?? false;\n}, { immediate: true, flush: "post" });`,
    )
    .join("\n");

  const stateInitsBlock = spec.kind === "atomic" ? renderVueStateInits(spec.latch) : "";
  const helperLines = [
    tagMapLine,
    resolvedTagComputed,
    isVoidResolvedComputed,
    hasDisabled && hasAs ? `const isButton = computed(() => as === "button");` : null,
    inactiveExpr ? `const inactive = computed(() => ${inactiveExpr});` : null,
    imperativeRefLine,
    imperativeWatchLines || null,
    stateInitsBlock || null,
  ]
    .filter((l): l is string => l !== null && l !== "")
    .join("\n");

  const a11y = spec.kind === "atomic" ? spec.a11y : undefined;
  const a11yEntries = renderA11yAttrEntries(
    a11y?.role,
    a11y?.ariaProps ?? [],
    a11y?.decorativeProp,
    a11y?.labelProp,
  );
  // Vue's v-bind="attrs" emits these as literal attributes on the rendered
  // element — same role as the consumer-spread + lock pattern on the React
  // side. Vue's attribute fallthrough places `v-bind` entries AFTER static
  // template attrs by precedence, so consumer overrides are also rejected.
  const htmlAttrs = spec.kind === "atomic" ? (spec.htmlAttrs ?? {}) : {};
  const htmlAttrEntries = Object.entries(htmlAttrs)
    .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
    .join("\n");
  const attrEntries = [
    htmlAttrEntries || null,
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
  const branches = spec.kind === "atomic" ? spec.branches : undefined;
  const innerBody = isVoid
    ? ""
    : branches !== undefined
      ? renderVueBranches(branches, "    ")
      : renderBody(spec, slots, hasLoading);
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
        const refAttrMixed = hasImperativeProps ? ` ref="rootRef"` : "";
        const opener = (closing: "self" | "open") =>
          isExpr
            ? `<component :is="${isExpr}" class="${rootClass}" v-bind="attrs"${refAttrMixed}${closing === "self" ? " />" : ">"}`
            : `<${componentTag} class="${rootClass}" v-bind="attrs"${refAttrMixed}${closing === "self" ? " />" : ">"}`;
        const closer = isExpr ? `</component>` : `</${componentTag}>`;
        const voidLine = `  <template v-if="isVoidResolved">\n    ${opener("self")}\n  </template>`;
        const nonVoidLine = `  <template v-else>\n    ${opener("open")}\n${bodyBlock}\n    ${closer}\n  </template>`;
        return `${voidLine}\n${nonVoidLine}`;
      })()
    : null;

  const refAttr = hasImperativeProps ? ` ref="rootRef"` : "";
  const rootOpen = isVoid
    ? isExpr
      ? `<component :is="${isExpr}" class="${rootClass}" v-bind="attrs"${refAttr} />`
      : `<${componentTag} class="${rootClass}" v-bind="attrs"${refAttr} />`
    : isExpr
      ? `<component :is="${isExpr}" class="${rootClass}" v-bind="attrs"${refAttr}>`
      : `<${componentTag} class="${rootClass}" v-bind="attrs"${refAttr}>`;
  const rootClose = isVoid ? "" : isExpr ? `</component>` : `</${componentTag}>`;

  const stateEntries = spec.kind === "atomic" ? Object.entries(spec.latch ?? {}) : [];
  const hasState = stateEntries.length > 0;
  const branchComputes = Array.from(resolved.branchComputes);
  const vueValueImports = [
    "computed",
    hasImperativeProps ? "useTemplateRef" : null,
    hasImperativeProps ? "watch" : null,
    hasState ? "ref" : null,
  ].filter((l): l is string => l !== null);
  const runtimeImports = [
    responsiveProps.length > 0 ? "type Responsive" : null,
    responsiveProps.length > 0 ? "responsiveDataAttrs" : null,
    ...branchComputes,
  ].filter((l): l is string => l !== null);
  const imports = [
    `import "@teseor/css/components/${spec.name}.css";`,
    `import { ${vueValueImports.join(", ")}, type VNode } from "vue";`,
    runtimeImports.length > 0
      ? `import { ${runtimeImports.join(", ")} } from "./_runtime.ts";`
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
