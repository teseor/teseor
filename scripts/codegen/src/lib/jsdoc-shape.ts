import type { FlatSpec } from "./flatten.ts";

/**
 * Minimal shape of a spec example used by JSDoc rendering. Matches
 * `schema.exampleEntry` but with `id` widened to optional so the renderer can
 * handle synthetic examples that lack an id (none today, but cheap to allow).
 */
export type JsDocExample = { id?: string; props?: Record<string, unknown> };

/**
 * Language-flavor options. React (JSX) and Vue (SFC) emit slightly different
 * `@example` snippets: code-fence tag, attribute syntax for non-primitive
 * values, and whether the JSDoc block ends with a trailing newline.
 */
export type JsDocFlavor = {
  /** Code-fence language tag (e.g. "tsx", "vue"). */
  fence: string;
  /**
   * How to render a non-string, non-`true` boolean prop. React uses
   * JSX-expression syntax `={value}`; Vue uses bound-prop syntax `:k="value"`.
   */
  renderExpressionProp: (key: string, jsonValue: string) => string;
  /**
   * Whether to append a trailing newline to the rendered JSDoc block. React
   * concatenates the block directly before `export function …`; Vue inserts
   * it via a template-literal interpolation that already supplies the
   * separator.
   */
  trailingNewline: boolean;
};

function quote(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function titleCase(id: string): string {
  return id
    .split(/[-_]/)
    .map((p) => (p.length > 0 ? p.charAt(0).toUpperCase() + p.slice(1) : p))
    .join(" ");
}

/**
 * Render the inline prop string for an `@example` snippet, e.g.
 * ` variant="solid" disabled` for `{ variant: "solid", disabled: true }`.
 *
 * Returns the empty string when there are no props.
 */
export function renderExampleProps(
  props: Record<string, unknown> | undefined,
  flavor: JsDocFlavor,
): string {
  if (!props || Object.keys(props).length === 0) return "";
  return Object.entries(props)
    .map(([k, v]) => {
      if (typeof v === "string") return ` ${k}=${quote(v)}`;
      if (typeof v === "boolean" && v === true) return ` ${k}`;
      return flavor.renderExpressionProp(k, JSON.stringify(v));
    })
    .join("");
}

/**
 * Render one `@example` JSDoc block (the leader, the fenced snippet, and the
 * closing fence). The caller assembles multiple blocks into a single JSDoc.
 * Composite-list specs render only from an array prop and accept
 * no children — pass `selfClosing: true` to emit `<Name … />` instead of
 * `<Name …>Label</Name>` so the published examples match the runtime shape.
 */
export function renderExampleBlock(
  example: JsDocExample,
  Name: string,
  flavor: JsDocFlavor,
  selfClosing = false,
): string[] {
  const propString = renderExampleProps(example.props, flavor);
  const title = example.id ? ` ${titleCase(example.id)}` : "";
  const tag = selfClosing ? `<${Name}${propString} />` : `<${Name}${propString}>Label</${Name}>`;
  return [` * @example${title}`, ` * \`\`\`${flavor.fence}`, ` * ${tag}`, ` * \`\`\``];
}

/**
 * Render the full JSDoc block for a component, combining the spec's
 * description and up to three `@example` entries. Composite-list specs
 * (with a non-empty `spec.repeating[]`) get self-closing example tags
 * because the component renders only from the array prop.
 */
export function renderComponentJsDoc(spec: FlatSpec, Name: string, flavor: JsDocFlavor): string {
  const description = spec.description ?? "";
  const examples = (spec.examples ?? []).slice(0, 3);
  const selfClosing =
    spec.kind === "composite" && Array.isArray(spec.repeating) && spec.repeating.length > 0;
  const lines: string[] = ["/**"];
  if (description) lines.push(` * ${description}`);
  for (let i = 0; i < examples.length; i++) {
    const example = examples[i];
    if (!example) continue;
    if (i === 0 && description) lines.push(` *`);
    if (i > 0) lines.push(` *`);
    lines.push(...renderExampleBlock(example, Name, flavor, selfClosing));
  }
  lines.push(" */");
  const block = lines.join("\n");
  return flavor.trailingNewline ? `${block}\n` : block;
}

/** React (JSX) flavor: `tsx` fence, `{value}` expression props, trailing `\n`. */
export const reactJsDocFlavor: JsDocFlavor = {
  fence: "tsx",
  renderExpressionProp: (key, jsonValue) => ` ${key}={${jsonValue}}`,
  trailingNewline: true,
};

/** Vue (SFC) flavor: `vue` fence, `:key='value'` bound props, no trailing `\n`.
 * Outer quotes are single because `jsonValue` (from `JSON.stringify`) contains
 * double quotes; HTML attribute values accept either delimiter. Using `"` outer
 * would produce invalid markup like `:data="{"a":1}"` that breaks copy/paste. */
export const vueJsDocFlavor: JsDocFlavor = {
  fence: "vue",
  renderExpressionProp: (key, jsonValue) => ` :${key}='${jsonValue}'`,
  trailingNewline: false,
};
