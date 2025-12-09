import { generateCode, renderItem } from './render-item.js';
import { processTemplate } from './template-processor.js';

/**
 * Layout class mapping
 */
const LAYOUT_CLASSES = {
  inline: '',
  stack: 'ui-stack ui-stack--sm',
  cluster: 'ui-cluster ui-cluster--md',
};

/**
 * Renders an Example to HTML string
 * @param {import('../src/types/docs-schema').Example} example
 * @param {object} [options]
 * @param {string} [options.customizationHtml] - Optional customization HTML to add as tab
 * @param {string} [options.cssPropsHtml] - Optional CSS props HTML to replace HTML tab
 * @param {object} [options.data] - Template data for code examples
 * @returns {string}
 */
export function renderExample(example, options = {}) {
  const { layout, items, html, code } = example;
  const { customizationHtml, cssPropsHtml, data } = options;

  let previewHtml = '';

  // Option A: Structured items
  if (items && items.length > 0) {
    const itemsHtml = items.map(renderItem).join('\n    ');

    if (layout && LAYOUT_CLASSES[layout]) {
      previewHtml = `<div class="${LAYOUT_CLASSES[layout]}">\n    ${itemsHtml}\n  </div>`;
    } else {
      previewHtml = itemsHtml;
    }
  }
  // Option B: Raw HTML escape hatch
  else if (html) {
    previewHtml = html;
  }

  // Generate code snippet - process templates if data provided
  let codeSnippet = code || (items ? generateCode(items) : html || '');
  if (data && Object.keys(data).length > 0) {
    codeSnippet = processTemplate(codeSnippet, data);
  }
  const escapedCode = escapeHtml(codeSnippet);

  // Build tabs - CSS tab (props if available, else code), optional Customization
  const cssTabLabel = cssPropsHtml ? 'CSS' : 'HTML';
  const cssTabContent =
    cssPropsHtml || `<pre class="ui-code-block"><code>${escapedCode}</code></pre>`;

  const customizationTab = customizationHtml
    ? '<button class="ui-tabs__tab">Customization</button>'
    : '';
  const customizationPanel = customizationHtml
    ? `<div class="ui-tabs__panel">\n    ${customizationHtml}\n  </div>`
    : '';

  return `<div class="ui-tabs ui-mb-2">
  <div class="ui-tabs__list">
    <button class="ui-tabs__tab ui-tabs__tab--active">Preview</button>
    <button class="ui-tabs__tab">${cssTabLabel}</button>
    ${customizationTab}
  </div>
  <div class="ui-tabs__panel ui-tabs__panel--active">
    ${previewHtml}
  </div>
  <div class="ui-tabs__panel">
    ${cssTabContent}
  </div>
  ${customizationPanel}
</div>`;
}

/**
 * Escape HTML for code display
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
