// Zod schemas for .content.yml files.
// Validates structure of component documentation content.

import { z } from 'zod';

// --- Example node (recursive) ---

interface ComponentNode {
  component: string;
  props?: Record<string, string | number | boolean>;
  icon?: string;
  text?: string;
  children?: ExampleNode[];
}

interface ElementNode {
  element: string;
  classes?: string[];
  attrs?: Record<string, string | number | boolean>;
  style?: Record<string, string>;
  icon?: string;
  text?: string;
  children?: ExampleNode[];
}

interface TextNode {
  text: string;
}

export type ExampleNode = ComponentNode | ElementNode | TextNode;

const propValueSchema = z.union([z.string(), z.number(), z.boolean()]);

export const exampleNodeSchema: z.ZodType<ExampleNode> = z.lazy(() =>
  z.union([
    z.object({
      component: z.string().min(1),
      props: z.record(z.string(), propValueSchema).optional(),
      icon: z.string().optional(),
      text: z.string().optional(),
      children: z.array(exampleNodeSchema).optional(),
    }),
    z.object({
      element: z.string().min(1),
      classes: z.array(z.string()).optional(),
      attrs: z.record(z.string(), propValueSchema).optional(),
      style: z.record(z.string(), z.string()).optional(),
      icon: z.string().optional(),
      text: z.string().optional(),
      children: z.array(exampleNodeSchema).optional(),
    }),
    z
      .object({
        text: z.string(),
      })
      .strict(),
  ]),
);

// --- Section types ---

const layoutSchema = z.enum(['row', 'column']);

export const autoSectionSchema = z.object({
  modifier: z.string().min(1),
  layout: layoutSchema.optional(),
  description: z.string().optional(),
  text: z.string().optional(),
  include_default: z.boolean().optional(),
  // TODO: revisit empty {} convention — consider include_default or implicit default
  combine: z.array(z.record(z.string(), propValueSchema)).optional(),
  template: exampleNodeSchema.optional(),
});

export const composeSectionSchema = z.object({
  layout: layoutSchema.optional(),
  description: z.string().optional(),
  examples: z.array(exampleNodeSchema).min(1),
});

export const fileSectionSchema = z.object({
  description: z.string().optional(),
  file: z.string().min(1),
});

export const sectionSchema = z.union([autoSectionSchema, composeSectionSchema, fileSectionSchema]);

export type AutoSection = z.infer<typeof autoSectionSchema>;
export type ComposeSection = z.infer<typeof composeSectionSchema>;
export type FileSection = z.infer<typeof fileSectionSchema>;
export type Section = z.infer<typeof sectionSchema>;

// --- Content file ---

export const contentFileSchema = z.object({
  description: z.string().min(1),
  sections: z.record(z.string(), sectionSchema),
});

export type ContentFile = z.infer<typeof contentFileSchema>;

// --- Shared descriptions ---

export const sharedDescriptionsSchema = z.object({
  descriptions: z.record(z.string(), z.string()),
});

export type SharedDescriptions = z.infer<typeof sharedDescriptionsSchema>;

// --- Section type guards ---

export function isAutoSection(section: Section): section is AutoSection {
  return 'modifier' in section;
}

export function isComposeSection(section: Section): section is ComposeSection {
  return 'examples' in section;
}

export function isFileSection(section: Section): section is FileSection {
  return 'file' in section;
}
