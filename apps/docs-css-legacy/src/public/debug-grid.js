/**
 * Grid Alignment Checker
 * Finds elements breaking the 8px vertical rhythm and traces root causes.
 *
 * Usage:
 *   checkGridAlignment()                // Check all
 *   checkGridAlignment('.ui-container') // Check within scope
 *   clearGridHighlights()              // Remove highlights
 *
 * Output shows root causes first, with ancestor chain for context.
 */

(() => {
  const HIGHLIGHT_ATTR = 'data-grid-misaligned';

  const SKIP_SELECTORS = [
    'html',
    'body',
    'main',
    'aside',
    '.ui-sidebar',
    '.ui-main',
    '.ui-app-shell',
    '.ui-drawer',
  ];

  const INLINE_TAGS = new Set([
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
    'BR',
    'WBR',
  ]);

  const SKIP_TAGS = new Set([
    'SCRIPT',
    'STYLE',
    'LINK',
    'META',
    'TITLE',
    'HEAD',
    'SVG',
    'PATH',
    'CIRCLE',
    'RECT',
    'LINE',
    'POLYGON',
    'POLYLINE',
    'ELLIPSE',
    'G',
    'DEFS',
    'USE',
    'SYMBOL',
    'CLIPPATH',
    'MASK',
    'PATTERN',
    'IMAGE',
    'TEXT',
    'TSPAN',
    'TEXTPATH',
    'FOREIGNOBJECT',
  ]);

  function getUnit() {
    const temp = document.createElement('div');
    temp.style.cssText = 'position:absolute;visibility:hidden;width:var(--ui-unit,8px)';
    document.body.appendChild(temp);
    const px = temp.getBoundingClientRect().width || 8;
    document.body.removeChild(temp);
    return px;
  }

  function label(el) {
    const tag = el.tagName.toLowerCase();
    const cls = (el.className?.toString?.() || '').split(' ').filter(Boolean).join('.');
    return cls ? `${tag}.${cls}` : tag;
  }

  function shouldSkip(el) {
    const tag = el.tagName;
    if (SKIP_TAGS.has(tag)) return true;
    if (INLINE_TAGS.has(tag)) return true;
    if (
      SKIP_SELECTORS.some((sel) => {
        try {
          return el.matches(sel);
        } catch {
          return false;
        }
      })
    )
      return true;
    return false;
  }

  function measure(el, unit) {
    const height = el.getBoundingClientRect().height;
    if (height === 0 || height < unit / 2) return null;
    const remainder = height % unit;
    const aligned = remainder < 0.01 || remainder > unit - 0.01;
    return { height, remainder: aligned ? 0 : remainder, aligned };
  }

  // Build ancestor chain from element up to container
  function ancestorChain(el, container, unit) {
    const chain = [];
    let cur = el.parentElement;
    while (cur && cur !== container && cur !== document.body) {
      const m = measure(cur, unit);
      if (m && !m.aligned) {
        chain.push({ el: cur, label: label(cur), height: m.height, offBy: m.remainder });
      }
      cur = cur.parentElement;
    }
    return chain;
  }

  window.checkGridAlignment = (rawSelector) => {
    const selector = typeof rawSelector === 'string' ? rawSelector : 'body';

    const unit = getUnit();
    const container = document.querySelector(selector);
    if (!container) {
      console.error(`"${selector}" not found`);
      return [];
    }

    clearGridHighlights();

    // Pass 1: find all violating elements
    const allViolations = new Map();
    for (const el of container.querySelectorAll('*')) {
      if (shouldSkip(el)) continue;
      const m = measure(el, unit);
      if (m && !m.aligned) {
        allViolations.set(el, { label: label(el), height: m.height, offBy: m.remainder });
      }
    }

    // Pass 2: find root causes — violations with no violating descendants
    const rootCauses = [];
    for (const [el, info] of allViolations) {
      let hasViolatingChild = false;
      for (const child of el.querySelectorAll('*')) {
        if (allViolations.has(child)) {
          hasViolatingChild = true;
          break;
        }
      }
      if (!hasViolatingChild) {
        rootCauses.push({ el, ...info, chain: ancestorChain(el, container, unit) });
      }
    }

    // Highlight root causes (bright) and inherited violations (dim)
    for (const [el] of allViolations) {
      el.setAttribute(HIGHLIGHT_ATTR, 'true');
      el.style.boxShadow = 'inset 0 0 0 1px hsl(0 60% 50% / 0.15)';
    }
    for (const v of rootCauses) {
      v.el.style.boxShadow = 'inset 0 0 0 2px hsl(0 80% 50% / 0.5)';
    }

    // Console output
    console.log('%c Grid Rhythm Check', 'font-size: 14px; font-weight: bold;');
    console.log(
      `Unit: ${unit}px | Scope: ${selector} | Violations: ${allViolations.size} total, ${rootCauses.length} root causes`,
    );

    if (rootCauses.length === 0) {
      console.log('%c All elements on grid', 'color: green; font-weight: bold;');
      return [];
    }

    // Detailed nested output
    for (const v of rootCauses) {
      const expected = Math.round(v.height / unit) * unit;
      const chainStr =
        v.chain.length > 0
          ? `\n    caused by: ${v.chain
              .map((c) => `${c.label} (${c.height}px, off by ${c.offBy.toFixed(2)}px)`)
              .join(' > ')}`
          : '';

      console.log(
        `%c ROOT %c ${v.label} — ${v.height}px (expected ${expected}px, off by ${v.offBy.toFixed(2)}px)${chainStr}`,
        'background: #c00; color: white; padding: 1px 4px; border-radius: 2px;',
        'color: inherit;',
        v.el,
      );
    }

    // Pasteable report
    const lines = rootCauses.map((v) => {
      const expected = Math.round(v.height / unit) * unit;
      let line = `${v.label} — ${v.height}px (expected ${expected}px, off by ${v.offBy.toFixed(2)}px)`;
      if (v.chain.length > 0) {
        line += `\n  ancestors affected: ${v.chain
          .map((c) => `${c.label} (${c.height}px)`)
          .join(' > ')}`;
      }
      return line;
    });

    const report = [
      `Grid rhythm violations — ${rootCauses.length} root causes (${allViolations.size} total affected):`,
      '',
      ...lines,
    ].join('\n');

    console.log('\n--- Copy-paste report ---');
    console.log(report);
    console.log('--- End ---');

    return rootCauses;
  };

  window.clearGridHighlights = () => {
    for (const el of document.querySelectorAll(`[${HIGHLIGHT_ATTR}]`)) {
      el.removeAttribute(HIGHLIGHT_ATTR);
      el.style.boxShadow = '';
    }
  };

  console.log(
    '%c Grid Debug',
    'background: #333; color: #fff; padding: 2px 6px; border-radius: 3px;',
    "checkGridAlignment('.ui-container') | clearGridHighlights()",
  );
})();
