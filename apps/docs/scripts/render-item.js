/**
 * Renders an ExampleItem to HTML string
 * @param {import('../src/types/docs-schema').ExampleItem} item
 * @returns {string}
 */
export function renderItem(item) {
  const { tag, class: className, text, style, attrs, children } = item;

  const attrParts = [];

  if (className) {
    attrParts.push(`class="${escapeAttr(className)}"`);
  }

  if (style && Object.keys(style).length > 0) {
    const styleStr = Object.entries(style)
      .map(([k, v]) => `${k}: ${v}`)
      .join('; ');
    attrParts.push(`style="${escapeAttr(styleStr)}"`);
  }

  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value === true || value === '') {
        attrParts.push(key);
      } else {
        attrParts.push(`${key}="${escapeAttr(value)}"`);
      }
    }
  }

  const attrStr = attrParts.length > 0 ? ` ${attrParts.join(' ')}` : '';
  const childrenStr = children ? children.map(renderItem).join('') : '';
  const content = text ? escapeHtml(text) : childrenStr;

  // Self-closing tags
  const selfClosing = ['br', 'hr', 'img', 'input', 'meta', 'link'];
  if (selfClosing.includes(tag) && !content) {
    return `<${tag}${attrStr} />`;
  }

  return `<${tag}${attrStr}>${content}</${tag}>`;
}

/**
 * Escape HTML special characters
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

/**
 * Generate code snippet from items (for auto-generation)
 * @param {import('../src/types/docs-schema').ExampleItem[]} items
 * @returns {string}
 */
export function generateCode(items) {
  return items.map((item) => renderItem(item)).join('\n');
}
