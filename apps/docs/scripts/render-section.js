import { parseTokens, resolveToken } from './parse-tokens.js';
import { renderExample } from './render-example.js';

// Cache tokens - parsed once on first use
let tokensCache = null;

/**
 * Get matching vars group for a section title
 * @param {string} title - Section title
 * @param {object} vars - All vars from API
 * @param {boolean} isFirstSection - Whether this is the first section
 * @returns {{ groupName: string, groupVars: object } | null}
 */
function getVarsGroupForSection(title, vars, isFirstSection) {
  if (!vars) return null;

  const normalized = title.toLowerCase().replace(/s$/, ''); // "Sizes" -> "size"

  // "Default" title explicitly gets base vars
  if (normalized === 'default' && vars.base) {
    return { groupName: 'base', groupVars: vars.base };
  }

  // Match title to vars key (size, variant, etc.)
  if (vars[normalized]) {
    return { groupName: normalized, groupVars: vars[normalized] };
  }

  // First section with no match gets base vars as fallback
  if (isFirstSection && vars.base) {
    return { groupName: 'base', groupVars: vars.base };
  }

  return null;
}

/**
 * Render a single modifier's vars as a table
 * @param {string} modifierName - e.g., "sm", "lg", "secondary"
 * @param {object} props - { height: "--row-2", ... }
 * @param {string} componentName
 * @param {string} groupName - "size" or "variant"
 * @param {Map<string, string>} tokens
 * @returns {string}
 */
function renderModifierTable(modifierName, props, componentName, groupName, tokens) {
  const rows = [];

  for (const [prop, defaultVal] of Object.entries(props)) {
    const varName =
      groupName === 'variant' || groupName === 'background'
        ? `--${componentName}-${modifierName}-${prop}`
        : `--${componentName}-${prop}-${modifierName}`;
    const resolved = resolveToken(defaultVal, tokens);
    rows.push(`<tr>
      <td><code>${varName}</code></td>
      <td><code>${escapeHtml(defaultVal)}</code></td>
      <td><code>${escapeHtml(resolved)}</code></td>
    </tr>`);
  }

  return `<h5>${modifierName}</h5>
<table class="ui-table ui-table--compact">
  <thead><tr><th>Variable</th><th>Default</th><th>Value</th></tr></thead>
  <tbody>
    ${rows.join('\n    ')}
  </tbody>
</table>`;
}

/**
 * Render base vars as a table
 * @param {object} props - { height: "--row-2", ... }
 * @param {string} componentName
 * @param {Map<string, string>} tokens
 * @returns {string}
 */
function renderBaseTable(props, componentName, tokens) {
  const rows = [];

  for (const [prop, defaultVal] of Object.entries(props)) {
    const resolved = resolveToken(defaultVal, tokens);
    rows.push(`<tr>
      <td><code>--${componentName}-${prop}</code></td>
      <td><code>${escapeHtml(defaultVal)}</code></td>
      <td><code>${escapeHtml(resolved)}</code></td>
    </tr>`);
  }

  return `<table class="ui-table ui-table--compact">
  <thead><tr><th>Variable</th><th>Default</th><th>Value</th></tr></thead>
  <tbody>
    ${rows.join('\n    ')}
  </tbody>
</table>`;
}

/**
 * Render vars group for tab panel (no outer heading)
 * @param {string} groupName - "base", "size", "variant"
 * @param {object} groupVars - The vars for this group
 * @param {string} componentName
 * @param {Map<string, string>} tokens
 * @returns {string}
 */
function renderVarsGroup(groupName, groupVars, componentName, tokens) {
  if (groupName === 'base') {
    return renderBaseTable(groupVars, componentName, tokens);
  }

  // Size/variant groups have modifiers - render with sub-headings
  const modifierTables = [];
  for (const [modifierName, props] of Object.entries(groupVars)) {
    modifierTables.push(renderModifierTable(modifierName, props, componentName, groupName, tokens));
  }

  return modifierTables.join('\n');
}

/**
 * Renders a Section to HTML string
 * @param {import('../src/types/docs-schema').Section} section
 * @param {object} options
 * @param {object} [options.vars] - All vars from API
 * @param {string} [options.componentName] - Component name
 * @param {boolean} [options.isFirstSection] - Whether this is the first section
 * @param {string} [options.customizationHtml] - HTML for customization tab (first section only)
 * @param {string} [options.cssPropsHtml] - HTML for CSS props tab (first section only)
 * @returns {string}
 */
export function renderSection(section, options = {}) {
  const { title, description, examples, data } = section;
  const { vars, componentName, isFirstSection, customizationHtml, cssPropsHtml } = options;

  const parts = [];

  if (title) {
    parts.push(`<h3>${escapeHtml(title)}</h3>`);
  }

  if (description) {
    parts.push(`<p>${escapeHtml(description)}</p>`);
  }

  // Generate theming HTML if matching vars group exists
  let themingHtml = null;
  const varsGroup = getVarsGroupForSection(title || '', vars, isFirstSection);
  if (varsGroup && componentName) {
    if (!tokensCache) {
      tokensCache = parseTokens();
    }
    themingHtml = renderVarsGroup(
      varsGroup.groupName,
      varsGroup.groupVars,
      componentName,
      tokensCache,
    );
  }

  // Render examples - first example gets CSS props and customization tabs, all get data
  examples.forEach((example, index) => {
    const exampleOptions = { data };
    if (index === 0) {
      if (customizationHtml) exampleOptions.customizationHtml = customizationHtml;
      if (cssPropsHtml) exampleOptions.cssPropsHtml = cssPropsHtml;
    }
    parts.push(renderExample(example, exampleOptions));
  });

  return parts.join('\n');
}

/**
 * Render customization tokens as a table (for tab content, no heading)
 * @param {import('../src/types/docs-schema').CustomizationToken[]} tokens
 * @returns {string}
 */
export function renderCustomization(tokens) {
  if (!tokens || tokens.length === 0) return '';

  const rows = tokens
    .map(
      (t) =>
        `<tr><td><code>${escapeHtml(t.token)}</code></td><td><code>${escapeHtml(t.default)}</code></td><td>${escapeHtml(t.description)}</td></tr>`,
    )
    .join('\n      ');

  return `<p>Override these CSS custom properties to customize the component.</p>
  <table class="ui-table">
    <thead>
      <tr><th>Token</th><th>Default</th><th>Description</th></tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>`;
}

/**
 * Renders a full ComponentDoc to HTML string
 * @param {import('../src/types/docs-schema').ComponentDoc} doc
 * @returns {string}
 */
export function renderDoc(doc) {
  const { id, type, title, description, sections, vars, componentName, customization, api } = doc;

  // Pre-render customization HTML for passing to first section
  const customizationHtml = renderCustomization(customization);

  // Pre-render CSS props table from API
  const cssPropsHtml = renderCssPropsTable(api);

  const sectionHtml = sections
    .map((section, index) =>
      renderSection(section, {
        vars,
        componentName,
        isFirstSection: index === 0,
        customizationHtml: index === 0 ? customizationHtml : null,
        cssPropsHtml: index === 0 ? cssPropsHtml : null,
      }),
    )
    .join('\n\n');

  return `<section id="${escapeAttr(id)}" class="ui-docs-section" data-type="${type}">
  <h2>${escapeHtml(title)}</h2>
  <p>${escapeHtml(description)}</p>

  ${sectionHtml}
</section>`;
}

/**
 * Escape HTML
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Render CSS props table from API (grouped by modifier type)
 * @param {object} api - Component API definition
 * @returns {string}
 */
export function renderCssPropsTable(api) {
  if (!api?.name) return '';
  const sections = [];
  const name = api.name;

  // Base class section
  sections.push(`<h4>Base</h4>
<table class="ui-table ui-table--compact">
  <thead><tr><th>Class</th><th>Description</th></tr></thead>
  <tbody><tr><td><code>.ui-${name}</code></td><td>Base class</td></tr></tbody>
</table>`);

  // Modifier groups
  if (api.modifiers) {
    for (const [groupName, def] of Object.entries(api.modifiers)) {
      const heading = groupName.charAt(0).toUpperCase() + groupName.slice(1);

      if (def.values) {
        // Array modifiers: size, variant
        const rows = def.values
          .map(
            (val) =>
              `<tr><td><code>.ui-${name}--${val}</code></td><td>${escapeHtml(val)}</td></tr>`,
          )
          .join('');

        sections.push(`<h4>${escapeHtml(heading)}</h4>
${def.description ? `<p>${escapeHtml(def.description)}</p>` : ''}
<table class="ui-table ui-table--compact">
  <thead><tr><th>Class</th><th>Value</th></tr></thead>
  <tbody>${rows}</tbody>
</table>`);
      } else if (def.type === 'boolean') {
        // Boolean modifiers: loading, disabled
        sections.push(`<h4>${escapeHtml(heading)}</h4>
<table class="ui-table ui-table--compact">
  <thead><tr><th>Class</th><th>Description</th></tr></thead>
  <tbody><tr><td><code>.ui-${name}--${groupName}</code></td><td>${escapeHtml(def.description || groupName)}</td></tr></tbody>
</table>`);
      }
    }
  }

  return sections.join('\n');
}

/**
 * Escape attribute value
 * @param {string} str
 * @returns {string}
 */
function escapeAttr(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
