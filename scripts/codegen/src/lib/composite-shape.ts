import type { SpecPart } from "../schema.ts";
import type { FlatSpec } from "./flatten.ts";

/**
 * Options that customize the validation surface of `extractCompositeShape`.
 *
 * The two existing generators (React, Vue) differ in their error wording and
 * in which validations they apply:
 *
 *   - React emits separate errors for missing anchor and missing floating
 *     parts and forbids the floating part from declaring `fromChildren: true`.
 *   - Vue combines the missing-part check into one error and skips the
 *     floating-part `fromChildren` check.
 *
 * The flags below carry these asymmetries while keeping the happy-path
 * extraction in one place.
 */
export type CompositeShapeOptions = {
  /**
   * Trailing phrase appended to the "anchor must declare fromChildren" error,
   * in parentheses. Identifies which emitter rejected the spec.
   *
   *   React: "this generator only emits the overlay-with-anchor shape"
   *   Vue:   "Vue composite emitter only supports the overlay-with-anchor shape"
   */
  emitterLabel: string;
  /**
   * When `true` (React), report missing anchor and missing floating parts in
   * two separate errors. When `false` (Vue), report both in one combined
   * error. The wording matches each generator's pre-extraction behavior.
   */
  separateMissingPartErrors: boolean;
  /**
   * When `true` (React), throw if the floating part declares
   * `fromChildren: true`. Vue does not enforce this today.
   */
  forbidContentFromChildren: boolean;
};

/** The extracted overlay-with-anchor shape every composite generator needs. */
export type CompositeShape = {
  overlaySpec: NonNullable<FlatSpec["overlay"]>;
  triggerPart: SpecPart;
  contentPart: SpecPart;
  triggerClass: string;
  contentClass: string;
  contentElement: string;
  contentRole: string | undefined;
};

/**
 * Resolve the overlay-with-anchor shape from a composite spec. Returns the
 * trigger + content parts plus the derived classes / element / role used by
 * both the React and Vue composite emitters. Throws when the spec is
 * incompatible with the overlay-with-anchor shape.
 */
export function extractCompositeShape(spec: FlatSpec, opts: CompositeShapeOptions): CompositeShape {
  const overlaySpec = spec.overlay;
  const parts = spec.parts ?? {};
  if (!overlaySpec) {
    throw new Error(
      `composite spec '${spec.name}' must declare 'overlay:' for the overlay-with-anchor shape`,
    );
  }
  const triggerPart = parts[overlaySpec.anchor];
  const contentPart = parts[overlaySpec.floating];
  if (opts.separateMissingPartErrors) {
    if (!triggerPart) {
      throw new Error(`overlay.anchor '${overlaySpec.anchor}' is not a declared part`);
    }
    if (!contentPart) {
      throw new Error(`overlay.floating '${overlaySpec.floating}' is not a declared part`);
    }
  } else {
    if (!triggerPart || !contentPart) {
      throw new Error(
        `overlay.anchor '${overlaySpec.anchor}' or overlay.floating '${overlaySpec.floating}' is not a declared part`,
      );
    }
  }
  if (triggerPart.fromChildren !== true) {
    throw new Error(
      `overlay.anchor '${overlaySpec.anchor}' must declare 'fromChildren: true' (${opts.emitterLabel})`,
    );
  }
  if (opts.forbidContentFromChildren && contentPart.fromChildren === true) {
    throw new Error(
      `overlay.floating '${overlaySpec.floating}' cannot declare 'fromChildren: true'`,
    );
  }

  const triggerClass = triggerPart.rootClass ?? `t-${spec.name}-trigger`;
  const contentClass = contentPart.rootClass ?? `t-${spec.name}`;
  const contentElement = contentPart.element ?? "div";
  const contentRole = contentPart.a11y?.role;

  return {
    overlaySpec,
    triggerPart,
    contentPart,
    triggerClass,
    contentClass,
    contentElement,
    contentRole,
  };
}
