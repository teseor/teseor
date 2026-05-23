import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { flattenSpec } from "../lib/flatten.ts";
import { loadVocabulary } from "../lib/vocabulary.ts";
import type { GeneratorContext, GeneratorReport } from "../registry.ts";
import { registerGenerator } from "../registry.ts";
import { Spec as SpecSchema } from "../schema.ts";
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

function renderRuntime(breakpoints: string[]): string {
  const keys = ["base", ...breakpoints].map(quote).join(", ");
  return `// AUTOGENERATED by gen-vue. Do not edit.

import {
  computed,
  onBeforeUnmount,
  onMounted,
  type Ref,
  ref,
  type ShallowRef,
  shallowRef,
  useId,
  watch,
} from "vue";

const RESPONSIVE_KEYS = [${keys}] as const;

type Breakpoint = (typeof RESPONSIVE_KEYS)[number];

export type Responsive<T> = T | Partial<Record<Breakpoint, T>>;

export function responsiveDataAttrs(
  name: string,
  value: unknown,
): Record<string, string | undefined> {
  if (value == null || value === false) return {};
  if (typeof value === "object") {
    // Responsive object: emit every declared breakpoint, including \`false\`.
    // The CSS for responsive overrides reads explicit \`data-\${name}-\${bp}\`
    // attributes (e.g. \`[data-disabled-md="false"]\` reverts the base
    // \`[data-disabled="true"]\` at md+); dropping \`false\` here breaks the
    // override and the base value sticks across every breakpoint.
    const obj = value as Record<string, unknown>;
    const out: Record<string, string | undefined> = {};
    for (const key of RESPONSIVE_KEYS) {
      const v = obj[key];
      if (v == null) continue;
      // Drop \`false\` only at the \`base\` slot — its CSS rule is "absence of
      // the attribute"; emitting \`data-disabled="false"\` would never match.
      if (key === "base" && v === false) continue;
      const attr = key === "base" ? \`data-\${name}\` : \`data-\${name}-\${key}\`;
      out[attr] = v === true ? "true" : v === false ? "false" : String(v);
    }
    return out;
  }
  return { [\`data-\${name}\`]: value === true ? "true" : String(value) };
}

// ── Overlay composable — used by composite overlay components ──────────────

type OverlayInteraction = {
  on: { event: string; target?: string; key?: string };
  do: "open" | "close" | "toggle";
  /** ms delay before the action fires. Function form lets the wrapper pass a
   *  reactive getter (e.g. \`() => openDelay\`) so the latest prop value is
   *  read on every fire; Vue's setup runs once so a plain number would
   *  capture the value at setup-time and miss later prop changes. */
  delayMs?: number | (() => number);
  when?: string;
};

type OverlayConfig = {
  /** Reactive getter for the controlled \`open\` prop. Passed as a function
   *  so the composable re-reads it via \`config.open()\` on every render —
   *  capturing the value at setup-time (Vue's setup runs once) would lose
   *  every later parent prop change. \`undefined\` means uncontrolled. */
  open?: () => boolean | undefined;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  anchorVar: string;
  popoverMode: "auto" | "manual" | "hint";
  interactions: ReadonlyArray<OverlayInteraction>;
  /** Reactive getter for plain-boolean \`disabled\`. When it returns \`true\`,
   *  every \`schedule\` call no-ops: state doesn't flip, \`onOpenChange\` doesn't
   *  fire. Responsive \`disabled\` is handled at the CSS layer via
   *  \`data-disabled-bp\` attributes. */
  disabled?: () => boolean;
};

type OverlayHandlers = Record<string, (event: Event) => void>;

type OverlayReturn = {
  open: Readonly<Ref<boolean>>;
  setOpen: (next: boolean) => void;
  anchorName: string;
  anchorVar: string;
  popoverId: string;
  popoverMode: "auto" | "manual" | "hint";
  /** Vue's template-ref machinery assigns the DOM element here; consumers
   *  bind via \`ref="contentRef"\` in their template. */
  contentRef: ShallowRef<HTMLElement | null>;
  triggerHandlers: OverlayHandlers;
};

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "");
}

/** Probe \`:popover-open\` once and reuse. Older browsers that ship Popover
 *  API but not the selector throw \`SyntaxError\` from \`Element.matches\`; the
 *  feature query lets us skip the call entirely on those engines.
 *  \`undefined\` means "selector unavailable, fall through and let
 *  \`showPopover\`/\`hidePopover\` decide". */
const SUPPORTS_POPOVER_OPEN_SELECTOR =
  typeof CSS !== "undefined" &&
  typeof CSS.supports === "function" &&
  CSS.supports("selector(:popover-open)");

function popoverIsOpen(node: HTMLElement): boolean | undefined {
  if (!SUPPORTS_POPOVER_OPEN_SELECTOR) return undefined;
  try {
    return node.matches(":popover-open");
  } catch {
    return undefined;
  }
}

/**
 * Drives the state machine, popover toggling, anchor binding, and event
 * wiring for composite overlay components in Vue. Mirror of \`useOverlay\` in
 * \`@teseor/react\`; both consume the same spec-derived config.
 */
export function useOverlay(config: OverlayConfig): OverlayReturn {
  const internalOpen = ref<boolean>(config.defaultOpen ?? false);
  // Re-evaluated each render via the getter pattern. When the consumer's
  // \`open\` prop changes, the computed re-runs and the popover state updates.
  const open = computed<boolean>(() => {
    const fromProp = config.open?.();
    return fromProp !== undefined ? fromProp : internalOpen.value;
  });

  const setOpen = (next: boolean) => {
    const fromProp = config.open?.();
    if (fromProp === undefined) internalOpen.value = next;
    config.onOpenChange?.(next);
  };

  const idCore = sanitizeId(useId());
  const anchorName = \`--t-\${idCore}\`;
  const popoverId = \`t-overlay-\${idCore}\`;

  const contentRef = shallowRef<HTMLElement | null>(null);

  let openTimer = 0;
  let closeTimer = 0;
  const clearTimers = () => {
    if (openTimer) window.clearTimeout(openTimer);
    if (closeTimer) window.clearTimeout(closeTimer);
    openTimer = 0;
    closeTimer = 0;
  };

  const schedule = (action: "open" | "close" | "toggle", delayMs: number) => {
    // No-op when the wrapper passed \`disabled: () => true\`. Reads the getter
    // each call so the latest prop value gates the state transition.
    if (config.disabled?.() === true) return;
    clearTimers();
    const next = action === "toggle" ? !open.value : action === "open";
    if (delayMs <= 0) {
      setOpen(next);
      return;
    }
    if (action === "close") {
      closeTimer = window.setTimeout(() => setOpen(next), delayMs);
    } else {
      openTimer = window.setTimeout(() => setOpen(next), delayMs);
    }
  };

  onBeforeUnmount(() => clearTimers());

  // Sync popover state with the reactive \`open\` value. \`immediate: true\`
  // ensures the initial \`defaultOpen: true\` / controlled \`open: true\` calls
  // \`showPopover()\` after the first mount instead of waiting for a change.
  // \`flush: 'post'\` defers each callback to after the DOM update, so the
  // popover element exists when we toggle it.
  // \`popoverIsOpen\` may return \`undefined\` on engines without
  // \`:popover-open\`; in that case we attempt the transition and let
  // \`showPopover\`/\`hidePopover\` throw harmlessly on invalid state.
  watch(
    open,
    (current) => {
      const node = contentRef.value;
      if (!node) return;
      const popoverState = popoverIsOpen(node);
      if (current && popoverState !== true) {
        try {
          node.showPopover();
        } catch {
          // Popover API unsupported, display:none, or already open — degrade silently.
        }
      } else if (!current && popoverState !== false) {
        try {
          node.hidePopover();
        } catch {
          // Popover API unsupported or already closed — degrade silently.
        }
      }
    },
    { immediate: true, flush: "post" },
  );

  // Resolve a rule's delay at fire-time so getter-form delays (the wrapper
  // passes \`delayMs: () => openDelay\`) pick up the latest prop value.
  const resolveDelay = (d: number | (() => number) | undefined): number => {
    if (d === undefined) return 0;
    return typeof d === "function" ? d() : d;
  };

  // Document/window-bound interactions. Listeners attach on mount and unmount.
  const cleanups: Array<() => void> = [];
  onMounted(() => {
    for (const rule of config.interactions) {
      const target = rule.on.target;
      if (target !== "document" && target !== "window") continue;
      const sink: EventTarget = target === "document" ? document : window;
      const handler = (event: Event) => {
        if (rule.when === "open" && !open.value) return;
        if (rule.on.key && event instanceof KeyboardEvent && event.key !== rule.on.key) return;
        schedule(rule.do, resolveDelay(rule.delayMs));
      };
      sink.addEventListener(rule.on.event, handler);
      cleanups.push(() => sink.removeEventListener(rule.on.event, handler));
    }
  });
  onBeforeUnmount(() => {
    for (const fn of cleanups) fn();
  });

  // Trigger-bound handlers spread via \`v-on\` onto the wrapper element.
  // Keys are bare event names (\`pointerenter\`, not \`onPointerenter\`); Vue's
  // v-on directive handles the listener registration. Each rule respects
  // its own \`when\` state guard and \`on.key\` filter — same semantics as the
  // document/window-bound branch above.
  const triggerHandlers: OverlayHandlers = {};
  for (const rule of config.interactions) {
    if (rule.on.target !== "trigger") continue;
    const eventName = rule.on.event;
    const previous = triggerHandlers[eventName];
    triggerHandlers[eventName] = (event: Event) => {
      previous?.(event);
      if (rule.when === "open" && !open.value) return;
      if (rule.on.key) {
        if (!(event instanceof KeyboardEvent) || event.key !== rule.on.key) return;
      }
      schedule(rule.do, resolveDelay(rule.delayMs));
    };
  }

  return {
    open,
    setOpen,
    anchorName,
    anchorVar: config.anchorVar,
    popoverId,
    popoverMode: config.popoverMode,
    contentRef,
    triggerHandlers,
  };
}
`;
}

// ── Composite wrapper renderer ──────────────────────────────────────────────

/**
 * Emits a Vue SFC for a composite spec — the overlay-with-anchor shape:
 * one `fromChildren` part (rendered as a `<span>` wrapper around the default
 * slot) and one rendered part bound by `popover:` + `interactions:`. The
 * runtime composable `useOverlay` (in `_runtime.ts`) drives behavior; the
 * emitted SFC does the template-shape work.
 */
function renderCompositeWrapper(spec: Spec, _propDescriptions: Record<string, string>): string {
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
  if (!triggerPart || !contentPart) {
    throw new Error(
      `popover.anchor '${popover.anchor}' or popover.floating '${popover.floating}' is not a declared part`,
    );
  }
  if (triggerPart.fromChildren !== true) {
    throw new Error(
      `popover.anchor '${popover.anchor}' must declare 'fromChildren: true' (Vue composite emitter only supports the overlay-with-anchor shape)`,
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
    .filter(([, d]) => d.slot === true && d.__part === popover.floating)
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

  const needsComputed = responsiveProps.length > 0;
  const vueRuntimeImport =
    responsiveProps.length > 0
      ? `import { type Responsive, responsiveDataAttrs, useOverlay } from "./_runtime.ts";`
      : `import { useOverlay } from "./_runtime.ts";`;
  const importsLines = [
    `import "@teseor/css/components/${spec.name}.css";`,
    needsComputed ? `import { computed } from "vue";` : null,
    vueRuntimeImport,
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
    Object.hasOwn(spec.props, "disabled") ? `\n  disabled: () => disabled === true,` : ""
  }
  anchorVar: ${quote(popover.anchorVar)},
  popoverMode: ${quote(popover.mode)},
  interactions: [
${interactionItems.join("\n")}
  ],
});

const contentRef = overlay.contentRef;
${contentDataAttrComputed}
</script>

<template>
  <span
    class="${triggerClass}"
    :style="{ [overlay.anchorVar]: overlay.anchorName }"
    :aria-describedby="${contentSlots[0] ? `${contentSlots[0]} != null` : "false"} ? overlay.popoverId : undefined"
    v-on="overlay.triggerHandlers"
  >
    <slot />
  </span>
  <${contentElement}
    ref="contentRef"
    :id="overlay.popoverId"
    ${roleAttr}
    class="${contentClass}"
    :popover="overlay.popoverMode"
    :style="{ [overlay.anchorVar]: overlay.anchorName }"${contentDataAttrBinding}
  >
${contentBodyLines}
  </${contentElement}>
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
