export interface CssVar {
  name: string;
  default: string;
  description?: string;
}

export interface ModifierDef {
  values?: string[];
  type?: 'boolean';
}

export interface ElementDef {
  modifiers?: Record<string, ModifierDef>;
}

export interface RelatedComponent {
  name: string;
  modifiers?: Record<string, ModifierDef>;
  elements?: Record<string, ElementDef>;
}

export interface ApiSchema {
  $schema?: string;
  name: string;
  element?: string;
  type?: string;
  modifiers?: Record<string, ModifierDef>;
  elements?: Record<string, ElementDef>;
  relatedComponents?: RelatedComponent[];
  cssVars?: CssVar[];
  utilities?: string[];
}
