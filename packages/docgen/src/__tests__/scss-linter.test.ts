import { describe, expect, it } from 'vitest';
import {
  lintScss,
  noBareDeclarations,
  noDerivedVars,
  noScssInStyles,
  parseScss,
  requireBemSelectors,
  requireComponentAnnotation,
  requireDescOnVars,
  requireElementAnnotation,
  requireLayerStructure,
  requireModifierAnnotations,
  requireScssFallback,
  requireTokenScope,
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
    it('passes when public tokens have @desc', () => {
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

    it('fails when a public token is missing @desc', () => {
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
    });

    it('skips global alias vars (no component token)', () => {
      const scss = `
// @component button
@layer components.tokens {
  .button {
    --_space-1: var(--ui-space-1, 8px);
    --_duration-fast: var(--ui-duration-fast, 150ms);
    --_ease-default: var(--ui-ease-default, ease);
  }
}`;
      const root = parseScss(scss);
      expect(requireDescOnVars(root)).toEqual([]);
    });

    it('skips derived/internal-only vars', () => {
      const scss = `
// @component button
@layer components.tokens {
  .button {
    --_bg: var(--_accent);
    --_bg-hover: color-mix(in oklch, var(--_accent) 80%, black);
    --_circumference: 282.743;
  }
}`;
      const root = parseScss(scss);
      expect(requireDescOnVars(root)).toEqual([]);
    });

    it('skips modifier overrides', () => {
      const scss = `
// @component button
@layer components.tokens {
  .button {
    // @desc Overall height
    --_height: var(--ui-button-height, 32px);
  }
  .button--sm {
    --_height: var(--ui-button-height-sm, 24px);
  }
}`;
      const root = parseScss(scss);
      expect(requireDescOnVars(root)).toEqual([]);
    });

    it('skips child/compound selectors', () => {
      const scss = `
// @component accordion
@layer components.tokens {
  .accordion {
    // @desc Border thickness
    --_border-width: var(--ui-accordion-border-width, 1px);
  }
  .accordion > .disclosure {
    --_border-width: 0;
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
    --_height: var(--ui-button-height, 32px);
  }
}`;
      const root = parseScss(scss);
      expect(requireDescOnVars(root)).toEqual([]);
    });

    it('ignores files without @component', () => {
      const scss = `
@layer components.tokens {
  .button {
    --_height: var(--ui-button-height, 32px);
  }
}`;
      const root = parseScss(scss);
      expect(requireDescOnVars(root)).toEqual([]);
    });
  });

  describe('requireTokenScope', () => {
    it('passes when tokens are scoped to the component', () => {
      const scss = `
// @component badge
@layer components.tokens {
  .badge {
    // @desc Font size
    --_font-size: var(--ui-badge-font-size, var(--ui-font-size-xs, 12px));
  }
}`;
      const root = parseScss(scss);
      expect(requireTokenScope(root)).toEqual([]);
    });

    it('passes global alias tokens', () => {
      const scss = `
// @component badge
@layer components.tokens {
  .badge {
    --_space-1: var(--ui-space-1, 8px);
    --_color-primary: var(--ui-color-primary, blue);
    --_duration-fast: var(--ui-duration-fast, 150ms);
  }
}`;
      const root = parseScss(scss);
      expect(requireTokenScope(root)).toEqual([]);
    });

    it('fails when token uses wrong component scope', () => {
      const scss = `
// @component badge
@layer components.tokens {
  .badge {
    --_font-size: var(--ui-avatar-font-size, var(--ui-font-size-xs, 12px));
  }
}`;
      const root = parseScss(scss);
      const diags = requireTokenScope(root);
      expect(diags).toHaveLength(1);
      expect(diags[0].message).toContain('avatar-font-size');
      expect(diags[0].message).toContain('not scoped to @component badge');
    });

    it('fails on malformed double-dash token names', () => {
      const scss = `
// @component badge
@layer components.tokens {
  .badge {
    --_font-size: var(--ui--font-size, 12px);
  }
}`;
      const root = parseScss(scss);
      const diags = requireTokenScope(root);
      expect(diags).toHaveLength(1);
      expect(diags[0].message).toContain('malformed');
    });

    it('skips without @component', () => {
      const scss = `
@layer components.tokens {
  .badge {
    --_font-size: var(--ui-avatar-font-size, 12px);
  }
}`;
      const root = parseScss(scss);
      expect(requireTokenScope(root)).toEqual([]);
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

  describe('noDerivedVars', () => {
    it('passes when no --_ refs in values', () => {
      const scss = `
// @component button
@layer components.tokens {
  .button {
    --_bg: var(--ui-button-bg, var(--ui-color-primary, #{t.$color-primary}));
  }
}`;
      const root = parseScss(scss);
      expect(noDerivedVars(root)).toEqual([]);
    });

    it('fails when value references var(--_other)', () => {
      const scss = `
// @component button
@layer components.tokens {
  .button {
    --_accent: var(--ui-button-accent, var(--ui-color-primary, #{t.$color-primary}));
    --_bg: var(--_accent);
  }
}`;
      const root = parseScss(scss);
      const diags = noDerivedVars(root);
      expect(diags).toHaveLength(1);
      expect(diags[0].message).toContain('--_bg');
      expect(diags[0].message).toContain('references another internal var');
    });

    it('fails on color-mix with --_ ref', () => {
      const scss = `
// @component button
@layer components.tokens {
  .button {
    --_bg-hover: color-mix(in oklch, var(--_accent) 80%, black);
  }
}`;
      const root = parseScss(scss);
      const diags = noDerivedVars(root);
      expect(diags).toHaveLength(1);
      expect(diags[0].message).toContain('--_bg-hover');
    });

    it('ignores vars outside tokens layer', () => {
      const scss = `
@layer components.styles {
  .button {
    --_bg: var(--_accent);
  }
}`;
      const root = parseScss(scss);
      expect(noDerivedVars(root)).toEqual([]);
    });
  });

  describe('requireScssFallback', () => {
    it('passes when SCSS interpolation is present', () => {
      const scss = `
// @component button
@layer components.tokens {
  .button {
    --_height: var(--ui-button-height, var(--ui-row-2, #{t.$row-2}));
  }
}`;
      const root = parseScss(scss);
      expect(requireScssFallback(root)).toEqual([]);
    });

    it('fails when last fallback is hardcoded', () => {
      const scss = `
// @component button
@layer components.tokens {
  .button {
    --_height: var(--ui-button-height, var(--ui-row-2, 32px));
  }
}`;
      const root = parseScss(scss);
      const diags = requireScssFallback(root);
      expect(diags).toHaveLength(1);
      expect(diags[0].message).toContain('--_height');
      expect(diags[0].message).toContain('SCSS fallback');
    });

    it('skips vars without component tokens', () => {
      const scss = `
// @component button
@layer components.tokens {
  .button {
    --_space-1: var(--ui-space-1, 8px);
  }
}`;
      const root = parseScss(scss);
      expect(requireScssFallback(root)).toEqual([]);
    });

    it('skips literal overrides (0, transparent)', () => {
      const scss = `
// @component button
@layer components.tokens {
  .button--ghost {
    --_bg: transparent;
  }
}`;
      const root = parseScss(scss);
      expect(requireScssFallback(root)).toEqual([]);
    });
  });

  describe('noScssInStyles', () => {
    it('passes when styles use only var() references', () => {
      const scss = `
@layer components.styles {
  .button {
    height: var(--_height);
    gap: var(--ui-space-1);
  }
}`;
      const root = parseScss(scss);
      expect(noScssInStyles(root)).toEqual([]);
    });

    it('fails when SCSS interpolation appears in styles', () => {
      const scss = `
@layer components.styles {
  .button {
    gap: var(--ui-space-1, #{t.$space-1});
  }
}`;
      const root = parseScss(scss);
      const diags = noScssInStyles(root);
      expect(diags).toHaveLength(1);
      expect(diags[0].message).toContain('SCSS interpolation in styles layer');
    });

    it('allows SCSS in tokens layer', () => {
      const scss = `
@layer components.tokens {
  .button {
    --_height: var(--ui-button-height, var(--ui-row-2, #{t.$row-2}));
  }
}`;
      const root = parseScss(scss);
      expect(noScssInStyles(root)).toEqual([]);
    });
  });

  describe('requireLayerStructure', () => {
    it('passes for valid component structure (tokens then styles)', () => {
      const scss = `
// @component button
// @element button
@layer components.tokens { .button { --_h: 32px; } }
@layer components.styles { .button { height: var(--_h); } }
`;
      const root = parseScss(scss);
      expect(requireLayerStructure(root)).toEqual([]);
    });

    it('passes for valid layout structure (primitives only)', () => {
      const scss = `
// @component box
// @element div
@layer primitives { .box { display: block; } }
`;
      const root = parseScss(scss);
      expect(requireLayerStructure(root)).toEqual([]);
    });

    it('fails when no @layer blocks found', () => {
      const root = parseScss('.button { color: red; }');
      const diags = requireLayerStructure(root);
      expect(diags).toHaveLength(1);
      expect(diags[0].message).toContain('no @layer blocks found');
    });

    it('fails when components.tokens is after components.styles', () => {
      const scss = `
@layer components.styles { .button { height: 32px; } }
@layer components.tokens { .button { --_h: 32px; } }
`;
      const root = parseScss(scss);
      const diags = requireLayerStructure(root);
      expect(diags.some((d) => d.message.includes('must appear before'))).toBe(true);
    });

    it('fails when components.tokens is missing', () => {
      const scss = `@layer components.styles { .button { height: 32px; } }`;
      const root = parseScss(scss);
      const diags = requireLayerStructure(root);
      expect(diags.some((d) => d.message.includes('missing @layer components.tokens'))).toBe(true);
    });

    it('fails when components.styles is missing', () => {
      const scss = `@layer components.tokens { .button { --_h: 32px; } }`;
      const root = parseScss(scss);
      const diags = requireLayerStructure(root);
      expect(diags.some((d) => d.message.includes('missing @layer components.styles'))).toBe(true);
    });

    it('fails for unexpected layer name', () => {
      const scss = `@layer components.foo { .button { color: red; } }`;
      const root = parseScss(scss);
      const diags = requireLayerStructure(root);
      expect(diags.some((d) => d.message.includes('unexpected @layer components.foo'))).toBe(true);
    });

    it('fails when mixing component and layout layers', () => {
      const scss = `
@layer components.tokens { .button { --_h: 32px; } }
@layer primitives { .box { display: block; } }
`;
      const root = parseScss(scss);
      const diags = requireLayerStructure(root);
      expect(diags.some((d) => d.message.includes('mixes'))).toBe(true);
    });
  });

  describe('noBareDeclarations', () => {
    it('passes when all rules are inside @layer', () => {
      const scss = `
@use '../config/tokens/variables' as t;
// @component button
// @element button
@layer components.tokens { .button { --_h: 32px; } }
@layer components.styles { .button { height: var(--_h); } }
`;
      const root = parseScss(scss);
      expect(noBareDeclarations(root)).toEqual([]);
    });

    it('allows @use and @forward outside @layer', () => {
      const scss = `
@use '../config/tokens/variables' as t;
@forward '../shared';
@layer primitives { .box { display: block; } }
`;
      const root = parseScss(scss);
      expect(noBareDeclarations(root)).toEqual([]);
    });

    it('allows @property outside @layer', () => {
      const scss = `
@property --ui-progress-value {
  syntax: "<percentage>";
  inherits: false;
  initial-value: 0%;
}
@layer components.tokens { .progress { --_h: 4px; } }
@layer components.styles { .progress { height: var(--_h); } }
`;
      const root = parseScss(scss);
      expect(noBareDeclarations(root)).toEqual([]);
    });

    it('fails when a selector rule is outside @layer', () => {
      const scss = `
@layer components.tokens { .button { --_h: 32px; } }
.button { height: 32px; }
`;
      const root = parseScss(scss);
      const diags = noBareDeclarations(root);
      expect(diags).toHaveLength(1);
      expect(diags[0].message).toContain('must be inside an @layer block');
    });

    it('fails when @keyframes is outside @layer', () => {
      const scss = `
@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
@layer components.tokens { .spinner { --_s: 24px; } }
`;
      const root = parseScss(scss);
      const diags = noBareDeclarations(root);
      expect(diags).toHaveLength(1);
      expect(diags[0].message).toContain('@keyframes');
    });

    it('allows comments outside @layer', () => {
      const scss = `
// This is a comment
// @component button
// @element button
@layer components.tokens { .button { --_h: 32px; } }
@layer components.styles { .button { height: var(--_h); } }
`;
      const root = parseScss(scss);
      expect(noBareDeclarations(root)).toEqual([]);
    });
  });

  describe('requireBemSelectors', () => {
    it('passes for valid BEM selectors', () => {
      const scss = `
// @component button
// @element button
@layer components.tokens { .button { --_h: 32px; } }
@layer components.styles {
  .button { height: var(--_h); }
  .button--ghost { background: transparent; }
  .button__icon { flex-shrink: 0; }
  .button__icon--start { order: -1; }
}
`;
      const root = parseScss(scss);
      expect(requireBemSelectors(root)).toEqual([]);
    });

    it('passes for related component selectors', () => {
      const scss = `
// @component accordion
// @element div
// @related disclosure
@layer components.styles {
  .accordion { display: flex; }
  .accordion > .disclosure { border: 0; }
  .disclosure__trigger { cursor: pointer; }
}
`;
      const root = parseScss(scss);
      expect(requireBemSelectors(root)).toEqual([]);
    });

    it('passes for SCSS nesting with &', () => {
      const scss = `
// @component tabs
// @element div
@layer components.styles {
  .tabs__tab {
    cursor: pointer;
    &--active { color: blue; }
    &:hover { opacity: 0.8; }
    &::after { content: ''; }
  }
}
`;
      const root = parseScss(scss);
      expect(requireBemSelectors(root)).toEqual([]);
    });

    it('passes for SCSS interpolation in selectors', () => {
      const scss = `
// @component button
// @element button
@layer components.tokens {
  .button--#{$name} { --_h: 24px; }
}
`;
      const root = parseScss(scss);
      expect(requireBemSelectors(root)).toEqual([]);
    });

    it('fails for selectors from a different component', () => {
      const scss = `
// @component button
// @element button
@layer components.styles {
  .button { height: 32px; }
  .card { padding: 16px; }
}
`;
      const root = parseScss(scss);
      const diags = requireBemSelectors(root);
      expect(diags).toHaveLength(1);
      expect(diags[0].message).toContain('.card');
      expect(diags[0].message).toContain('not a valid BEM selector');
    });

    it('fails for non-BEM class names', () => {
      const scss = `
// @component button
// @element button
@layer components.styles {
  .button { height: 32px; }
  .btn-icon { flex-shrink: 0; }
}
`;
      const root = parseScss(scss);
      const diags = requireBemSelectors(root);
      expect(diags).toHaveLength(1);
      expect(diags[0].message).toContain('.btn-icon');
    });

    it('skips pseudo-class and attribute selectors', () => {
      const scss = `
// @component input
// @element input
@layer components.styles {
  .input { height: 32px; }
  .input:focus-visible { outline: 2px solid blue; }
  .input[aria-disabled="true"] { opacity: 0.5; }
}
`;
      const root = parseScss(scss);
      expect(requireBemSelectors(root)).toEqual([]);
    });

    it('skips without @component', () => {
      const scss = `
@layer components.styles {
  .anything { color: red; }
}
`;
      const root = parseScss(scss);
      expect(requireBemSelectors(root)).toEqual([]);
    });
  });

  describe('lintScss (all rules)', () => {
    it('returns no diagnostics for a well-formed component', () => {
      const scss = `
// @component button
// @element button

@layer components.tokens {
  .button {
    // @desc Overall height
    --_height: var(--ui-button-height, var(--ui-row-2, #{t.$row-2}));
    // @desc Background color
    --_bg: var(--ui-button-bg, var(--ui-color-primary, #{t.$color-primary}));
  }
  // @modifier size
  .button--sm {
    --_height: var(--ui-button-height-sm, calc(var(--ui-row, #{t.$row}) * 1.5));
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
    --_height: var(--ui-button-height, 32px);
  }
}
`;
      const root = parseScss(scss);
      const diags = lintScss(root);
      // Missing @component, @element — @desc not checked without @component
      expect(diags.length).toBeGreaterThanOrEqual(2);
    });
  });
});
