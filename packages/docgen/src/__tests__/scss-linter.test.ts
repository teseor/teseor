import { describe, expect, it } from 'vitest';
import {
  lintScss,
  parseScss,
  requireComponentAnnotation,
  requireDescOnVars,
  requireElementAnnotation,
  requireModifierAnnotations,
} from '../scss-linter';

describe('scss-linter', () => {
  describe('requireComponentAnnotation', () => {
    it('passes when @component is present', () => {
      const root = parseScss('// @component button\n.button { color: red; }');
      expect(requireComponentAnnotation(root)).toEqual([]);
    });

    it('fails when @component is missing', () => {
      const root = parseScss('.button { color: red; }');
      const diags = requireComponentAnnotation(root);
      expect(diags).toHaveLength(1);
      expect(diags[0].message).toContain('missing @component');
    });
  });

  describe('requireElementAnnotation', () => {
    it('passes when @element is present', () => {
      const root = parseScss('// @element button\n.button { color: red; }');
      expect(requireElementAnnotation(root)).toEqual([]);
    });

    it('fails when @element is missing', () => {
      const root = parseScss('.button { color: red; }');
      const diags = requireElementAnnotation(root);
      expect(diags).toHaveLength(1);
      expect(diags[0].message).toContain('missing @element');
    });
  });

  describe('requireDescOnVars', () => {
    it('passes when component tokens have @desc', () => {
      const scss = `
// @component button
@layer components.tokens {
  .button {
    // @desc Overall height
    --_height: var(--ui-button-height, var(--ui-row-2, 32px));
    // @desc Horizontal padding
    --_padding-x: var(--ui-button-padding-x, var(--ui-space-2, 16px));
  }
}`;
      const root = parseScss(scss);
      expect(requireDescOnVars(root)).toEqual([]);
    });

    it('fails when a component token is missing @desc', () => {
      const scss = `
// @component button
@layer components.tokens {
  .button {
    // @desc Overall height
    --_height: var(--ui-button-height, var(--ui-row-2, 32px));
    --_padding-x: var(--ui-button-padding-x, var(--ui-space-2, 16px));
  }
}`;
      const root = parseScss(scss);
      const diags = requireDescOnVars(root);
      expect(diags).toHaveLength(1);
      expect(diags[0].message).toContain('--_padding-x');
      expect(diags[0].message).toContain('missing @desc');
    });

    it('skips global alias vars', () => {
      const scss = `
// @component button
@layer components.tokens {
  .button {
    --_space-1: var(--ui-space-1, 8px);
    --_duration-fast: var(--ui-duration-fast, 150ms);
    --_ease-default: var(--ui-ease-default, ease);
    --_border-width-md: var(--ui-border-width-md, 2px);
  }
}`;
      const root = parseScss(scss);
      expect(requireDescOnVars(root)).toEqual([]);
    });

    it('requires @desc on derived values', () => {
      const scss = `
// @component button
@layer components.tokens {
  .button {
    --_bg: var(--_accent);
    --_bg-hover: color-mix(in oklch, var(--_accent) 80%, black);
  }
}`;
      const root = parseScss(scss);
      const diags = requireDescOnVars(root);
      expect(diags).toHaveLength(2);
    });

    it('skips modifier overrides', () => {
      const scss = `
// @component button
@layer components.tokens {
  .button {
    // @desc Overall height
    --_height: 32px;
  }
  .button--sm {
    --_height: 24px;
  }
}`;
      const root = parseScss(scss);
      expect(requireDescOnVars(root)).toEqual([]);
    });

    it('skips non-token vars', () => {
      const scss = `
// @component button
@layer components.tokens {
  .button {
    --random-var: red;
  }
}`;
      const root = parseScss(scss);
      expect(requireDescOnVars(root)).toEqual([]);
    });

    it('ignores vars outside components.tokens', () => {
      const scss = `
// @component button
@layer components.styles {
  .button {
    --_height: 32px;
  }
}`;
      const root = parseScss(scss);
      expect(requireDescOnVars(root)).toEqual([]);
    });
  });

  describe('requireModifierAnnotations', () => {
    it('passes when modifiers have annotations', () => {
      const scss = `
// @component button
// @element button
// @modifier size
.button--sm { font-size: 12px; }
.button--lg { font-size: 18px; }
// @modifier variant
.button--primary { color: blue; }
`;
      const root = parseScss(scss);
      expect(requireModifierAnnotations(root)).toEqual([]);
    });

    it('fails when modifier classes have no annotation', () => {
      const scss = `
// @component button
// @element button
.button--sm { font-size: 12px; }
`;
      const root = parseScss(scss);
      const diags = requireModifierAnnotations(root);
      expect(diags).toHaveLength(1);
      expect(diags[0].message).toContain('button--sm');
      expect(diags[0].message).toContain('no preceding @modifier');
    });

    it('skips pseudo-class-like selectors', () => {
      const scss = `
// @component button
// @element button
.button--hover { opacity: 0.8; }
.button--focus { outline: 2px solid blue; }
`;
      const root = parseScss(scss);
      expect(requireModifierAnnotations(root)).toEqual([]);
    });

    it('skips when no @component found', () => {
      const scss = '.button--sm { font-size: 12px; }';
      const root = parseScss(scss);
      expect(requireModifierAnnotations(root)).toEqual([]);
    });
  });

  describe('lintScss (all rules)', () => {
    it('returns no diagnostics for a well-formed component', () => {
      const scss = `
// @component button
// @element button

@layer components.tokens {
  .button {
    --_ease-default: var(--ui-ease-default, ease);
    // @desc Overall height
    --_height: var(--ui-button-height, 32px);
  }
  // @modifier size
  .button--sm {
    --_height: 24px;
  }
}

@layer components.styles {
  .button {
    height: var(--_height);
  }
}
`;
      const root = parseScss(scss);
      expect(lintScss(root)).toEqual([]);
    });

    it('reports multiple issues', () => {
      const scss = `
@layer components.tokens {
  .button {
    --_bg: var(--_accent);
  }
}
`;
      const root = parseScss(scss);
      const diags = lintScss(root);
      // Missing @component, @element, @desc on derived var
      expect(diags.length).toBeGreaterThanOrEqual(3);
    });
  });
});
