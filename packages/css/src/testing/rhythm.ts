import type { Page } from '@playwright/test';

// Elements that are fluid containers (viewport-dependent)
const SKIP_SELECTORS = [
  'html',
  'body',
  'main',
  'aside',
  '.ui-sidebar',
  '.ui-main',
  '.ui-app-shell',
  '.ui-drawer', // Fluid panel - adapts to container/viewport
];

// Inline elements that don't follow grid
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
  'BR',
  'WBR',
];

export interface RhythmViolation {
  selector: string;
  height: number;
  expected: number;
  offBy: number;
}

/**
 * Validates that all elements in a component follow the 8px grid rhythm
 * Throws an error if violations are found
 */
export async function validateGridRhythm(
  page: Page,
  componentName: string,
): Promise<RhythmViolation[]> {
  const violations = await page.evaluate(
    ({ skipSelectors, inlineTags, component }) => {
      // Get unit from CSS custom property (default 8px)
      // Note: PostCSS prefixes --unit to --ui-unit in compiled CSS
      const temp = document.createElement('div');
      temp.style.cssText = 'position:absolute;visibility:hidden;width:var(--ui-unit, 8px)';
      document.body.appendChild(temp);
      const unit = temp.getBoundingClientRect().width || 8;
      document.body.removeChild(temp);

      const results: Array<{ selector: string; height: number; expected: number; offBy: number }> =
        [];

      // Target component elements
      const selector = `.ui-${component}, .ui-${component} *`;
      const elements = document.querySelectorAll(selector);

      for (const el of elements) {
        const tagName = el.tagName;

        // Skip script, style, SVG internals, etc.
        const upperTag = tagName.toUpperCase();
        if (
          [
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
          ].includes(upperTag)
        )
          continue;

        // Skip inline elements
        if (inlineTags.includes(tagName)) continue;

        // Skip BEM element children (__element) - only check blocks and modifiers
        const classes = el.className?.toString?.() || '';
        if (classes.includes('__')) continue;

        // Skip fluid containers
        if (skipSelectors.some((sel) => el.matches(sel))) continue;

        const height = el.getBoundingClientRect().height;
        // Skip zero-height and decorative lines (borders, dividers < half unit)
        if (height === 0 || height < unit / 2) continue;

        const remainder = height % unit;
        const isAligned = remainder < 0.5 || remainder > unit - 0.5;

        if (!isAligned) {
          const firstClass = classes.split(' ')[0];
          results.push({
            selector: `${tagName.toLowerCase()}${firstClass ? `.${firstClass}` : ''}`,
            height: Math.round(height * 10) / 10,
            expected: Math.round(height / unit) * unit,
            offBy: Math.round(remainder * 10) / 10,
          });
        }
      }

      return results;
    },
    { skipSelectors: SKIP_SELECTORS, inlineTags: INLINE_TAGS, component: componentName },
  );

  if (violations.length > 0) {
    console.log(`Grid rhythm violations in ${componentName}:`);
    console.table(violations);
    throw new Error(
      `Grid rhythm violations in ${componentName}:\n${JSON.stringify(violations, null, 2)}`,
    );
  }

  return violations;
}
