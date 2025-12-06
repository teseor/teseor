/**
 * Grid Alignment Checker
 * Run in browser console to find elements not aligned to the grid
 *
 * Usage:
 *   checkGridAlignment()                    // Check all elements
 *   checkGridAlignment({ color: 'blue' })   // Custom highlight color
 *   checkGridAlignment({ selector: 'main' }) // Check only within main
 *   clearGridHighlights()                   // Remove highlights
 */

(() => {
  const HIGHLIGHT_ATTR = 'data-grid-misaligned';

  window.checkGridAlignment = (options = {}) => {
    const {
      color = 'hsl(0 80% 50% / 0.3)',
      selector = 'body',
      unit = null, // auto-detect from CSS if not provided
    } = options;

    // Get the base unit from CSS custom property
    const root = document.documentElement;
    const computedUnit =
      unit || Number.parseFloat(getComputedStyle(root).getPropertyValue('--unit')) || 8;

    console.log('%c Grid Alignment Check', 'font-size: 16px; font-weight: bold;');
    console.log(`Base unit: ${computedUnit}px`);
    console.log('─'.repeat(50));

    const container = document.querySelector(selector);
    if (!container) {
      console.error(`Selector "${selector}" not found`);
      return;
    }

    const allElements = container.querySelectorAll('*');
    const misaligned = [];

    // Inline elements to skip (they don't affect block layout)
    const INLINE_TAGS = [
      'STRONG',
      'B',
      'EM',
      'I',
      'SMALL',
      'SPAN',
      'A',
      'CODE',
      'ABBR',
      'CITE',
      'Q',
      'SUB',
      'SUP',
      'MARK',
    ];

    // Clear previous highlights
    clearGridHighlights();

    for (const el of allElements) {
      // Skip script, style, hidden, and inline elements
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'LINK') continue;
      if (INLINE_TAGS.includes(el.tagName)) continue;

      const rect = el.getBoundingClientRect();
      const height = rect.height;

      // Skip zero-height elements
      if (height === 0) continue;

      const remainder = height % computedUnit;
      const isAligned = remainder < 0.5 || remainder > computedUnit - 0.5; // Allow 0.5px tolerance

      if (!isAligned) {
        el.setAttribute(HIGHLIGHT_ATTR, 'true');
        el.style.setProperty('--grid-debug-color', color);
        el.style.boxShadow = `inset 0 0 0 2px var(--grid-debug-color, ${color})`;

        misaligned.push({
          element: el,
          tag: el.tagName.toLowerCase(),
          classes: el.className,
          height: height,
          remainder: remainder,
          expected: Math.round(height / computedUnit) * computedUnit,
        });
      }
    }

    // Output results
    if (misaligned.length === 0) {
      console.log('%c✓ All elements are grid-aligned!', 'color: green; font-weight: bold;');
    } else {
      console.log(
        `%c✗ Found ${misaligned.length} misaligned elements:`,
        'color: red; font-weight: bold;',
      );
      console.log('');

      // Group by tag
      const byTag = {};
      for (const item of misaligned) {
        if (!byTag[item.tag]) byTag[item.tag] = [];
        byTag[item.tag].push(item);
      }

      for (const [tag, items] of Object.entries(byTag)) {
        console.groupCollapsed(`${tag} (${items.length})`);
        for (const item of items) {
          console.log(
            `%c${item.height.toFixed(1)}px%c -> should be %c${item.expected}px%c (off by ${item.remainder.toFixed(1)}px)`,
            'color: red; font-weight: bold;',
            'color: inherit;',
            'color: green;',
            'color: inherit;',
            item.element,
          );
        }
        console.groupEnd();
      }

      console.log('');
      console.log('─'.repeat(50));
      console.table(
        misaligned.map((m) => ({
          tag: m.tag,
          class: m.classes.toString().slice(0, 30) || '(none)',
          height: `${m.height.toFixed(1)}px`,
          'off by': `${m.remainder.toFixed(1)}px`,
          expected: `${m.expected}px`,
        })),
      );
    }

    return misaligned;
  };

  window.clearGridHighlights = () => {
    for (const el of document.querySelectorAll(`[${HIGHLIGHT_ATTR}]`)) {
      el.removeAttribute(HIGHLIGHT_ATTR);
      el.style.removeProperty('--grid-debug-color');
      el.style.boxShadow = '';
    }
    console.log('Grid highlights cleared');
  };

  // Also expose a function to highlight specific elements
  window.highlightElement = (selector, color = 'hsl(200 80% 50% / 0.5)') => {
    const elements = document.querySelectorAll(selector);
    for (const el of elements) {
      el.setAttribute(HIGHLIGHT_ATTR, 'true');
      el.style.boxShadow = `inset 0 0 0 2px ${color}`;
    }
    console.log(`Highlighted ${elements.length} elements matching "${selector}"`);
  };

  console.log(
    '%c Grid Debug Tools Loaded',
    'background: #333; color: #fff; padding: 4px 8px; border-radius: 4px;',
  );
  console.log(
    'Commands: checkGridAlignment(), clearGridHighlights(), highlightElement(selector, color)',
  );
})();
