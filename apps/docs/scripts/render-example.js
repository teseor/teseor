import { generateCode, renderItem } from './render-item.js';

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
 * @returns {string}
 */
export function renderExample(example) {
  const { layout, items, html, code } = example;

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

  // Generate code snippet
  const codeSnippet = code || (items ? generateCode(items) : html || '');
  const escapedCode = escapeHtml(codeSnippet);

  return `<div class="ui-docs-example">
  ${previewHtml}
</div>
<pre class="ui-docs-code"><code>${escapedCode}</code></pre>`;
}

/**
 * Escape HTML for code display
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
