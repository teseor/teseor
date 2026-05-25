import { pascalCase } from "../../../lib/pascal-case.ts";
import { esc } from "../../../lib/text-escape.ts";
import { renderExamples } from "../_shared/examples.ts";
import type { DocsSpec } from "../_shared/sections.ts";
import {
  renderA11y,
  renderBundleSize,
  renderConstraints,
  renderForcedColors,
  renderNamed,
  renderProps,
  renderStates,
  renderTokens,
} from "../_shared/sections.ts";

/** Render the `.astro` docs page for an atomic spec. */
export function renderAtomicDocsPage(spec: DocsSpec): string {
  const Name = pascalCase(spec.name);
  const hasExamples = (spec.examples?.length ?? 0) > 0;
  const sections = [
    renderExamples(spec, Name, { isComposite: false }),
    renderProps(spec),
    renderNamed("Variants", spec.variants),
    renderNamed("Intents", spec.intents),
    renderNamed("Sizes", spec.sizes),
    renderStates(spec),
    renderTokens(spec),
    renderA11y(spec),
    renderForcedColors(spec),
    renderConstraints(spec),
    renderBundleSize(spec),
  ].filter((part) => part.length > 0);

  // Code + Codeblock always imported: Code styles the inline `<Code>` spans in
  // every props/tokens/states table; Codeblock renders example source. Name
  // only when an example actually instantiates it.
  const reactNames = Array.from(new Set([...(hasExamples ? [Name] : []), "Code", "Codeblock"]));
  const imports = [
    `import { ${reactNames.join(", ")} } from "@teseor/react";`,
    `import Base from "../../layouts/Base.astro";`,
  ];
  const intro = spec.description ? `    <p>${esc(spec.description)}</p>\n` : "";

  return [
    "---",
    ...imports,
    "---",
    "",
    `<Base title="${Name} — Teseor">`,
    `  <main class="t-stack" data-gap="6">`,
    `    <h1>${Name}</h1>`,
    `${intro}${sections.join("\n")}`,
    "  </main>",
    "</Base>",
    "",
  ].join("\n");
}
