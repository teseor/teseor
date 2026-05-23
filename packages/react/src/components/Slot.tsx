import { warnOnce } from "@teseor/primitives";
import {
  Children,
  cloneElement,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";

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
      // child called `event.preventDefault()` (Radix convention). Lets a
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
 * Used by composite wrappers when `asChild` is true — `aria-describedby`,
 * event handlers, and the anchor binding land on the consumer's element
 * instead of an extra `<span>` wrapper. Warns and renders nothing if
 * `children` isn't exactly one valid React element (Fragment, multiple
 * children, null, or bare text all hit the warn path — never throws).
 */
export function Slot({ children, ...slotProps }: SlotProps): ReactElement | null {
  const elements = Children.toArray(children).filter(isValidElement);
  if (elements.length !== 1) {
    warnOnce(
      "slot.multi-child",
      `Slot: expected exactly one React element child, got ${elements.length}. Pass a single element (e.g. <button>...</button>) or drop \`asChild\`.`,
    );
    return null;
  }
  const child = elements[0] as ReactElement<Record<string, unknown>>;
  // `Children.toArray` doesn't flatten Fragments — a Fragment slips past the
  // length check, then `cloneElement` silently drops slot props on it.
  if (child.type === Fragment) {
    warnOnce(
      "slot.fragment",
      "Slot: expected a single element child but got a Fragment. Pass a single element (e.g. <button>...</button>) or drop `asChild`.",
    );
    return null;
  }
  // Astro wraps slotted children in `<astro-slot>`. `cloneElement` merges
  // props onto that wrapper, not the element inside, so handlers and
  // `aria-describedby` never reach the consumer's button. Warn loudly —
  // there is no workaround at the React layer.
  if (typeof child.type === "string" && child.type.startsWith("astro-")) {
    warnOnce(
      "slot.astro",
      "Slot: `asChild` does not work inside Astro slots — children arrive wrapped in <astro-slot>. Drop `asChild` (use the default wrapper) when rendering this component from a .astro file.",
    );
    return cloneElement(child, mergeSlotProps(child.props ?? {}, slotProps));
  }
  return cloneElement(child, mergeSlotProps(child.props ?? {}, slotProps));
}
