/**
 * Docs Schema Types
 * Defines the structure for component documentation JSON files
 */

export type DocType = 'token' | 'primitive' | 'component' | 'utility';

export type ComponentGroup =
  | 'actions'
  | 'typography'
  | 'forms'
  | 'data-display'
  | 'feedback'
  | 'overlays'
  | 'disclosure'
  | 'navigation'
  | 'layout';

export interface ExampleItem {
  /** HTML tag name */
  tag: string;
  /** CSS classes */
  class?: string;
  /** Inner text content */
  text?: string;
  /** Inline styles (for token demos) */
  style?: Record<string, string>;
  /** Other HTML attributes */
  attrs?: Record<string, string>;
  /** Nested child elements */
  children?: ExampleItem[];
}

export interface Example {
  /** Layout wrapper class */
  layout?: 'inline' | 'stack' | 'cluster';
  /** Structured example items (preferred) */
  items?: ExampleItem[];
  /** Raw HTML escape hatch for complex cases */
  html?: string;
  /** Code snippet to display (auto-generated if not provided) */
  code?: string;
}

export interface Section {
  /** Section heading (h3) */
  title?: string;
  /** Section description */
  description?: string;
  /** Template data for code examples (Nunjucks) */
  data?: Record<string, unknown>;
  /** Examples to render */
  examples: Example[];
}

/**
 * Component documentation - can inherit from API or define directly
 */
export interface ComponentDoc {
  /** Path to component API definition - if provided, inherits id/title/description */
  api?: string;
  /** Anchor ID for navigation (optional if api provided) */
  id?: string;
  /** Documentation type (optional if api provided, defaults to 'component') */
  type?: DocType;
  /** Component group for navigation hierarchy (only for type='component') */
  group?: ComponentGroup;
  /** Display title (optional if api provided) */
  title?: string;
  /** Component description (optional if api provided) */
  description?: string;
  /** Documentation sections */
  sections: Section[];
}

/**
 * Resolved doc with all required fields (after merging with API)
 */
export interface ResolvedComponentDoc {
  id: string;
  type: DocType;
  group?: ComponentGroup;
  title: string;
  description: string;
  sections: Section[];
}
