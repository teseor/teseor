// Loads and validates .content.yml files against api.json.
// Resolves $shared.* references from shared descriptions.

import { parse as parseYaml } from 'yaml';
import {
  type ContentFile,
  contentFileSchema,
  type ExampleNode,
  isAutoSection,
  isComposeSection,
  type Section,
  type SharedDescriptions,
  sharedDescriptionsSchema,
} from './content-schema.js';
import type { ApiJson } from './types.js';

export interface ValidationError {
  path: string;
  message: string;
}

export interface LoadResult {
  content: ContentFile;
  errors: ValidationError[];
}

// --- YAML parsing ---

export function parseContentYaml(yaml: string): ContentFile {
  const raw = parseYaml(yaml);
  return contentFileSchema.parse(raw);
}

export function parseSharedYaml(yaml: string): SharedDescriptions {
  const raw = parseYaml(yaml);
  return sharedDescriptionsSchema.parse(raw);
}

// --- Shared reference resolution ---

const SHARED_REF = /^\$shared\.(\w+)$/;

function resolveSharedRefs(content: ContentFile, shared: SharedDescriptions): ContentFile {
  const resolved = structuredClone(content);

  const descMatch = SHARED_REF.exec(resolved.description);
  if (descMatch) {
    const key = descMatch[1];
    if (key in shared.descriptions) {
      resolved.description = shared.descriptions[key];
    }
  }

  for (const section of Object.values(resolved.sections)) {
    if ('description' in section && section.description) {
      const match = SHARED_REF.exec(section.description);
      if (match) {
        const key = match[1];
        if (key in shared.descriptions) {
          section.description = shared.descriptions[key];
        }
      }
    }
  }

  return resolved;
}

// --- Cross-validation against api.json ---

export function validateContent(
  content: ContentFile,
  api: ApiJson,
  shared: SharedDescriptions,
  knownComponents: Set<string>,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const apiModifiers = new Set(Object.keys(api.modifiers));
  const coveredModifiers = new Set<string>();

  for (const [sectionName, section] of Object.entries(content.sections)) {
    validateSection(sectionName, section, apiModifiers, coveredModifiers, knownComponents, errors);
  }

  // Check shared refs
  validateSharedRefs(content, shared, errors);

  // Check modifier coverage
  for (const mod of apiModifiers) {
    if (!coveredModifiers.has(mod)) {
      const modDef = api.modifiers[mod];
      if (modDef.visibility === 'internal') continue;
      errors.push({
        path: `sections`,
        message: `modifier '${mod}' from api.json is not documented. Add an auto section or mark as @nodoc in SCSS.`,
      });
    }
  }

  return errors;
}

function validateSection(
  name: string,
  section: Section,
  apiModifiers: Set<string>,
  coveredModifiers: Set<string>,
  knownComponents: Set<string>,
  errors: ValidationError[],
): void {
  if (isAutoSection(section)) {
    if (!apiModifiers.has(section.modifier)) {
      errors.push({
        path: `sections.${name}.modifier`,
        message: `modifier '${section.modifier}' does not exist in api.json. Available: ${[...apiModifiers].join(', ')}`,
      });
    } else {
      coveredModifiers.add(section.modifier);
    }

    if (section.combine) {
      for (const combo of section.combine) {
        for (const key of Object.keys(combo)) {
          if (!apiModifiers.has(key)) {
            errors.push({
              path: `sections.${name}.combine`,
              message: `combine key '${key}' is not a valid modifier. Available: ${[...apiModifiers].join(', ')}`,
            });
          }
        }
      }
    }

    if (section.template) {
      validateNodeComponents(
        section.template,
        `sections.${name}.template`,
        knownComponents,
        errors,
      );
    }
  }

  if (isComposeSection(section)) {
    for (let i = 0; i < section.examples.length; i++) {
      validateNodeComponents(
        section.examples[i],
        `sections.${name}.examples[${i}]`,
        knownComponents,
        errors,
      );
    }
  }
}

function validateNodeComponents(
  node: ExampleNode,
  path: string,
  knownComponents: Set<string>,
  errors: ValidationError[],
): void {
  if ('component' in node) {
    if (!knownComponents.has(node.component)) {
      errors.push({
        path,
        message: `unknown component '${node.component}'. Not found in any api.json.`,
      });
    }
    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        validateNodeComponents(node.children[i], `${path}.children[${i}]`, knownComponents, errors);
      }
    }
  }
  if ('element' in node && node.children) {
    for (let i = 0; i < node.children.length; i++) {
      validateNodeComponents(node.children[i], `${path}.children[${i}]`, knownComponents, errors);
    }
  }
}

function validateSharedRefs(
  content: ContentFile,
  shared: SharedDescriptions,
  errors: ValidationError[],
): void {
  const check = (value: string | undefined, path: string) => {
    if (!value) return;
    const match = SHARED_REF.exec(value);
    if (match && !(match[1] in shared.descriptions)) {
      errors.push({
        path,
        message: `shared reference '$shared.${match[1]}' not found in shared.yml`,
      });
    }
  };

  check(content.description, 'description');
  for (const [name, section] of Object.entries(content.sections)) {
    if ('description' in section) {
      check(section.description, `sections.${name}.description`);
    }
  }
}

// --- Component name helpers ---

function toPascalCase(kebab: string): string {
  return kebab
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

function addComponentNames(
  name: string,
  elements: Record<string, unknown> | undefined,
  names: Set<string>,
): void {
  names.add(toPascalCase(name));
  if (elements) {
    for (const elemName of Object.keys(elements)) {
      names.add(`${toPascalCase(name)}${toPascalCase(elemName)}`);
    }
  }
}

export function buildComponentNameSet(apis: ApiJson[]): Set<string> {
  const names = new Set<string>();
  for (const api of apis) {
    addComponentNames(api.name, api.elements, names);
    if (api.relatedComponents) {
      for (const rel of api.relatedComponents) {
        addComponentNames(rel.name, rel.elements, names);
      }
    }
  }
  return names;
}

// --- Full load pipeline ---

export function loadContent(
  yamlStr: string,
  api: ApiJson,
  sharedYamlStr: string,
  allApis: ApiJson[],
): LoadResult {
  const shared = parseSharedYaml(sharedYamlStr);
  const content = parseContentYaml(yamlStr);
  const resolved = resolveSharedRefs(content, shared);
  const knownComponents = buildComponentNameSet(allApis);
  const errors = validateContent(resolved, api, shared, knownComponents);
  return { content: resolved, errors };
}
