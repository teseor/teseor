import { esc } from "../../../lib/text-escape.ts";
import type { Spec } from "../../gen-contract.ts";
import { attr } from "./jsx-printer.ts";
import { section } from "./table-printer.ts";

/** Render the `Examples` section for one spec. */
export function renderExamples(spec: Spec, Name: string, opts: { isComposite: boolean }): string {
  if (!spec.examples || spec.examples.length === 0) return "";
  const { isComposite } = opts;
  // Composite components with a `fromChildren` part don't render an element
  // themselves; the docs example wraps a Button as the trigger so the
  // composite has a real child to decorate (Tooltip + Popover pattern).
  // For composite specs, slot props (e.g. Tooltip's `text`) render as
  // attributes since they're string content, not child elements.
  const trigger = isComposite ? `<Button variant="solid" intent="primary">Trigger</Button>` : null;
  const blocks = spec.examples.map((example) => {
    const props = example.props ?? {};
    // Attrs applied to the rendered example — drop `false` props and (for
    // atomic specs) drop slot props entirely from the preview. The rendered
    // element uses the static label `${Name}` as its children, so slot values
    // don't appear in the preview at all; they remain only in the source
    // snippet below so consumers can still see the full JSX they'd paste.
    const renderedAttrs = Object.entries(props)
      .filter(([key]) => {
        if (props[key] === false) return false;
        if (isComposite) return true;
        return spec.props?.[key]?.slot !== true;
      })
      .map(([key, value]) => attr(key, value));
    const renderedOpenTag = [Name, ...renderedAttrs].join(" ");
    // Source code shown to the consumer: the full JSX they'd paste, including
    // slot props (slot values surface in the code block even when the rendered
    // example needs them as children — the consumer can pattern-match).
    const sourceAttrs = Object.entries(props)
      .filter(([, value]) => value !== false)
      .map(([key, value]) => attr(key, value));
    const sourceOpenTag = [Name, ...sourceAttrs].join(" ");
    const sourceLines =
      isComposite && trigger
        ? [`<${sourceOpenTag}>`, `  ${trigger}`, `</${Name}>`]
        : [`<${sourceOpenTag}>${Name}</${Name}>`];
    const source = sourceLines.join("\n");
    if (isComposite && trigger) {
      // Composite components carry runtime behavior (state machine, event
      // handlers, popover toggling) so the Astro island needs to hydrate.
      // `client:visible` defers JS to first viewport entry — cheap and
      // matches the "no flash until visible" UX of the docs site.
      return [
        `      <div class="t-stack" data-gap="2">`,
        `        <h3>${esc(example.id ?? "example")}</h3>`,
        `        <div class="t-cluster" data-gap="3">`,
        `          <${renderedOpenTag} client:visible>`,
        `            ${trigger}`,
        `          </${Name}>`,
        `        </div>`,
        `        <pre><code>${esc(source)}</code></pre>`,
        `      </div>`,
      ].join("\n");
    }
    return [
      `      <div class="t-stack" data-gap="2">`,
      `        <h3>${esc(example.id ?? "example")}</h3>`,
      `        <div class="t-cluster" data-gap="3">`,
      `          <${renderedOpenTag}>${Name}</${Name}>`,
      `        </div>`,
      `        <pre><code>${esc(source)}</code></pre>`,
      `      </div>`,
    ].join("\n");
  });
  return section("Examples", blocks.join("\n"));
}
