// Types for the docgen parser output.
// Matches the existing api.json format for backward compatibility.

export interface CssVar {
  name: string;
  default: string;
  description?: string;
}

export interface Modifier {
  type?: 'boolean';
  values?: string[];
  visibility?: 'internal';
}

export interface ElementDef {
  modifiers?: Record<string, Modifier>;
  visibility?: 'internal';
}

export interface RelatedComponent {
  name: string;
  modifiers?: Record<string, Modifier>;
  elements?: Record<string, ElementDef>;
}

export interface ApiJson {
  $schema: string;
  name: string;
  element: string;
  modifiers: Record<string, Modifier>;
  elements?: Record<string, ElementDef>;
  relatedComponents?: RelatedComponent[];
  cssVars: CssVar[];
}
