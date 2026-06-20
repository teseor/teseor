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
  renderRepeatingItems,
  renderStateMachineDiagrams,
  renderStates,
  renderTokens,
} from "../_shared/sections.ts";

/**
 * Render the `.astro` docs page for a composite-list spec.
 * Mirrors the atomic page but appends a `renderRepeatingItems` section
 * documenting each repeating part's per-item shape.
 */
export function renderCompositeListDocsPage(spec: DocsSpec): string {
  const Name = pascalCase(spec.name);
  const hasExamples = (spec.examples?.length ?? 0) > 0;
  const sections = [
    renderExamples(spec, Name, { isComposite: true }),
    renderProps(spec),
    renderRepeatingItems(spec),
    renderNamed("Variants", spec.variants),
    renderNamed("Intents", spec.intents),
    renderNamed("Sizes", spec.sizes),
    renderStateMachineDiagrams(spec),
    renderStates(spec),
    renderTokens(spec),
    renderA11y(spec),
    renderForcedColors(spec),
    renderConstraints(spec),
    renderBundleSize(spec),
  ].filter((part) => part.length > 0);

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
