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
const REACT_SRC_DIR = resolve(REPO_ROOT, "packages", "react", "src");
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

function responsiveType(baseType: string, breakpoints: string[]): string {
  const keys = ["base", ...breakpoints].map(quote).join(" | ");
  return `${baseType} | Partial<Record<${keys}, ${baseType}>>`;
}

function reactPropType(propName: string, propDef: SpecProp): string {
  if (propName === "as") return "ElementType";
  if (propDef.slot === true) return "ReactNode";
  return mapPropType(propDef.type);
}

function renderEnumType(
  Name: string,
  kind: "Variant" | "Intent" | "Size",
  values: string[],
): string {
  if (values.length === 0) return "";
  return `type ${Name}${kind} = ${values.map(quote).join(" | ")};\n`;
}

function renderPropLine(
  propName: string,
  propDef: SpecProp,
  breakpoints: string[],
  propDescriptions: Record<string, string>,
): string[] {
  const baseType = reactPropType(propName, propDef);
  const tsType = propDef.responsive === true ? responsiveType(baseType, breakpoints) : baseType;
  const desc = propDef.description ?? propDescriptions[propName];
  return [desc ? `  /** ${desc} */` : null, `  ${propName}?: ${tsType};`].filter(
    (l): l is string => l !== null,
  );
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

function renderOwnProps(
  spec: Spec,
  Name: string,
  sizeIsResponsive: boolean,
  breakpoints: string[],
  propDescriptions: Record<string, string>,
): string {
  const sizeType = sizeIsResponsive ? responsiveType(`${Name}Size`, breakpoints) : `${Name}Size`;
  const propLines = Object.entries(spec.props ?? {}).flatMap(([n, d]) =>
    renderPropLine(n, d, breakpoints, propDescriptions),
  );
  const variantLines = spec.variants
    ? renderCanonicalProp("variant", `${Name}Variant`, propDescriptions)
    : [];
  const intentLines = spec.intents
    ? renderCanonicalProp("intent", `${Name}Intent`, propDescriptions)
    : [];
  const sizeLines = spec.sizes ? renderCanonicalProp("size", sizeType, propDescriptions) : [];
  const hasAs = "as" in (spec.props ?? {});
  const refType = hasAs
    ? "Ref<HTMLElement>"
    : `Ref<HTMLElementTagNameMap[${quote(spec.element ?? "div")}]>`;
  return [
    `type ${Name}OwnProps = {`,
    ...variantLines,
    ...intentLines,
    ...sizeLines,
    ...propLines,
    `  children?: ReactNode;`,
    `  ref?: ${refType};`,
    `};`,
  ].join("\n");
}

const LINE_WIDTH = 100;

function renderDestructure(spec: Spec): string {
  const names = [
    spec.variants ? "variant" : null,
    spec.intents ? "intent" : null,
    spec.sizes ? "size" : null,
    ...Object.keys(spec.props ?? {}),
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

function renderPropsTypeIntersection(Name: string, element: string): string {
  const oneLine = `export type ${Name}Props = Readonly<${Name}OwnProps & Omit<ComponentProps<"${element}">, keyof ${Name}OwnProps>>;`;
  if (oneLine.length <= LINE_WIDTH) return oneLine;
  return [
    `export type ${Name}Props = Readonly<`,
    `  ${Name}OwnProps & Omit<ComponentProps<"${element}">, keyof ${Name}OwnProps>`,
    `>;`,
  ].join("\n");
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
  const slots: SlotInfo[] = [];
  if (!spec.props) return slots;
  for (const [propName, propDef] of Object.entries(spec.props)) {
    if (propDef.slot === true) slots.push(parseSlot(propName));
  }
  return slots;
}

function renderDataAttrs(spec: Spec, responsiveProps: string[], hasLoading: boolean): string {
  return [
    spec.variants ? `      data-variant={variant}` : null,
    spec.intents ? `      data-intent={intent}` : null,
    ...responsiveProps.map((name) => `      {...responsiveDataAttrs(${quote(name)}, ${name})}`),
    hasLoading ? `      data-loading={loading === true ? "true" : undefined}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

function renderStateAttrs(hasAs: boolean, hasDisabled: boolean, hasLoading: boolean): string {
  return [
    hasDisabled && hasAs ? `      disabled={isButton ? inactive : undefined}` : null,
    hasDisabled && hasAs
      ? `      aria-disabled={!isButton && inactive ? "true" : undefined}`
      : null,
    hasDisabled && !hasAs ? `      disabled={inactive}` : null,
    hasLoading ? `      aria-busy={loading === true ? "true" : undefined}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

function renderSlot(spec: Spec, slot: SlotInfo): string {
  const posAttr = slot.position ? ` data-position="${slot.position}"` : "";
  return `      {${slot.propName} != null ? (
        <span data-${spec.name}-${slot.part}=""${posAttr}>
          {${slot.propName}}
        </span>
      ) : null}`;
}

function renderBody(spec: Spec, slots: SlotInfo[], hasLoading: boolean): string {
  return [
    ...slots.filter((s) => s.position === "start").map((s) => renderSlot(spec, s)),
    ...slots.filter((s) => s.position === undefined).map((s) => renderSlot(spec, s)),
    hasLoading ? `      <span data-${spec.name}-label="">{children}</span>` : `      {children}`,
    ...slots.filter((s) => s.position === "end").map((s) => renderSlot(spec, s)),
    hasLoading ? `      <span data-${spec.name}-spinner="" aria-hidden="true" />` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

function renderExampleProps(props: Record<string, unknown> | undefined): string {
  if (!props || Object.keys(props).length === 0) return "";
  return Object.entries(props)
    .map(([k, v]) => {
      if (typeof v === "string") return ` ${k}=${quote(v)}`;
      if (typeof v === "boolean" && v === true) return ` ${k}`;
      return ` ${k}={${JSON.stringify(v)}}`;
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
    ` * \`\`\`tsx`,
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
  return `${lines.join("\n")}\n`;
}

function renderWrapper(
  spec: Spec,
  breakpoints: string[],
  propDescriptions: Record<string, string>,
): string {
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

  const inactiveExpr = [
    hasDisabled ? "disabled === true" : null,
    hasLoading ? "loading === true" : null,
  ]
    .filter((p): p is string => p !== null)
    .join(" || ");

  const rootExpr = hasAs ? `as ?? ${quote(spec.element ?? "div")}` : quote(spec.element ?? "div");
  const componentTag = hasAs ? "Component" : (spec.element ?? "div");

  const helperBlock = [
    hasAs ? `  const Component = ${rootExpr};` : null,
    hasDisabled && hasAs ? `  const isButton = Component === "button";` : null,
    inactiveExpr ? `  const inactive = ${inactiveExpr};` : null,
    `  const mergedClassName = className ? \`${rootClass} \${className}\` : "${rootClass}";`,
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

  const typeBlock = [
    renderEnumType(Name, "Variant", Object.keys(spec.variants ?? {})),
    renderEnumType(Name, "Intent", Object.keys(spec.intents ?? {})),
    renderEnumType(Name, "Size", Object.keys(spec.sizes ?? {})),
  ]
    .filter(Boolean)
    .join("\n");

  const bodyBlock = renderBody(spec, slots, hasLoading);
  const typeBlockPrefix = typeBlock ? `${typeBlock}\n` : "";
  const propsTypeLine = renderPropsTypeIntersection(Name, spec.element ?? "div");

  return `"use client";

// AUTOGENERATED by gen-react. Do not edit.
// Source: specs/${spec.name}.yaml

import "@teseor/css/components/${spec.name}.css";
import type { ComponentProps${hasAs ? ", ElementType" : ""}, ReactNode, Ref } from "react";
import { responsiveDataAttrs } from "./_runtime.ts";

${typeBlockPrefix}${renderOwnProps(spec, Name, sizeIsResponsive, breakpoints, propDescriptions)}

${propsTypeLine}

${renderComponentJsDoc(spec, Name)}export function ${Name}(props: ${Name}Props) {
${renderDestructure(spec)}

${helperBlock}

  return (
    <${componentTag}
${attrBlock}
    >
${bodyBlock}
    </${componentTag}>
  );
}
`;
}

function renderCssShim(): string {
  return `// AUTOGENERATED by gen-react. Do not edit.

declare module "*.css";
`;
}

function renderRuntime(breakpoints: string[]): string {
  const keys = ["base", ...breakpoints].map(quote).join(", ");
  return `// AUTOGENERATED by gen-react. Do not edit.

const RESPONSIVE_KEYS = [${keys}] as const;

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

  return `<!-- AUTOGENERATED by gen-react. Do not edit. -->

# @teseor/react

React wrappers for Teseor components. Generated from \`specs/*.yaml\`.

## Install

\`\`\`
pnpm add @teseor/react @teseor/css react
\`\`\`

## Setup

Import the CSS foundation once in your app entry. Components pull in their own per-component CSS automatically.

\`\`\`tsx
import "@teseor/css/reset.css";
import "@teseor/css/tokens.css";
import "@teseor/css/base.css";
import "@teseor/css/utilities.css";
\`\`\`

## Usage

\`\`\`tsx
import { ${exampleName} } from "@teseor/react";

<${exampleName} variant="solid" intent="primary" onClick={save}>
  Save
</${exampleName}>
\`\`\`

## Components

${componentList}

## Tests

Component behavior is verified framework-agnostically against the rendered DOM, in \`tests/<name>/\` (Playwright). The wrapper code itself is autogenerated; correctness of the emission is verified by snapshot tests in \`scripts/codegen/__tests__/\`.

Per-framework unit tests are not used — the DOM is the contract, and the same behavior tests run against every wrapper.

## Generated content

Files in \`src/\` are autogenerated from \`specs/*.yaml\`. Do not edit them — your changes will be overwritten on the next \`pnpm gen\`. The generator is \`scripts/codegen/src/generators/gen-react.ts\`.
`;
}

function renderBarrel(names: string[]): string {
  const lines = ["// AUTOGENERATED by gen-react. Do not edit.", ""];
  for (const name of names) {
    const Name = pascalCase(name);
    lines.push(`export { ${Name}, type ${Name}Props } from "./${Name}.tsx";`);
  }
  lines.push("");
  return lines.join("\n");
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
  breakpoints: string[],
  propDescriptions: Record<string, string>,
): Promise<string> {
  const spec = await loadSpec(name);
  const content = renderWrapper(spec, breakpoints, propDescriptions);
  const outPath = resolve(REACT_SRC_DIR, `${pascalCase(name)}.tsx`);
  await mkdir(REACT_SRC_DIR, { recursive: true });
  await writeFile(outPath, content, "utf8");
  return outPath;
}

async function emitBarrel(names: string[]): Promise<string> {
  const content = renderBarrel(names);
  const outPath = resolve(REACT_SRC_DIR, `index.ts`);
  await mkdir(REACT_SRC_DIR, { recursive: true });
  await writeFile(outPath, content, "utf8");
  return outPath;
}

async function emitRuntime(breakpoints: string[]): Promise<string> {
  const content = renderRuntime(breakpoints);
  const outPath = resolve(REACT_SRC_DIR, `_runtime.ts`);
  await mkdir(REACT_SRC_DIR, { recursive: true });
  await writeFile(outPath, content, "utf8");
  return outPath;
}

async function emitCssShim(): Promise<string> {
  const content = renderCssShim();
  const outPath = resolve(REACT_SRC_DIR, `_css.d.ts`);
  await mkdir(REACT_SRC_DIR, { recursive: true });
  await writeFile(outPath, content, "utf8");
  return outPath;
}

async function emitReadme(specs: Spec[]): Promise<string> {
  const content = renderReadme(specs);
  const outPath = resolve(REPO_ROOT, "packages", "react", "README.md");
  await writeFile(outPath, content, "utf8");
  return outPath;
}

async function reactGenerator(ctx: GeneratorContext): Promise<GeneratorReport> {
  const requested = ctx.positionals[0];
  const allNames = await listSpecNames();
  const targets = requested ? [requested] : allNames;
  const breakpoints = await loadBreakpoints();
  const vocabulary = await loadVocabulary();
  const propDescriptions = vocabulary.propDescriptions ?? {};

  const filesWritten: string[] = [];
  const notes: string[] = [];
  for (const name of targets) {
    const path = await emitWrapper(name, breakpoints, propDescriptions);
    filesWritten.push(path);
    notes.push(`react: ${name} -> ${path.replace(`${REPO_ROOT}/`, "")}`);
  }

  const runtimePath = await emitRuntime(breakpoints);
  filesWritten.push(runtimePath);
  notes.push(`react: runtime -> ${runtimePath.replace(`${REPO_ROOT}/`, "")}`);

  const cssShimPath = await emitCssShim();
  filesWritten.push(cssShimPath);
  notes.push(`react: css-shim -> ${cssShimPath.replace(`${REPO_ROOT}/`, "")}`);

  const barrelPath = await emitBarrel(allNames);
  filesWritten.push(barrelPath);
  notes.push(`react: barrel -> ${barrelPath.replace(`${REPO_ROOT}/`, "")}`);

  const allSpecs = await Promise.all(allNames.map(loadSpec));
  const readmePath = await emitReadme(allSpecs);
  filesWritten.push(readmePath);
  notes.push(`react: readme -> ${readmePath.replace(`${REPO_ROOT}/`, "")}`);

  return { filesWritten, notes };
}

registerGenerator("react", reactGenerator);

export { renderBarrel, renderCssShim, renderReadme, renderRuntime, renderWrapper };
