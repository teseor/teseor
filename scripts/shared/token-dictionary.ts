export interface TokenCategory {
  prefix: string;
  cssProperty?: string;
  description: string;
  scales: string[] | null; // null = open-ended (colors, semantic roles)
}

export const TOKEN_DICTIONARY: TokenCategory[] = [
  // Grid
  { prefix: 'unit', description: 'Base grid unit (8px)', scales: null },
  { prefix: 'row', description: 'Row height multiples', scales: ['1', '2', '3', '4', '5', '6'] },

  // Spacing
  {
    prefix: 'space',
    description: 'Spacing scale',
    scales: ['px', 'quarter', 'half', '0', '1', '2', '3', '4', '6', '8'],
  },

  // Color system (open-ended: primary, success, neutral-200, text-muted, etc.)
  { prefix: 'color', description: 'Color tokens', scales: null },

  // Typography — families
  {
    prefix: 'font',
    cssProperty: 'font-family',
    description: 'Font families',
    scales: ['sans', 'mono'],
  },
  {
    prefix: 'font-size',
    description: 'Font size scale',
    scales: ['base', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'],
  },
  {
    prefix: 'font-weight',
    cssProperty: 'font-weight',
    description: 'Font weights',
    scales: ['normal', 'medium', 'semibold', 'bold'],
  },
  { prefix: 'line-height', cssProperty: 'line-height', description: 'Line heights', scales: null },
  {
    prefix: 'letter-spacing',
    cssProperty: 'letter-spacing',
    description: 'Letter spacing',
    scales: ['display', 'body', 'caps'],
  },

  // Visual
  {
    prefix: 'radius',
    description: 'Border radius',
    scales: ['base', 'sm', 'md', 'lg', 'full'],
  },
  {
    prefix: 'border-width',
    description: 'Border widths',
    scales: ['base', 'sm', 'md', 'lg'],
  },
  { prefix: 'shadow', description: 'Box shadows', scales: ['strength', 'sm', 'md', 'lg'] },

  // Layout
  {
    prefix: 'z-index',
    cssProperty: 'z-index',
    description: 'Z-index scale',
    scales: [
      'base',
      'sticky',
      'dropdown',
      'overlay',
      'modal',
      'popover',
      'tooltip',
      'toast',
      'drawer',
      'debug',
    ],
  },

  // Motion
  {
    prefix: 'duration',
    description: 'Animation durations',
    scales: ['instant', 'fast', 'base', 'normal', 'slow', 'slower'],
  },
  {
    prefix: 'ease',
    description: 'Easing functions',
    scales: ['default', 'in', 'out', 'in-out'],
  },

  // State
  { prefix: 'opacity', description: 'State opacity', scales: ['disabled', 'loading'] },
  {
    prefix: 'overlay',
    description: 'Overlay backgrounds',
    scales: ['bg', 'bg-light', 'bg-blur', 'bg-subtle'],
  },

  // Semantic text roles (open-ended: heading-1-size, body-weight, etc.)
  { prefix: 'heading', description: 'Heading text role tokens', scales: null },
  { prefix: 'body', description: 'Body text role tokens', scales: null },
  { prefix: 'body-sm', description: 'Body small text role tokens', scales: null },
  { prefix: 'caption', description: 'Caption text role tokens', scales: null },
  { prefix: 'lead', description: 'Lead text role tokens', scales: null },
  { prefix: 'eyebrow', description: 'Eyebrow text role tokens', scales: null },

  // Component tokens (open-ended: input-height, input-border-width, etc.)
  { prefix: 'input', description: 'Input component tokens', scales: null },
];

// Banned legacy names: old prefix -> new prefix for error messages
export const BANNED_PREFIXES: Record<string, string> = {
  weight: 'font-weight',
  leading: 'line-height',
  tracking: 'letter-spacing',
  spacing: 'space',
};
