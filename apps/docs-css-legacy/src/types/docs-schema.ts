/**
 * Docs Schema Types
 * Defines the structure for component documentation
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

export interface CustomizationToken {
  /** CSS custom property name (e.g., "--ui-button-height") */
  token: string;
  /** Default value (e.g., "var(--ui-row-2)") */
  default: string;
  /** Description of what this token controls */
  description: string;
}

/**
 * Resolved doc with all required fields (after parsing HTML docs)
 */
export interface ResolvedComponentDoc {
  id: string;
  type: DocType;
  group?: ComponentGroup;
  title: string;
  description: string;
  sections: {
    title: string;
    examples: { previewHtml: string; codeHtml: string }[];
  }[];
  customization?: CustomizationToken[];
}
