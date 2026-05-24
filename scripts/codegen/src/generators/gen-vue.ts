import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { type Breakpoint, loadBreakpoints } from "../lib/breakpoints.ts";
import { flattenSpec } from "../lib/flatten.ts";
import { pascalCase } from "../lib/pascal-case.ts";
import { loadVocabulary } from "../lib/vocabulary.ts";
import type { GeneratorContext, GeneratorReport } from "../registry.ts";
import { registerGenerator } from "../registry.ts";
import { Spec as SpecSchema } from "../schema.ts";
import type { Spec, SpecProp } from "./gen-contract.ts";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const SPECS_DIR = resolve(REPO_ROOT, "specs");
const VUE_SRC_DIR = resolve(REPO_ROOT, "packages", "vue", "src");

const RESPONSIVE_ENUM_PROPS = new Set(["size"]);

function quote(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function mapPropType(specType: string): string {
  switch (specType) {
    case "boolean":
      return "boolean";
    case "string":
      return "string";
    case "number":
      return "number";
    default:
      return "unknown";
  }
}

function responsiveType(baseType: string): string {
  return `Responsive<${baseType}>`;
}

function vuePropType(propName: string, propDef: SpecProp, Name: string): string {
  // Atomic slots flow via `<slot name="…" />` (prop unsettable → `never`).
  // Composite-part slots are inline scalars — keep the declared type.
  if (propDef.slot === true) return !propDef.__part ? "never" : mapPropType(propDef.type);
  if (propDef.values && propDef.values.length > 0) return `${Name}${pascalCase(propName)}`;
  return mapPropType(propDef.type);
}

type SlotInfo = { propName: string; part: string; position?: "start" | "end" };

function parseSlot(propName: string): SlotInfo {
  if (propName.endsWith("Start")) {
    return { propName, part: propName.slice(0, -"Start".length).toLowerCase(), position: "start" };
  }
  if (propName.endsWith("End")) {
    return { propName, part: propName.slice(0, -"End".length).toLowerCase(), position: "end" };
  }
  return { propName, part: propName.toLowerCase() };
}

function collectSlots(spec: Spec): SlotInfo[] {
  if (!spec.props) return [];
  return Object.entries(spec.props)
    .filter(([, def]) => def.slot === true)
    .map(([name]) => parseSlot(name));
}

function renderEnumType(Name: string, kind: string, values: string[]): string {
  if (values.length === 0) return "";
  return `type ${Name}${kind} = ${values.map(quote).join(" | ")};\n`;
}

function renderCanonicalProp(
  name: string,
  tsType: string,
  descriptions: Record<string, string>,
): string[] {
  const desc = descriptions[name];
  return [desc ? `  /** ${desc} */` : null, `  ${name}?: ${tsType};`].filter(
    (l): l is string => l !== null,
  );
}

function renderPropsType(
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
  return [
    `type ${Name}Props = {`,
    ...variantLines,
    ...intentLines,
    ...sizeLines,
    ...lines,
    `};`,
  ].join("\n");
}

function renderExampleProps(props: Record<string, unknown> | undefined): string {
  if (!props || Object.keys(props).length === 0) return "";
  return Object.entries(props)
    .map(([k, v]) => {
      if (typeof v === "string") return ` ${k}=${quote(v)}`;
      if (typeof v === "boolean" && v === true) return ` ${k}`;
      return ` :${k}="${JSON.stringify(v)}"`;
    })
    .join("");
}

function titleCase(id: string): string {
  return id
    .split(/[-_]/)
    .map((p) => (p.length > 0 ? p.charAt(0).toUpperCase() + p.slice(1) : p))
    .join(" ");
}

function renderExampleBlock(
  example: { id?: string; props?: Record<string, unknown> },
  Name: string,
): string[] {
  const propString = renderExampleProps(example.props);
  const title = example.id ? ` ${titleCase(example.id)}` : "";
  return [
    ` * @example${title}`,
    ` * \`\`\`vue`,
    ` * <${Name}${propString}>Label</${Name}>`,
    ` * \`\`\``,
  ];
}

function renderComponentJsDoc(spec: Spec, Name: string): string {
  const description = spec.description ?? "";
  const examples = (spec.examples ?? []).slice(0, 3);
  const lines: string[] = ["/**"];
  if (description) lines.push(` * ${description}`);
  for (let i = 0; i < examples.length; i++) {
    const example = examples[i];
    if (!example) continue;
    if (i === 0 && description) lines.push(` *`);
    if (i > 0) lines.push(` *`);
    lines.push(...renderExampleBlock(example, Name));
  }
  lines.push(" */");
  return lines.join("\n");
}

function renderPropsBlock(spec: Spec, Name: string): string {
  const nonSlotProps = Object.entries(spec.props ?? {}).filter(([, def]) => def.slot !== true);
  const enumPropNames: string[] = [];
  if (spec.variants) enumPropNames.push("variant");
  if (spec.intents) enumPropNames.push("intent");
  if (spec.sizes) enumPropNames.push("size");
  if (enumPropNames.length === 0 && nonSlotProps.length === 0) {
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
  ];
  return `const {
${lines.join("\n")}
} = defineProps<${Name}Props>();`;
}

function renderSlotsType(slots: SlotInfo[]): string {
  const slotLines = slots.map((s) => `  ${s.propName}?(): VNode[];`);
  return [`defineSlots<{`, `  default?(): VNode[];`, ...slotLines, `}>();`].join("\n");
}

function renderAttrEntries(
  spec: Spec,
  responsiveProps: string[],
  hasLoading: boolean,
  hasDisabled: boolean,
  hasAs: boolean,
): string {
  return [
    spec.variants ? `  "data-variant": variant,` : null,
    spec.intents ? `  "data-intent": intent,` : null,
    ...responsiveProps.map((name) => `  ...responsiveDataAttrs(${quote(name)}, ${name}),`),
    hasLoading ? `  "data-loading": loading ? "true" : undefined,` : null,
    hasDisabled && hasAs ? `  disabled: isButton.value ? inactive.value : undefined,` : null,
    hasDisabled && hasAs
      ? `  "aria-disabled": !isButton.value && inactive.value ? "true" : undefined,`
      : null,
    hasDisabled && !hasAs ? `  disabled: inactive.value,` : null,
    hasLoading ? `  "aria-busy": loading ? "true" : undefined,` : null,
  ]
    .filter((l): l is string => l !== null)
    .join("\n");
}

function renderSlot(spec: Spec, slot: SlotInfo): string {
  const posAttr = slot.position ? ` data-position="${slot.position}"` : "";
  return `    <span v-if="$slots.${slot.propName}" data-${spec.name}-${slot.part}=""${posAttr}>
      <slot name="${slot.propName}" />
    </span>`;
}

function renderBody(spec: Spec, slots: SlotInfo[], hasLoading: boolean): string {
  return [
    ...slots.filter((s) => s.position === "start").map((s) => renderSlot(spec, s)),
    ...slots.filter((s) => s.position === undefined).map((s) => renderSlot(spec, s)),
    hasLoading ? `    <span data-${spec.name}-label=""><slot /></span>` : `    <slot />`,
    ...slots.filter((s) => s.position === "end").map((s) => renderSlot(spec, s)),
    hasLoading
      ? `    <span v-if="loading" data-${spec.name}-spinner="" aria-hidden="true" />`
      : null,
  ]
    .filter((l): l is string => l !== null)
    .join("\n");
}

function renderCssShim(): string {
  return `// AUTOGENERATED by gen-vue. Do not edit.

declare module "*.css";
`;
}

function renderRuntime(breakpoints: Breakpoint[]): string {
  const names = breakpoints.map((b) => b.name);
  const keys = ["base", ...names].map(quote).join(", ");
  // Biome strips quotes from valid-identifier object keys; mirror that.
  const objKey = (k: string): string => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : quote(k));
  const queryEntries = breakpoints
    .map((b) => `  ${objKey(b.name)}: ${quote(`(min-width: ${b.minWidth})`)},`)
    .join("\n");
  return `// AUTOGENERATED by gen-vue. Do not edit.

import { onBeforeUnmount, onMounted, type Ref, ref } from "vue";

const RESPONSIVE_KEYS = [${keys}] as const;

type Breakpoint = (typeof RESPONSIVE_KEYS)[number];

export type Responsive<T> = T | Partial<Record<Breakpoint, T>>;

// matchMedia queries baked from specs/_breakpoints.yaml. Single source.
const BREAKPOINT_QUERIES: Partial<Record<Breakpoint, string>> = {
${queryEntries}
};

function readActiveBreakpoint(): Breakpoint {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "base";
  for (let i = RESPONSIVE_KEYS.length - 1; i > 0; i--) {
    const key = RESPONSIVE_KEYS[i];
    if (!key) continue;
    const q = BREAKPOINT_QUERIES[key];
    if (q && window.matchMedia(q).matches) return key;
  }
  return "base";
}

/** Reactive active-breakpoint key. Drives \`Responsive<T>\` runtime behavior. */
export function useActiveBreakpoint(): Readonly<Ref<Breakpoint>> {
  const active = ref<Breakpoint>(readActiveBreakpoint());
  const cleanups: Array<() => void> = [];
  onMounted(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const onChange = () => {
      active.value = readActiveBreakpoint();
    };
    for (const key of RESPONSIVE_KEYS) {
      if (key === "base") continue;
      const q = BREAKPOINT_QUERIES[key];
      if (!q) continue;
      const mql = window.matchMedia(q);
      mql.addEventListener("change", onChange);
      cleanups.push(() => mql.removeEventListener("change", onChange));
    }
  });
  onBeforeUnmount(() => {
    for (const fn of cleanups) fn();
  });
  return active;
}

/** Resolve a \`Responsive<boolean>\` at the active breakpoint (mobile-first cascade). */
export function isActiveAt(value: unknown, bp: Breakpoint): boolean {
  if (value === true) return true;
  if (value == null || value === false) return false;
  if (typeof value !== "object") return false;
  const obj = value as Partial<Record<Breakpoint, boolean>>;
  const idx = RESPONSIVE_KEYS.indexOf(bp);
  for (let i = idx; i >= 0; i--) {
    const key = RESPONSIVE_KEYS[i];
    if (key && key in obj) return obj[key] === true;
  }
  return false;
}

/** Resolve a \`Responsive<T>\` at the active breakpoint (mobile-first cascade). */
export function resolveResponsive<T>(
  value: Responsive<T> | undefined,
  bp: Breakpoint,
): T | undefined {
  if (value == null) return undefined;
  if (typeof value !== "object" || Array.isArray(value)) return value as T;
  const obj = value as Partial<Record<Breakpoint, T>>;
  const idx = RESPONSIVE_KEYS.indexOf(bp);
  for (let i = idx; i >= 0; i--) {
    const key = RESPONSIVE_KEYS[i];
    if (key && key in obj) return obj[key];
  }
  return undefined;
}

export function responsiveDataAttrs(
  name: string,
  value: unknown,
): Record<string, string | undefined> {
  if (value == null || value === false) return {};
  if (typeof value === "object") {
    // Emit every declared key (including \`false\` at non-base) — the CSS
    // override pattern needs the explicit attribute to match against.
    const obj = value as Record<string, unknown>;
    const out: Record<string, string | undefined> = {};
    for (const key of RESPONSIVE_KEYS) {
      const v = obj[key];
      if (v == null) continue;
      // \`base: false\` has no attribute (absence-of) — emitting "false" would never match.
      if (key === "base" && v === false) continue;
      const attr = key === "base" ? \`data-\${name}\` : \`data-\${name}-\${key}\`;
      out[attr] = v === true ? "true" : v === false ? "false" : String(v);
    }
    return out;
  }
  return { [\`data-\${name}\`]: value === true ? "true" : String(value) };
}
`;
}

// ── Composite wrapper renderer ──────────────────────────────────────────────

/**
 * Emits a Vue SFC for a composite spec — the overlay-with-anchor shape:
 * one `fromChildren` part (rendered as a `<span>` wrapper around the default
 * slot) and one rendered part bound by `overlay:` + `interactions:`. The
 * runtime composable `useOverlay` (in `composables/useOverlay.ts`) drives behavior; the
 * emitted SFC does the template-shape work.
 */
function renderCompositeWrapper(spec: Spec, _propDescriptions: Record<string, string>): string {
  const Name = pascalCase(spec.name);
  // `overlaySpec` (not `overlay`) so the generator-side reference doesn't
  // shadow the emitted runtime variable `const overlay = useOverlay(...)`.
  const overlaySpec = spec.overlay;
  const interactions = spec.interactions ?? [];
  const parts = spec.parts ?? {};
  if (!overlaySpec) {
    throw new Error(
      `composite spec '${spec.name}' must declare 'overlay:' for the overlay-with-anchor shape`,
    );
  }
  const triggerPart = parts[overlaySpec.anchor];
  const contentPart = parts[overlaySpec.floating];
  if (!triggerPart || !contentPart) {
    throw new Error(
      `overlay.anchor '${overlaySpec.anchor}' or overlay.floating '${overlaySpec.floating}' is not a declared part`,
    );
  }
  if (triggerPart.fromChildren !== true) {
    throw new Error(
      `overlay.anchor '${overlaySpec.anchor}' must declare 'fromChildren: true' (Vue composite emitter only supports the overlay-with-anchor shape)`,
    );
  }

  const triggerClass = triggerPart.rootClass ?? `t-${spec.name}-trigger`;
  const contentClass = contentPart.rootClass ?? `t-${spec.name}`;
  const contentElement = contentPart.element ?? "div";
  const contentRole = contentPart.a11y?.role;

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

function renderAtomicWrapper(spec: Spec, propDescriptions: Record<string, string>): string {
  const Name = pascalCase(spec.name);
  const rootClass = spec.rootClass ?? `t-${spec.name}`;
  const propMap = spec.props ?? {};
  const hasAs = "as" in propMap;
  const hasDisabled = "disabled" in propMap;
  const hasLoading = "loading" in propMap;
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

  const componentTag = hasAs ? "component" : (spec.element ?? "div");

  const helperLines = [
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

  const bodyBlock = renderBody(spec, slots, hasLoading);
  const rootOpen = hasAs
    ? `<component :is="as" class="${rootClass}" v-bind="attrs">`
    : `<${componentTag} class="${rootClass}" v-bind="attrs">`;
  const rootClose = hasAs ? `</component>` : `</${componentTag}>`;

  const imports = [
    `import "@teseor/css/components/${spec.name}.css";`,
    `import { computed, type VNode } from "vue";`,
    responsiveProps.length > 0
      ? `import { type Responsive, responsiveDataAttrs } from "./_runtime.ts";`
      : null,
  ]
    .filter((l): l is string => l !== null)
    .join("\n");

  return `<!-- AUTOGENERATED by gen-vue. Do not edit. -->
<!-- Source: specs/${spec.name}.yaml -->
<script setup lang="ts">
${renderComponentJsDoc(spec, Name)}
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
  ${rootOpen}
${bodyBlock}
  ${rootClose}
</template>
`;
}

function renderWrapper(spec: Spec, propDescriptions: Record<string, string>): string {
  if (spec.kind === "composite") return renderCompositeWrapper(spec, propDescriptions);
  return renderAtomicWrapper(spec, propDescriptions);
}

function renderBarrel(names: string[]): string {
  const lines = ["// AUTOGENERATED by gen-vue. Do not edit.", ""];
  for (const name of names) {
    const Name = pascalCase(name);
    lines.push(`export { default as ${Name} } from "./${Name}.vue";`);
  }
  lines.push("");
  return lines.join("\n");
}

function renderReadme(specs: Spec[]): string {
  const componentList = specs
    .map((spec) => {
      const Name = pascalCase(spec.name);
      const desc = spec.description ?? "";
      return `- \`${Name}\` — ${desc}`;
    })
    .join("\n");

  const firstSpec = specs[0];
  const exampleName = firstSpec ? pascalCase(firstSpec.name) : "Button";

  return `<!-- AUTOGENERATED by gen-vue. Do not edit. -->

# @teseor/vue

Vue 3 wrappers for Teseor components. Generated from \`specs/*.yaml\`.

## Install

\`\`\`
pnpm add @teseor/vue @teseor/css vue
\`\`\`

## Setup

Import the CSS foundation once in your app entry. Components pull in their own per-component CSS automatically.

\`\`\`ts
import "@teseor/css/reset.css";
import "@teseor/css/tokens.css";
import "@teseor/css/base.css";
import "@teseor/css/utilities.css";
\`\`\`

## Usage

\`\`\`vue
<script setup lang="ts">
import { ${exampleName} } from "@teseor/vue";
</script>

<template>
  <${exampleName} variant="solid" intent="primary" @click="save">
    Save
  </${exampleName}>
</template>
\`\`\`

## Components

${componentList}

## Tests

Component behavior is verified framework-agnostically against the rendered DOM, in \`tests/<name>/\` (Playwright). The wrapper code itself is autogenerated; correctness of the emission is verified by snapshot tests in \`scripts/codegen/__tests__/\`.

## Generated content

Files in \`src/\` are autogenerated from \`specs/*.yaml\`. Do not edit them. The generator is \`scripts/codegen/src/generators/gen-vue.ts\`.
`;
}

async function loadSpec(name: string): Promise<Spec> {
  const path = resolve(SPECS_DIR, `${name}.yaml`);
  const raw = await readFile(path, "utf8");
  const parsed = parseYaml(raw);
  const result = SpecSchema.safeParse(parsed);
  if (!result.success) {
    const messages = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`spec ${name}.yaml failed schema validation:\n${messages}`);
  }
  if (result.data.name !== name) {
    throw new Error(`spec name "${result.data.name}" in ${name}.yaml does not match file basename`);
  }
  return flattenSpec(result.data);
}

async function listSpecNames(): Promise<string[]> {
  const entries = await readdir(SPECS_DIR);
  return entries
    .filter((f) => f.endsWith(".yaml") && !f.startsWith("_"))
    .map((f) => f.slice(0, -5))
    .sort();
}

async function emitWrapper(
  name: string,
  propDescriptions: Record<string, string>,
): Promise<string> {
  const spec = await loadSpec(name);
  const content = renderWrapper(spec, propDescriptions);
  const outPath = resolve(VUE_SRC_DIR, `${pascalCase(name)}.vue`);
  await mkdir(VUE_SRC_DIR, { recursive: true });
  await writeFile(outPath, content, "utf8");
  return outPath;
}

async function emitRuntime(breakpoints: Breakpoint[]): Promise<string> {
  const content = renderRuntime(breakpoints);
  const outPath = resolve(VUE_SRC_DIR, `_runtime.ts`);
  await mkdir(VUE_SRC_DIR, { recursive: true });
  await writeFile(outPath, content, "utf8");
  return outPath;
}

async function emitCssShim(): Promise<string> {
  const content = renderCssShim();
  const outPath = resolve(VUE_SRC_DIR, `_css.d.ts`);
  await mkdir(VUE_SRC_DIR, { recursive: true });
  await writeFile(outPath, content, "utf8");
  return outPath;
}

async function emitBarrel(names: string[]): Promise<string> {
  const content = renderBarrel(names);
  const outPath = resolve(VUE_SRC_DIR, `index.ts`);
  await mkdir(VUE_SRC_DIR, { recursive: true });
  await writeFile(outPath, content, "utf8");
  return outPath;
}

async function emitReadme(specs: Spec[]): Promise<string> {
  const content = renderReadme(specs);
  const outPath = resolve(REPO_ROOT, "packages", "vue", "README.md");
  await writeFile(outPath, content, "utf8");
  return outPath;
}

async function vueGenerator(ctx: GeneratorContext): Promise<GeneratorReport> {
  const requested = ctx.positionals[0];
  const allNames = await listSpecNames();
  const targets = requested ? [requested] : allNames;
  const breakpoints = await loadBreakpoints();
  const vocabulary = await loadVocabulary();
  const propDescriptions = vocabulary.propDescriptions ?? {};

  const filesWritten: string[] = [];
  const notes: string[] = [];
  for (const name of targets) {
    const path = await emitWrapper(name, propDescriptions);
    filesWritten.push(path);
    notes.push(`vue: ${name} -> ${path.replace(`${REPO_ROOT}/`, "")}`);
  }

  const runtimePath = await emitRuntime(breakpoints);
  filesWritten.push(runtimePath);
  notes.push(`vue: runtime -> ${runtimePath.replace(`${REPO_ROOT}/`, "")}`);

  const cssShimPath = await emitCssShim();
  filesWritten.push(cssShimPath);
  notes.push(`vue: css-shim -> ${cssShimPath.replace(`${REPO_ROOT}/`, "")}`);

  const barrelPath = await emitBarrel(allNames);
  filesWritten.push(barrelPath);
  notes.push(`vue: barrel -> ${barrelPath.replace(`${REPO_ROOT}/`, "")}`);

  const allSpecs = await Promise.all(allNames.map(loadSpec));
  const readmePath = await emitReadme(allSpecs);
  filesWritten.push(readmePath);
  notes.push(`vue: readme -> ${readmePath.replace(`${REPO_ROOT}/`, "")}`);

  return { filesWritten, notes };
}

registerGenerator("vue", vueGenerator);

export { renderBarrel, renderCssShim, renderReadme, renderRuntime, renderWrapper };
