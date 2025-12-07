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
 * @returns {string}
 */
export function renderSection(section, options = {}) {
  const { title, description, examples, data } = section;
  const { vars, componentName, isFirstSection } = options;

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

  // Render examples - first example gets theming tab, all get data
  examples.forEach((example, index) => {
    const exampleOptions = { data };
    if (index === 0 && themingHtml) {
      exampleOptions.themingHtml = themingHtml;
    }
    parts.push(renderExample(example, exampleOptions));
  });

  return parts.join('\n');
}

/**
 * Renders a full ComponentDoc to HTML string
 * @param {import('../src/types/docs-schema').ComponentDoc} doc
 * @returns {string}
 */
export function renderDoc(doc) {
  const { id, type, title, description, sections, vars, componentName } = doc;

  const sectionHtml = sections
    .map((section, index) =>
      renderSection(section, {
        vars,
        componentName,
        isFirstSection: index === 0,
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
