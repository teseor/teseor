import {
  extractCompositeShape,
  legacyInteractionsFromStates,
} from "../../../lib/composite-shape.ts";
import { renderEnumType } from "../../../lib/enum-primitives.ts";
import { reactJsDocFlavor, renderComponentJsDoc } from "../../../lib/jsdoc-shape.ts";
import { pascalCase } from "../../../lib/pascal-case.ts";
import type { Spec } from "../../gen-contract.ts";
import {
  consumerHandlerPropNames,
  hasEventsBlock,
  renderChannelPropLines,
  renderEventHandlerBodies,
  renderEventPropLines,
} from "../_shared/events.ts";
import { renderPropLine } from "../_shared/props.ts";
import { quote } from "../_shared/type-printer.ts";

/**
 * Emits a React wrapper for a composite spec — currently the
 * "overlay-with-anchor" shape: one `fromChildren` part (rendered as a thin
 * `<span>` wrapper around the consumer's children) and one rendered part
 * bound by `overlay:` + `interactions:`.
 *
 * The runtime hook `useOverlay` (in `hooks/useOverlay.ts`) drives the state machine,
 * popover toggling, anchor binding, and event listener wiring. The emitted
 * wrapper does the JSX-shape work: wrapping `children` in the trigger span
 * (the wrapper-element pattern; works across React + Astro slots, no
 * `cloneElement`) and rendering the floating part with the right attributes.
 */
export function renderCompositeOverlayReactWrapper(
  spec: Spec,
  propDescriptions: Record<string, string>,
): string {
  const Name = pascalCase(spec.name);
  // `overlaySpec` (not `overlay`) avoids shadowing the emitted runtime
  // `const overlay = useOverlay(...)`.
  const {
    overlaySpec,
    contentPart,
    contentPartName,
    triggerClass,
    contentClass,
    contentElement,
    contentRole,
  } = extractCompositeShape(spec, {
    emitterLabel: "this generator only emits the overlay-with-anchor shape",
    separateMissingPartErrors: true,
    forbidContentFromChildren: true,
  });
  const interactions = legacyInteractionsFromStates(contentPart);

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
    .filter(([, d]) => d.slot === true && d.__part === contentPartName)
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
  // Per-event prop lines + the channel — emitted only when events: is declared.
  const eventPropLines = renderEventPropLines(spec);
  const channelPropLines = renderChannelPropLines(spec, Name);

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
  // Consumer-facing event handler props (`onDismiss`, `onSelect`, …) plus the
  // channel — destructured from props so the wrapper-body `useCallback`
  // closures capture them directly.
  const eventDestructureNames = hasEventsBlock(spec)
    ? [...consumerHandlerPropNames(spec), "onEvent"]
    : [];

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
  // When events: is declared, the controllable change callback is the wrapped
  // `handle<Controllable>Change` (consumer callback first, channel after).
  // When the spec declares the `dismiss` event, the wrapped `handleDismiss`
  // also feeds in as `onDismiss` so useOverlay's dismissable-layer + trigger
  // routes go through the same per-event-then-channel chain.
  const events = spec.events ?? {};
  const hasDismissEvent = Object.hasOwn(events, "dismiss");
  // Shorthand `onOpenChange,` when there are no declared events; explicit
  // `onOpenChange: handleOpenChange,` when an events block wraps the callback
  // to fire the channel after the consumer's controllable callback.
  const changeLine = hasEventsBlock(spec)
    ? `    on${ControllableName}Change: handle${ControllableName}Change,`
    : `    on${ControllableName}Change,`;
  const hookConfig = [
    `    ${controllableName}: ${controllableName}Prop,`,
    `    default${ControllableName},`,
    changeLine,
    ...(hasDismissEvent ? [`    onDismiss: handleDismiss,`] : []),
    `    anchorVar: ${quote(overlaySpec.anchorVar)},`,
    `    popoverMode: ${quote(overlaySpec.mode)},`,
    `    interactions,`,
    ...(overlaySpec.modal ? [`    modal: true,`] : []),
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

  const hasResponsive = responsiveProps.length > 0;
  const eventsDeclared = hasEventsBlock(spec);
  // Modal overlays gate the portal on a mounted flag (set in a `useEffect`) so
  // server-rendered HTML and the client's first render match — same null result
  // for the portal subtree, no hydration mismatch warnings.
  const reactRuntimeImports = ["type CSSProperties", "type ReactNode", "type Ref"];
  if (eventsDeclared) reactRuntimeImports.push("useCallback");
  if (overlaySpec.modal) reactRuntimeImports.push("useEffect");
  reactRuntimeImports.push("useMemo");
  if (overlaySpec.modal) reactRuntimeImports.push("useState");
  const teseorRuntimeImports = [
    "mergeRefs",
    ...(hasResponsive ? ["responsiveDataAttrs", "type Responsive"] : []),
  ];
  const importsLines = [
    `import "@teseor/css/components/${spec.name}.css";`,
    `import { ${reactRuntimeImports.join(", ")} } from "react";`,
    ...(overlaySpec.modal ? [`import { createPortal } from "react-dom";`] : []),
    ...(eventsDeclared ? [`import type { ${Name}Event } from "@teseor/contract";`] : []),
    `import { ${teseorRuntimeImports.join(", ")} } from "./_runtime.ts";`,
    `import { Slot } from "./components/Slot.tsx";`,
    `import { type OverlayInteraction, useOverlay } from "./hooks/useOverlay.ts";`,
  ].join("\n");

  const contentRoleAttr = contentRole ? `        role=${quote(contentRole)}` : null;
  // ARIA dialogs require an accessible name. Bind it to the first slot prop on
  // the content part (Modal: `title`) so the screen-reader announcement matches
  // the visible body. Other roles (`tooltip`) name themselves via the trigger's
  // `aria-describedby`, so the binding is dialog-specific.
  const ariaLabelAttr =
    contentRole === "dialog" && contentSlots[0] ? `        aria-label={${contentSlots[0]}}` : null;
  // `aria-modal="true"` makes assistive tech treat the dialog as a modal —
  // required alongside `role="dialog"` when the content also inerts the page.
  const ariaModalAttr =
    overlaySpec.modal && contentRole === "dialog" ? `        aria-modal="true"` : null;
  // Modal triggers don't `aria-describedby` the dialog: the describes-relationship
  // is right for tooltips (the tooltip describes the trigger) but wrong for modals
  // (the dialog isn't a description of the trigger, and screen readers would read
  // dialog body text while focus is still on the trigger). Tooltips keep it.
  const triggerAriaDescribedBy = overlaySpec.modal
    ? null
    : `          aria-describedby={hasContent ? overlay.popoverId : undefined}`;

  return `"use client";

// AUTOGENERATED by gen-react. Do not edit.
// Source: specs/${spec.name}.yaml

${importsLines}

${propEnumTypes ? `${propEnumTypes}\n` : ""}type ${Name}OwnProps = {
${ownPropLines.join("\n")}${eventPropLines.length > 0 ? `\n${eventPropLines.join("\n")}` : ""}${channelPropLines.length > 0 ? `\n${channelPropLines.join("\n")}` : ""}
  /** Render the trigger directly on the consumer's child element (\`cloneElement\`)
   *  instead of wrapping in a \`<span>\`. Single-child invariant: \`children\` must
   *  be a single React element. The wrapper's \`style\`, \`data-state\`, event handlers,
   *  and any ARIA attributes it applies (component-specific) land on that element. */
  asChild?: boolean;
  /** Forwarded ref to the popover content element. */
  ref?: Ref<HTMLElementTagNameMap[${quote(contentElement)}]>;
  children?: ReactNode;
};

export type ${Name}Props = Readonly<${Name}OwnProps>;

${renderComponentJsDoc(spec, Name, reactJsDocFlavor)}export function ${Name}(props: ${Name}Props) {
  const {
    ${propControlled},
    default${ControllableName},
    on${ControllableName}Change,
${destructureNames.map((n) => `    ${n},`).join("\n")}
${eventDestructureNames.length > 0 ? `${eventDestructureNames.map((n) => `    ${n},`).join("\n")}\n` : ""}    asChild,
    ref,
  } = props;

${interactionsMemo}
${eventsDeclared ? `\n${renderEventHandlerBodies(spec, [controllableName])}\n` : ""}
  const overlay = useOverlay<HTMLElementTagNameMap[${quote(contentElement)}]>({
${hookConfigWithDisabled}
  });
${
  overlaySpec.modal
    ? `
  // Gate the body-level portal on a mounted flag so SSR and the client's first
  // render produce the same tree (no portal); the portal swaps in after hydration.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
`
    : ""
}
  // \`asChild\` mode sets \`anchor-name\` directly on the consumer's element via
  // inline style (no wrapper class to read \`--_anchor\`). The default wrapper
  // path reads the custom property through the trigger CSS rule.
  const triggerStyle: CSSProperties = asChild
    ? ({ [overlay.anchorVar]: overlay.anchorName, anchorName: overlay.anchorName } as CSSProperties)
    : { [overlay.anchorVar]: overlay.anchorName };
  // Memoized so React doesn't tear the ref down + back up each render.
  const mergedContentRef = useMemo(
    () => mergeRefs(ref, overlay.contentRef),
    [ref, overlay.contentRef],
  );
  const hasContent = ${contentSlots[0] ? `${contentSlots[0]} != null` : "false"};

  return (
    <>
      {asChild ? (
        <Slot
          style={triggerStyle}
          data-state={overlay.state}${triggerAriaDescribedBy ? `\n${triggerAriaDescribedBy}` : ""}
          {...overlay.triggerHandlers}
        >
          {children}
        </Slot>
      ) : (
        <span
          className=${quote(triggerClass)}
          style={triggerStyle}
          data-state={overlay.state}${triggerAriaDescribedBy ? `\n${triggerAriaDescribedBy}` : ""}
          {...overlay.triggerHandlers}
        >
          {children}
        </span>
      )}
${overlaySpec.modal ? `      {hasContent && mounted && createPortal(` : `      {hasContent && (`}
        <${contentElement}
          ref={mergedContentRef}
          id={overlay.popoverId}
${contentRoleAttr ? `${contentRoleAttr.replace(/ {8}/, "          ")}\n` : ""}${ariaLabelAttr ? `${ariaLabelAttr.replace(/ {8}/, "          ")}\n` : ""}${ariaModalAttr ? `${ariaModalAttr.replace(/ {8}/, "          ")}\n` : ""}          className=${quote(contentClass)}
          popover={overlay.popoverMode}
          data-state={overlay.state}
          style={{ [overlay.anchorVar]: overlay.anchorName } satisfies CSSProperties}
${contentDataAttrsLines.replace(/^ {8}/gm, "          ")}
        >
${contentBody.replace(/^ {8}/gm, "          ")}
        </${contentElement}>
${overlaySpec.modal ? `      , document.body)}` : `      )}`}
    </>
  );
}
`;
}
