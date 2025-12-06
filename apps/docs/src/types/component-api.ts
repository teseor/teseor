/**
 * Component API Schema
 * Defines the structure of component API definitions (*.api.json)
 */

/**
 * Modifier definition for enum-based modifiers (size, variant)
 */
export interface EnumModifier {
  values: string[];
  default?: string | null;
  description?: string;
}

/**
 * Modifier definition for boolean modifiers (block, icon)
 */
export interface BooleanModifier {
  type: 'boolean';
  description?: string;
}

export type ModifierDef = EnumModifier | BooleanModifier;

/**
 * Component API definition
 */
export interface ComponentAPI {
  /** Component name (e.g., "button") */
  name: string;

  /** Base CSS class without prefix (e.g., "button") */
  baseClass: string;

  /** Default HTML element (e.g., "button", "div") */
  element: string;

  /** Component description */
  description: string;

  /** Modifier definitions */
  modifiers: Record<string, ModifierDef>;

  /** CSS pseudo-class states (e.g., ["hover", "focus", "disabled"]) */
  states?: string[];
}

/**
 * Type guard to check if modifier is boolean type
 */
export function isBooleanModifier(mod: ModifierDef): mod is BooleanModifier {
  return 'type' in mod && mod.type === 'boolean';
}

/**
 * Type guard to check if modifier is enum type
 */
export function isEnumModifier(mod: ModifierDef): mod is EnumModifier {
  return 'values' in mod && Array.isArray(mod.values);
}

/**
 * Get all CSS classes for a component from its API
 */
export function getAllClasses(api: ComponentAPI, prefix = 'ui-'): string[] {
  const classes: string[] = [`${prefix}${api.baseClass}`];

  for (const [name, mod] of Object.entries(api.modifiers)) {
    if (isBooleanModifier(mod)) {
      classes.push(`${prefix}${api.baseClass}--${name}`);
    } else if (isEnumModifier(mod)) {
      for (const value of mod.values) {
        classes.push(`${prefix}${api.baseClass}--${value}`);
      }
    }
  }

  return classes;
}
