import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { loadVocabulary } from "../lib/vocabulary.ts";
import type { GeneratorContext, GeneratorReport } from "../registry.ts";
import { registerGenerator } from "../registry.ts";
import type { Spec, SpecProp } from "./gen-contract.ts";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const SPECS_DIR = resolve(REPO_ROOT, "specs");
const VUE_SRC_DIR = resolve(REPO_ROOT, "packages", "vue", "src");
const BREAKPOINTS_PATH = resolve(SPECS_DIR, "_breakpoints.yaml");

const RESPONSIVE_ENUM_PROPS = new Set(["size"]);

type BreakpointsConfig = { breakpoints: string[] };

let cachedBreakpoints: string[] | null = null;
async function loadBreakpoints(): Promise<string[]> {
  if (cachedBreakpoints) return cachedBreakpoints;
  const raw = await readFile(BREAKPOINTS_PATH, "utf8");
  const parsed = parseYaml(raw) as BreakpointsConfig;
  cachedBreakpoints = parsed.breakpoints;
  return cachedBreakpoints;
}

function pascalCase(name: string): string {
  return name
    .split(/[-_\s]+/)
    .map((part) => (part.length === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join("");
}

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
  if (propName === "as") return "string";
  if (propDef.slot === true) return "never";
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
    hasLoading ? `    <span data-${spec.name}-spinner="" aria-hidden="true" />` : null,
  ]
    .filter((l): l is string => l !== null)
    .join("\n");
}

function renderCssShim(): string {
  return `// AUTOGENERATED by gen-vue. Do not edit.

declare module "*.css";
`;
}

function renderRuntime(breakpoints: string[]): string {
  const keys = ["base", ...breakpoints].map(quote).join(", ");
  return `// AUTOGENERATED by gen-vue. Do not edit.

const RESPONSIVE_KEYS = [${keys}] as const;

type Breakpoint = (typeof RESPONSIVE_KEYS)[number];

export type Responsive<T> = T | Partial<Record<Breakpoint, T>>;

export function responsiveDataAttrs(
  name: string,
  value: unknown,
): Record<string, string | undefined> {
  if (value == null || value === false) return {};
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const out: Record<string, string | undefined> = {};
    for (const key of RESPONSIVE_KEYS) {
      const v = obj[key];
      if (v == null || v === false) continue;
      const attr = key === "base" ? \`data-\${name}\` : \`data-\${name}-\${key}\`;
      out[attr] = v === true ? "true" : String(v);
    }
    return out;
  }
  return { [\`data-\${name}\`]: value === true ? "true" : String(value) };
}
`;
}

function renderWrapper(spec: Spec, propDescriptions: Record<string, string>): string {
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
  const parsed = parseYaml(raw) as Spec;
  if (parsed.name !== name) {
    throw new Error(`spec name "${parsed.name}" in ${name}.yaml does not match file basename`);
  }
  return parsed;
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

async function emitRuntime(breakpoints: string[]): Promise<string> {
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
