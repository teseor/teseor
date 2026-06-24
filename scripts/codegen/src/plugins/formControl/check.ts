import type { Issue } from "../../core/check-utils.ts";
import { isAtomic, issue } from "../../core/check-utils.ts";
import type { Vocabulary } from "../../lib/vocabulary.ts";
import type { Spec } from "../../schema.ts";

/**
 * Form-control atoms (Input / Textarea / Select / Switch / Checkbox / Radio)
 * share an HTML form-association contract — `name`, `form`, `required`,
 * `readOnly`, plus the universal `disabled`. The shared contract lives in
 * `specs/_vocabulary.yaml#formControl` and is the single source of truth;
 * specs receive it through React's `ComponentProps<element>` (or Vue's HTML
 * attribute fallthrough) on the rendered root. Three rules:
 *
 * - `formControl: true` requires `kind: atomic`. Composite form-controls
 *   (Combobox, DatePicker) split the contract across parts and are out of
 *   scope until a future kind lands.
 * - The rendered root tag — `element`, or every branch of an `elementByProp`
 *   map — must be one of `formControl.elements` (defaults: input, textarea,
 *   select). A non-form-control root would silently drop the shared HTML
 *   attrs at runtime.
 * - The spec's `props:` block must NOT redeclare any name in
 *   `formControl.props`. Redeclaration drifts the contract per-spec.
 */
export function checkFormControl(spec: Spec, vocabulary: Vocabulary): Issue[] {
  if (!isAtomic(spec)) return [];
  if (spec.formControl !== true) return [];
  const issues: Issue[] = [];
  const allowedElements = vocabulary.formControl.elements;
  const sharedPropNames = Object.keys(vocabulary.formControl.props);
  const root = spec.root;
  const rootTags =
    root?.kind === "byProp" ? Object.values(root.map) : root?.kind === "static" ? [root.tag] : [];
  if (rootTags.length === 0) {
    issues.push(
      issue(
        spec.name,
        "formControl",
        `\`formControl: true\` requires a rendered root element from {${allowedElements.join(", ")}}`,
      ),
    );
  }
  for (const tag of rootTags) {
    if (!allowedElements.includes(tag.toLowerCase())) {
      issues.push(
        issue(
          spec.name,
          root?.kind === "byProp" ? "root.map" : "root.tag",
          `\`formControl: true\` requires <${tag}> to be one of {${allowedElements.join(", ")}}`,
        ),
      );
    }
  }
  for (const propName of sharedPropNames) {
    if (spec.props && propName in spec.props) {
      issues.push(
        issue(
          spec.name,
          `props.${propName}`,
          `'${propName}' is part of the shared form-control contract — remove the per-spec declaration; the prop reaches the root via the rendered element's HTML attribute surface`,
        ),
      );
    }
  }
  return issues;
}
