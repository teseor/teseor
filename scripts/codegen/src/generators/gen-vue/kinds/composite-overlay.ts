import { extractCompositeShape } from "../../../lib/composite-shape.ts";
import { renderEnumType } from "../../../lib/enum-primitives.ts";
import { pascalCase } from "../../../lib/pascal-case.ts";
import type { Spec } from "../../gen-contract.ts";
import { quote, responsiveType, vuePropType } from "../_shared/type-printer.ts";

/**
 * Emit a Vue SFC for a composite spec — the overlay-with-anchor shape:
 * one `fromChildren` part (rendered as a `<span>` wrapper around the default
 * slot) and one rendered part bound by `overlay:` + `interactions:`. The
 * runtime composable `useOverlay` (in `composables/useOverlay.ts`) drives behavior; the
 * emitted SFC does the template-shape work.
 */
export function renderCompositeOverlayVueWrapper(
  spec: Spec,
  _propDescriptions: Record<string, string>,
): string {
  const Name = pascalCase(spec.name);
  // `overlaySpec` (not `overlay`) so the generator-side reference doesn't
  // shadow the emitted runtime variable `const overlay = useOverlay(...)`.
  const { overlaySpec, triggerClass, contentClass, contentElement, contentRole } =
    extractCompositeShape(spec, {
      emitterLabel: "Vue composite emitter only supports the overlay-with-anchor shape",
      separateMissingPartErrors: false,
      forbidContentFromChildren: false,
    });
  const interactions = spec.interactions ?? [];

  const controllableEntry = Object.entries(spec.props).find(
    ([, d]) => d.pattern === "controllable" && d.type === "boolean",
  );
  if (!controllableEntry) {
    throw new Error(
      `composite spec '${spec.name}' must declare a 'pattern: controllable' boolean prop (e.g. 'open')`,
    );
  }
  const [controllableName] = controllableEntry;
  const ControllableName = pascalCase(controllableName);

  const contentSlots = Object.entries(spec.props)
    .filter(([, d]) => d.slot === true && d.__part === overlaySpec.floating)
    .map(([n]) => n);

  const responsiveProps = Object.entries(spec.props)
    .filter(([, d]) => d.responsive === true && d.slot !== true)
    .map(([n]) => n);

  // Enum types declared on props (e.g. TooltipPlacement).
  const propEnumTypes = Object.entries(spec.props)
    .filter(([, d]) => Array.isArray(d.values) && d.values.length > 0)
    .map(([propName, d]) => renderEnumType(Name, pascalCase(propName), d.values ?? []))
    .filter(Boolean)
    .join("\n");

  // Props type. Controllable boolean expands to a triple.
  const propTypeLines: string[] = [];
  for (const [propName, propDef] of Object.entries(spec.props)) {
    if (propDef.pattern === "controllable" && propDef.type === "boolean") {
      const PName = pascalCase(propName);
      if (propDef.description) propTypeLines.push(`  /** ${propDef.description} */`);
      propTypeLines.push(`  ${propName}?: boolean;`);
      propTypeLines.push(`  /** Initial open state (uncontrolled). */`);
      propTypeLines.push(`  default${PName}?: boolean;`);
      propTypeLines.push(`  /** Fires when the open state changes. */`);
      propTypeLines.push(`  on${PName}Change?: (${propName}: boolean) => void;`);
      continue;
    }
    const baseType = vuePropType(propName, propDef, Name);
    const tsType = propDef.responsive === true ? responsiveType(baseType) : baseType;
    if (propDef.description) propTypeLines.push(`  /** ${propDef.description} */`);
    propTypeLines.push(`  ${propName}?: ${tsType};`);
  }
  // `asChild` opt-in: render the trigger via Slot (cloneVNode merge) instead
  // of the default `<span>` wrapper. Single-child invariant — slot must
  // contain a single root VNode.
  propTypeLines.push(
    `  /** Render the trigger directly on the consumer's child element via Slot (cloneVNode) instead of wrapping in a \`<span>\`. */`,
  );
  propTypeLines.push(`  asChild?: boolean;`);

  // Destructure: controllable triple goes into the hook config; other props
  // bind to defaults from spec.default where the type is number.
  const destructureLines: string[] = [];
  destructureLines.push(`  ${controllableName}: ${controllableName}Prop,`);
  destructureLines.push(`  default${ControllableName},`);
  destructureLines.push(`  on${ControllableName}Change,`);
  for (const [propName, propDef] of Object.entries(spec.props)) {
    if (propDef.pattern === "controllable") continue;
    const defaultClause = typeof propDef.default === "number" ? ` = ${propDef.default}` : "";
    destructureLines.push(`  ${propName}${defaultClause},`);
  }
  destructureLines.push(`  asChild,`);

  // Interactions in hook config. Delay props pass as getters (\`() => name\`)
  // so the composable picks up later prop changes — Vue's setup runs once
  // and a plain \`delayMs: openDelay\` would capture the value at that time.
  const interactionItems = interactions.map((rule) => {
    const onEntries: string[] = [`event: ${quote(rule.on.event)}`];
    if (rule.on.target) onEntries.push(`target: ${quote(rule.on.target)}`);
    if (rule.on.key) onEntries.push(`key: ${quote(rule.on.key)}`);
    const fields: string[] = [`on: { ${onEntries.join(", ")} }`, `do: ${quote(rule.do)}`];
    if (rule.delay) fields.push(`delayMs: () => ${rule.delay}`);
    if (rule.when) fields.push(`when: ${quote(rule.when)}`);
    return `    { ${fields.join(", ")} },`;
  });

  // Vue's useOverlay isn't generic over the floating element type — the
  // template-ref machinery does the runtime DOM assignment and any consumer
  // narrowing happens at use-sites, not in the hook signature.

  // Responsive data-attrs merged into a single computed object so the
  // template can spread them via one `v-bind=`. Multiple v-bind="…" calls
  // overwrite each other; the computed-object spread composes cleanly.
  const contentDataAttrComputed =
    responsiveProps.length > 0
      ? `const contentAttrs = computed(() => ({\n${responsiveProps
          .map((name) => `  ...responsiveDataAttrs(${quote(name)}, ${name}),`)
          .join("\n")}\n}));`
      : "";
  const contentDataAttrBinding = responsiveProps.length > 0 ? ` v-bind="contentAttrs"` : "";

  // Slot rendering inside the floating element — for Tooltip, just \`{{ text }}\`.
  const contentBodyLines =
    contentSlots.length > 0
      ? contentSlots.map((s) => `    {{ ${s} }}`).join("\n")
      : "    <!-- no content slot declared -->";

  const roleAttr = contentRole ? `role="${contentRole}"` : "";
  // ARIA dialogs need an accessible name. Bind it to the first content slot
  // prop (Modal: `title`) so the screen-reader announcement matches the body.
  // Other roles name themselves via `aria-describedby` on the trigger.
  const ariaLabelAttr =
    contentRole === "dialog" && contentSlots[0] ? `:aria-label="${contentSlots[0]}"` : "";
  // Modal dialogs add `aria-modal="true"` so assistive tech treats them as modal.
  const ariaModalAttr = overlaySpec.modal && contentRole === "dialog" ? `aria-modal="true"` : "";

  // `v-if`-gated render: the popover element only mounts when its content slot
  // resolves to a value. With no slot declared the popover renders never —
  // matches the React side's `hasContent && <…>` branch.
  const hasContentExpr = contentSlots[0] ? `${contentSlots[0]} != null` : "false";
  // Modal triggers skip `aria-describedby` — the dialog isn't a description of
  // the trigger; that relationship is for tooltips.
  const triggerAriaDescribedBy = overlaySpec.modal
    ? ""
    : `:aria-describedby="${hasContentExpr} ? overlay.popoverId : undefined"`;

  const needsComputed = responsiveProps.length > 0;
  const runtimeImports = [
    responsiveProps.length > 0 ? "type Responsive" : null,
    responsiveProps.length > 0 ? "responsiveDataAttrs" : null,
  ]
    .filter((s): s is string => s !== null)
    .join(", ");
  const importsLines = [
    `import "@teseor/css/components/${spec.name}.css";`,
    needsComputed ? `import { computed } from "vue";` : null,
    runtimeImports ? `import { ${runtimeImports} } from "./_runtime.ts";` : null,
    `import { Slot } from "./components/Slot.ts";`,
    `import { useOverlay } from "./composables/useOverlay.ts";`,
  ]
    .filter((l): l is string => l !== null)
    .join("\n");

  return `<!-- AUTOGENERATED by gen-vue. Do not edit. -->
<!-- Source: specs/${spec.name}.yaml -->
<script setup lang="ts">
/**
 * ${spec.description ?? ""}
 */
${importsLines}

${propEnumTypes ? `${propEnumTypes}\n` : ""}type ${Name}Props = {
${propTypeLines.join("\n")}
};

const {
${destructureLines.join("\n")}
} = defineProps<${Name}Props>();

const overlay = useOverlay({
  // Reactive getters so the composable re-reads each prop on every render
  // instead of capturing its setup-time value (Vue's setup runs once).
  open: () => ${controllableName}Prop,
  default${ControllableName},
  on${ControllableName}Change,${
    Object.hasOwn(spec.props, "disabled") ? `\n  disabled: () => disabled,` : ""
  }
  anchorVar: ${quote(overlaySpec.anchorVar)},
  popoverMode: ${quote(overlaySpec.mode)},${overlaySpec.modal ? `\n  modal: true,` : ""}
  interactions: [
${interactionItems.join("\n")}
  ],
});

const contentRef = overlay.contentRef;
// Exposed so consumers read the popover DOM via parent ref → \`inst.contentRef.value\`.
defineExpose({ contentRef });
${contentDataAttrComputed}
</script>

<template>
  <Slot
    v-if="asChild"
    :style="{ [overlay.anchorVar]: overlay.anchorName, anchorName: overlay.anchorName }"
    :data-state="overlay.state.value"${triggerAriaDescribedBy ? `\n    ${triggerAriaDescribedBy}` : ""}
    v-on="overlay.triggerHandlers"
  >
    <slot />
  </Slot>
  <span
    v-else
    class="${triggerClass}"
    :style="{ [overlay.anchorVar]: overlay.anchorName }"
    :data-state="overlay.state.value"${triggerAriaDescribedBy ? `\n    ${triggerAriaDescribedBy}` : ""}
    v-on="overlay.triggerHandlers"
  >
    <slot />
  </span>
  ${overlaySpec.modal ? `<Teleport to="body">\n  ` : ""}<${contentElement}
    v-if="${hasContentExpr}"
    ref="contentRef"
    :id="overlay.popoverId"
    ${roleAttr}${ariaLabelAttr ? `\n    ${ariaLabelAttr}` : ""}${ariaModalAttr ? `\n    ${ariaModalAttr}` : ""}
    class="${contentClass}"
    :popover="overlay.popoverMode"
    :data-state="overlay.state.value"
    :style="{ [overlay.anchorVar]: overlay.anchorName }"${contentDataAttrBinding}
  >
${contentBodyLines}
  </${contentElement}>${overlaySpec.modal ? `\n  </Teleport>` : ""}
</template>
`;
}
