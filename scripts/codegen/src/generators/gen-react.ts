import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { type Breakpoint, loadBreakpoints } from "../lib/breakpoints.ts";
import { flattenSpec } from "../lib/flatten.ts";
import {
  renderSharedPopoverDomHelpers,
  renderSharedResponsiveRuntimePrelude,
  renderSharedResponsiveRuntimeUtilities,
} from "../lib/runtime-shared.ts";
import { loadVocabulary } from "../lib/vocabulary.ts";
import type { GeneratorContext, GeneratorReport } from "../registry.ts";
import { registerGenerator } from "../registry.ts";
import { Spec as SpecSchema } from "../schema.ts";
import type { Spec, SpecProp } from "./gen-contract.ts";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const SPECS_DIR = resolve(REPO_ROOT, "specs");
const REACT_SRC_DIR = resolve(REPO_ROOT, "packages", "react", "src");

const RESPONSIVE_ENUM_PROPS = new Set(["size"]);

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

function reactPropType(propName: string, propDef: SpecProp, Name: string): string {
  // Atomic-root slots (Button's iconStart/iconEnd) accept renderable content
  // → ReactNode. Composite-part slots (Tooltip's text on the content part)
  // are scalar body content → use the declared type. The `__part` marker
  // (set by flattenSpec) is "" for atomic-root, the part name for composite.
  if (propDef.slot === true) {
    // `__part` is "" / undefined for atomic-root props, the part name for
    // composite. Tests that bypass flatten see `undefined`; treat both as
    // the atomic-root case.
    return !propDef.__part ? "ReactNode" : mapPropType(propDef.type);
  }
  if (propDef.values && propDef.values.length > 0) return `${Name}${pascalCase(propName)}`;
  return mapPropType(propDef.type);
}

function renderEnumType(Name: string, kind: string, values: string[]): string {
  if (values.length === 0) return "";
  return `type ${Name}${kind} = ${values.map(quote).join(" | ")};\n`;
}

function renderPropLine(
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
    hasLoading
      ? `      {loading ? <span data-${spec.name}-spinner="" aria-hidden="true" /> : null}`
      : null,
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

// ── Atomic wrapper renderer (existing) ──────────────────────────────────────

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

  const inactiveExpr = [
    hasDisabled ? "disabled === true" : null,
    hasLoading ? "loading === true" : null,
  ]
    .filter((p): p is string => p !== null)
    .join(" || ");

  const rootExpr = hasAs ? `as ?? ${quote(spec.element ?? "div")}` : quote(spec.element ?? "div");
  const componentTag = hasAs ? "Component" : (spec.element ?? "div");

  const helperBlock = [
    hasAs ? `  const Component = asElement(${rootExpr});` : null,
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
  const typeBlockPrefix = typeBlock ? `${typeBlock}\n` : "";
  const propsTypeLine = renderPropsTypeIntersection(Name, spec.element ?? "div");

  const imports = [
    `import "@teseor/css/components/${spec.name}.css";`,
    `import type { ComponentProps, ReactNode, Ref } from "react";`,
    hasAs && responsiveProps.length > 0
      ? `import { asElement, type Responsive, responsiveDataAttrs } from "./_runtime.ts";`
      : hasAs
        ? `import { asElement } from "./_runtime.ts";`
        : responsiveProps.length > 0
          ? `import { type Responsive, responsiveDataAttrs } from "./_runtime.ts";`
          : null,
  ]
    .filter((l): l is string => l !== null)
    .join("\n");

  return `"use client";

// AUTOGENERATED by gen-react. Do not edit.
// Source: specs/${spec.name}.yaml

${imports}

${typeBlockPrefix}${renderOwnProps(spec, Name, sizeIsResponsive, propDescriptions)}

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

// ── Composite wrapper renderer ──────────────────────────────────────────────

/**
 * Emits a React wrapper for a composite spec — currently the
 * "overlay-with-anchor" shape: one `fromChildren` part (rendered as a thin
 * `<span>` wrapper around the consumer's children) and one rendered part
 * bound by `popover:` + `interactions:`.
 *
 * The runtime hook `useOverlay` (in `_runtime.ts`) drives the state machine,
 * popover toggling, anchor binding, and event listener wiring. The emitted
 * wrapper does the JSX-shape work: wrapping `children` in the trigger span
 * (the wrapper-element pattern; works across React + Astro slots, no
 * `cloneElement`) and rendering the floating part with the right attributes.
 */
function renderCompositeWrapper(spec: Spec, propDescriptions: Record<string, string>): string {
  const Name = pascalCase(spec.name);
  const popover = spec.popover;
  const interactions = spec.interactions ?? [];
  const parts = spec.parts ?? {};
  if (!popover) {
    throw new Error(
      `composite spec '${spec.name}' must declare 'popover:' for the overlay-with-anchor shape`,
    );
  }
  const triggerPart = parts[popover.anchor];
  const contentPart = parts[popover.floating];
  if (!triggerPart) {
    throw new Error(`popover.anchor '${popover.anchor}' is not a declared part`);
  }
  if (!contentPart) {
    throw new Error(`popover.floating '${popover.floating}' is not a declared part`);
  }
  if (triggerPart.fromChildren !== true) {
    throw new Error(
      `popover.anchor '${popover.anchor}' must declare 'fromChildren: true' (this generator only emits the overlay-with-anchor shape)`,
    );
  }
  if (contentPart.fromChildren === true) {
    throw new Error(`popover.floating '${popover.floating}' cannot declare 'fromChildren: true'`);
  }

  const triggerClass = triggerPart.rootClass ?? `t-${spec.name}-trigger`;
  const contentClass = contentPart.rootClass ?? `t-${spec.name}`;
  const contentElement = contentPart.element ?? "div";
  const contentRole = contentPart.a11y?.role;

  // Controllable prop on the anchor part — usually `open`. The renderOwnProps
  // path consumes spec.props (merged), so we just read the name and emit the
  // hook config that maps it.
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

  // Slots that the content renders inline (e.g. `text` for Tooltip).
  const contentSlots = Object.entries(spec.props)
    .filter(([, d]) => d.slot === true && d.__part === popover.floating)
    .map(([n]) => n);

  // Responsive props rendered as data-attrs on the content element.
  const responsiveProps = Object.entries(spec.props)
    .filter(([, d]) => d.responsive === true && d.slot !== true)
    .map(([n]) => n);

  // Delay-driving number props referenced from interactions.
  const delayProps = new Set<string>();
  for (const rule of interactions) {
    if (rule.delay) delayProps.add(rule.delay);
  }

  // Enum types declared on content props (e.g. TooltipPlacement).
  const propEnumTypes = Object.entries(spec.props)
    .filter(([, d]) => Array.isArray(d.values) && d.values.length > 0)
    .map(([propName, d]) => renderEnumType(Name, pascalCase(propName), d.values ?? []))
    .filter(Boolean)
    .join("\n");

  // OwnProps merged across parts via the flattened spec.
  const ownPropLines = Object.entries(spec.props).flatMap(([n, d]) =>
    renderPropLine(n, d, propDescriptions, Name),
  );

  // Destructure: omit the controllable triple from the rest (they go straight
  // into useOverlay), keep slots/responsives separate.
  const propsToDestructure = Object.keys(spec.props);
  const destructureNames: string[] = [];
  for (const name of propsToDestructure) {
    const def = spec.props[name];
    if (!def) continue;
    if (def.pattern === "controllable" && def.type === "boolean") continue;
    const hasDefault = delayProps.has(name) && typeof def.default === "number";
    destructureNames.push(hasDefault ? `${name} = ${def.default}` : name);
  }
  destructureNames.push("children");

  const interactionItems = interactions.map((rule) => {
    const onEntries: string[] = [`event: ${quote(rule.on.event)}`];
    if (rule.on.target) onEntries.push(`target: ${quote(rule.on.target)}`);
    if (rule.on.key) onEntries.push(`key: ${quote(rule.on.key)}`);
    const onObj = `{ ${onEntries.join(", ")} }`;
    const fields: string[] = [`on: ${onObj}`, `do: ${quote(rule.do)}`];
    if (rule.delay) fields.push(`delayMs: ${rule.delay}`);
    if (rule.when) fields.push(`when: ${quote(rule.when)}`);
    return `      { ${fields.join(", ")} },`;
  });

  // Hook arguments. The controllable triple feeds in as named keys; popover +
  // interactions describe the behavior. Interactions are memoized on the
  // wrapper side so the document-listener effect inside useOverlay doesn't
  // tear down + rebind on every parent re-render — the inline array literal
  // would otherwise have a fresh identity every render.
  const memoDeps = Array.from(delayProps).join(", ");
  // Responsive `disabled` flows raw; useOverlay evaluates it against the
  // active breakpoint via `useActiveBreakpoint` + `isActiveAt`, matching
  // the CSS layer that reads the same `data-disabled-bp` attrs.
  const hasDisabledProp = Object.hasOwn(spec.props, "disabled");
  const disabledLine = hasDisabledProp ? `    disabled,\n` : "";
  const hookConfig = [
    `    ${controllableName}: ${controllableName}Prop,`,
    `    default${ControllableName},`,
    `    on${ControllableName}Change,`,
    `    anchorVar: ${quote(popover.anchorVar)},`,
    `    popoverMode: ${quote(popover.mode)},`,
    `    interactions,`,
  ].join("\n");
  const hookConfigWithDisabled = disabledLine
    ? `${hookConfig}\n${disabledLine.trimEnd()}`
    : hookConfig;
  const interactionsMemo = [
    `  const interactions = useMemo<OverlayInteraction[]>(`,
    `    () => [`,
    ...interactionItems.map((line) => `  ${line}`),
    `    ],`,
    `    [${memoDeps}],`,
    `  );`,
  ].join("\n");

  const propControlled = `${controllableName}: ${controllableName}Prop`;

  // Build the content data-attrs spread.
  const contentDataAttrsLines = responsiveProps
    .map((name) => `        {...responsiveDataAttrs(${quote(name)}, ${name})}`)
    .join("\n");

  // Rendered content body — slot props inline; default to the primary text
  // slot if one exists, otherwise `children` would have been the trigger.
  const contentBody =
    contentSlots.length > 0
      ? contentSlots.map((s) => `        {${s}}`).join("\n")
      : "        {/* no content slot declared */}";

  const importsLines = [
    `import "@teseor/css/components/${spec.name}.css";`,
    `import { type CSSProperties, type ReactNode, useMemo } from "react";`,
    `import { type OverlayInteraction, responsiveDataAttrs, type Responsive, Slot, useOverlay } from "./_runtime.ts";`,
  ].join("\n");

  const contentRoleAttr = contentRole ? `        role=${quote(contentRole)}` : null;

  return `"use client";

// AUTOGENERATED by gen-react. Do not edit.
// Source: specs/${spec.name}.yaml

${importsLines}

${propEnumTypes ? `${propEnumTypes}\n` : ""}type ${Name}OwnProps = {
${ownPropLines.join("\n")}
  /** Render the trigger directly on the consumer's child element (\`cloneElement\`)
   *  instead of wrapping in a \`<span>\`. Single-child invariant: \`children\` must
   *  be a single React element. \`aria-describedby\`, the anchor binding, and
   *  event handlers land on that element. */
  asChild?: boolean;
  children?: ReactNode;
};

export type ${Name}Props = Readonly<${Name}OwnProps>;

${renderComponentJsDoc(spec, Name)}export function ${Name}(props: ${Name}Props) {
  const {
    ${propControlled},
    default${ControllableName},
    on${ControllableName}Change,
${destructureNames.map((n) => `    ${n},`).join("\n")}
    asChild,
  } = props;

${interactionsMemo}

  const overlay = useOverlay<HTMLElementTagNameMap[${quote(contentElement)}]>({
${hookConfigWithDisabled}
  });

  // \`asChild\` mode sets \`anchor-name\` directly on the consumer's element via
  // inline style (no wrapper class to read \`--_anchor\`). The default wrapper
  // path reads the custom property through the trigger CSS rule.
  const triggerStyle: CSSProperties = asChild
    ? ({ [overlay.anchorVar]: overlay.anchorName, anchorName: overlay.anchorName } as CSSProperties)
    : { [overlay.anchorVar]: overlay.anchorName };
  const hasContent = ${contentSlots[0] ? `${contentSlots[0]} != null` : "false"};

  return (
    <>
      {asChild ? (
        <Slot
          style={triggerStyle}
          data-state={overlay.state}
          aria-describedby={hasContent ? overlay.popoverId : undefined}
          {...overlay.triggerHandlers}
        >
          {children}
        </Slot>
      ) : (
        <span
          className=${quote(triggerClass)}
          style={triggerStyle}
          data-state={overlay.state}
          aria-describedby={hasContent ? overlay.popoverId : undefined}
          {...overlay.triggerHandlers}
        >
          {children}
        </span>
      )}
      {hasContent && (
        <${contentElement}
          ref={overlay.contentRef}
          id={overlay.popoverId}
${contentRoleAttr ? `${contentRoleAttr.replace(/ {8}/, "          ")}\n` : ""}          className=${quote(contentClass)}
          popover={overlay.popoverMode}
          data-state={overlay.state}
          style={{ [overlay.anchorVar]: overlay.anchorName } satisfies CSSProperties}
${contentDataAttrsLines.replace(/^ {8}/gm, "          ")}
        >
${contentBody.replace(/^ {8}/gm, "          ")}
        </${contentElement}>
      )}
    </>
  );
}
`;
}

function renderWrapper(spec: Spec, propDescriptions: Record<string, string>): string {
  if (spec.kind === "composite") return renderCompositeWrapper(spec, propDescriptions);
  return renderAtomicWrapper(spec, propDescriptions);
}

function renderCssShim(): string {
  return `// AUTOGENERATED by gen-react. Do not edit.

declare module "*.css";
`;
}

function renderRuntime(breakpoints: Breakpoint[]): string {
  return `// AUTOGENERATED by gen-react. Do not edit.

import {
  Children,
  cloneElement,
  type ElementType,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type Ref,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

${renderSharedResponsiveRuntimePrelude(breakpoints)}

/** Reactive active-breakpoint key. Drives \`Responsive<T>\` runtime behavior. */
export function useActiveBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(() => readActiveBreakpoint());
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const onChange = () => setBp(readActiveBreakpoint());
    const cleanups: Array<() => void> = [];
    for (const key of RESPONSIVE_KEYS) {
      if (key === "base") continue;
      const q = BREAKPOINT_QUERIES[key];
      if (!q) continue;
      const mql = window.matchMedia(q);
      mql.addEventListener("change", onChange);
      cleanups.push(() => mql.removeEventListener("change", onChange));
    }
    return () => {
      for (const fn of cleanups) fn();
    };
  }, []);
  return bp;
}

${renderSharedResponsiveRuntimeUtilities()}

/** Widen a narrow tag-name union back to ElementType so JSX's ref slot isn't pinned. */
export function asElement(value: ElementType): ElementType {
  return value;
}

// ── Slot — clone-into-child pattern for \`asChild\` composites ────────────────

type SlotProps = Record<string, unknown> & { children?: ReactNode };

function mergeSlotProps(
  childProps: Record<string, unknown>,
  slotProps: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...childProps };
  for (const key of Object.keys(slotProps)) {
    if (key === "children") continue;
    const childValue = childProps[key];
    const slotValue = slotProps[key];
    if (key === "style") {
      out[key] = {
        ...((childValue as object | undefined) ?? {}),
        ...((slotValue as object | undefined) ?? {}),
      };
    } else if (key === "className") {
      out[key] = [childValue, slotValue].filter(Boolean).join(" ");
    } else if (
      key.startsWith("on") &&
      typeof childValue === "function" &&
      typeof slotValue === "function"
    ) {
      // Compose handlers: child fires first, then ours — skip ours if the
      // child called \`event.preventDefault()\` (Radix convention). Lets a
      // consumer suppress overlay behavior by preventing on their own handler.
      const childFn = childValue as (...a: unknown[]) => void;
      const slotFn = slotValue as (...a: unknown[]) => void;
      out[key] = (...args: unknown[]) => {
        childFn(...args);
        const event = args[0] as { defaultPrevented?: boolean } | undefined;
        if (event?.defaultPrevented !== true) slotFn(...args);
      };
    } else {
      // Slot props win for refs, aria-*, data-*.
      out[key] = slotValue;
    }
  }
  return out;
}

/**
 * Clone-into-child: merges slot props onto a single React element child.
 * Used by composite wrappers when \`asChild\` is true — \`aria-describedby\`,
 * event handlers, and the anchor binding land on the consumer's element
 * instead of an extra \`<span>\` wrapper. Warns and renders nothing if
 * \`children\` isn't exactly one valid React element (fragment, multiple
 * children, or null all hit the warn path — never throws).
 */
export function Slot({ children, ...slotProps }: SlotProps): ReactElement | null {
  const elements = Children.toArray(children).filter(isValidElement);
  if (elements.length !== 1) {
    if (typeof console !== "undefined") {
      console.warn(
        \`Slot: expected exactly one React element child, got \${elements.length}. Pass a single element (e.g. <button>...</button>) or drop \\\`asChild\\\`.\`,
      );
    }
    return null;
  }
  const child = elements[0] as ReactElement<Record<string, unknown>>;
  // Astro wraps slotted children in \`<astro-slot>\`. \`cloneElement\` merges
  // props onto that wrapper, not the element inside, so handlers and
  // \`aria-describedby\` never reach the consumer's button. Warn loudly —
  // there is no workaround at the React layer.
  if (typeof child.type === "string" && child.type.startsWith("astro-")) {
    if (typeof console !== "undefined") {
      console.warn(
        "Slot: \`asChild\` does not work inside Astro slots — children arrive wrapped in <astro-slot>. Drop \`asChild\` (use the default wrapper) when rendering this component from a .astro file.",
      );
    }
    return cloneElement(child, mergeSlotProps(child.props ?? {}, slotProps));
  }
  return cloneElement(child, mergeSlotProps(child.props ?? {}, slotProps));
}

// ── Overlay hook — used by composite overlay components ────────────────────

export type OverlayInteraction = {
  on: { event: string; target?: string; key?: string };
  do: "open" | "close" | "toggle";
  /** ms delay resolved at the call site from the consumer's delay props. */
  delayMs?: number;
  when?: string;
};

type OverlayConfig = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  anchorVar: string;
  popoverMode: "auto" | "manual" | "hint";
  interactions: ReadonlyArray<OverlayInteraction>;
  /** Active at the current breakpoint? state machine no-ops; matches CSS \`data-disabled-bp\`. */
  disabled?: Responsive<boolean>;
};

type AnyEventHandler = (event: unknown) => void;

type OverlayHandlers = Record<string, AnyEventHandler>;

type OverlayReturn<T extends HTMLElement> = {
  open: boolean;
  state: "open" | "closed";
  activeBp: Breakpoint;
  setOpen: (next: boolean) => void;
  anchorName: string;
  anchorVar: string;
  popoverId: string;
  popoverMode: "auto" | "manual" | "hint";
  contentRef: Ref<T>;
  triggerHandlers: OverlayHandlers;
};

${renderSharedPopoverDomHelpers()}

const EVENT_TO_HANDLER: Record<string, string> = {
  pointerenter: "onPointerEnter",
  pointerleave: "onPointerLeave",
  pointerdown: "onPointerDown",
  pointerup: "onPointerUp",
  click: "onClick",
  focusin: "onFocus",
  focusout: "onBlur",
  keydown: "onKeyDown",
  keyup: "onKeyUp",
};

/** State machine + popover toggle + anchor binding + event wiring for overlay composites. */
export function useOverlay<T extends HTMLElement = HTMLElement>(
  config: OverlayConfig,
): OverlayReturn<T> {
  const {
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    anchorVar,
    popoverMode,
    interactions,
    disabled,
  } = config;
  const activeBp = useActiveBreakpoint();
  const isDisabled = isActiveAt(disabled, activeBp);

  const controlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState<boolean>(defaultOpen);
  const open = controlled ? Boolean(openProp) : internalOpen;
  const onOpenChangeRef = useRef(onOpenChange);
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  const setOpen = useCallback(
    (next: boolean) => {
      if (!controlled) setInternalOpen(next);
      onOpenChangeRef.current?.(next);
    },
    [controlled],
  );

  const rawId = useId();
  const idCore = sanitizeId(rawId);
  const anchorName = \`--t-\${idCore}\`;
  const popoverId = \`t-overlay-\${idCore}\`;

  // Callback ref + tracked node so the popover-sync effect re-runs when the
  // floating element mounts later (e.g. \`{hasContent && <…/>}\` flips true
  // while \`open\` is already true). A plain \`useRef\` wouldn't notify React.
  const [contentNode, setContentNode] = useState<T | null>(null);
  const contentRef = useCallback((node: T | null) => {
    setContentNode(node);
  }, []);

  const timersRef = useRef<{ open: number; close: number }>({ open: 0, close: 0 });
  const clearTimers = useCallback(() => {
    if (timersRef.current.open) window.clearTimeout(timersRef.current.open);
    if (timersRef.current.close) window.clearTimeout(timersRef.current.close);
    timersRef.current.open = 0;
    timersRef.current.close = 0;
  }, []);

  // \`openRef\` lets effect-bound handlers read latest state without re-binding.
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const schedule = useCallback(
    (action: "open" | "close" | "toggle", delayMs: number) => {
      if (isDisabled) return;
      clearTimers();
      const next = action === "toggle" ? !openRef.current : action === "open";
      if (delayMs <= 0) {
        setOpen(next);
        return;
      }
      const slot: "open" | "close" = action === "close" ? "close" : "open";
      timersRef.current[slot] = window.setTimeout(() => setOpen(next), delayMs);
    },
    [clearTimers, setOpen, isDisabled],
  );

  useEffect(() => () => clearTimers(), [clearTimers]);

  // Drive Popover API from \`open\` + the tracked node. Re-runs when either
  // changes — handles "node mounts later while open is already true."
  useEffect(() => {
    if (!contentNode) return;
    const popoverState = popoverIsOpen(contentNode);
    if (open && popoverState !== true) {
      try {
        contentNode.showPopover();
      } catch {}
    } else if (!open && popoverState !== false) {
      try {
        contentNode.hidePopover();
      } catch {}
    }
  }, [open, contentNode]);

  // Document/window-bound rules. Listeners mount with the rules array;
  // \`when:\` is re-evaluated per fire via \`openRef\`.
  useEffect(() => {
    const cleanups: Array<() => void> = [];
    for (const rule of interactions) {
      const target = rule.on.target;
      if (target !== "document" && target !== "window") continue;
      const sink: EventTarget = target === "document" ? document : window;
      const handler = (event: Event) => {
        if (rule.when === "open" && !openRef.current) return;
        if (rule.on.key && event instanceof KeyboardEvent && event.key !== rule.on.key) return;
        schedule(rule.do, rule.delayMs ?? 0);
      };
      sink.addEventListener(rule.on.event, handler);
      cleanups.push(() => sink.removeEventListener(rule.on.event, handler));
    }
    return () => {
      for (const fn of cleanups) fn();
    };
  }, [interactions, schedule]);

  // Trigger-bound rules → React handlers spread on the wrapper element.
  // Same-event rules compose; \`when\` and \`on.key\` filter per-fire as above.
  const triggerHandlers: OverlayHandlers = {};
  for (const rule of interactions) {
    if (rule.on.target !== "trigger") continue;
    const handlerName = EVENT_TO_HANDLER[rule.on.event];
    if (!handlerName) continue;
    const previous = triggerHandlers[handlerName];
    const delayMs = rule.delayMs ?? 0;
    const next = (e: unknown) => {
      previous?.(e);
      if (rule.when === "open" && !openRef.current) return;
      if (rule.on.key) {
        // React passes a SyntheticEvent (not a native KeyboardEvent), so
        // \`instanceof KeyboardEvent\` is always false here. Duck-type on
        // \`.key\` — works for both React synthetic and native events.
        const key = (e as { key?: string } | null)?.key;
        if (key !== rule.on.key) return;
      }
      schedule(rule.do, delayMs);
    };
    triggerHandlers[handlerName] = next;
  }

  return {
    open,
    state: open ? "open" : "closed",
    activeBp,
    setOpen,
    anchorName,
    anchorVar,
    popoverId,
    popoverMode,
    contentRef,
    triggerHandlers,
  };
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

async function emitRuntime(breakpoints: Breakpoint[]): Promise<string> {
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
    const path = await emitWrapper(name, propDescriptions);
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
