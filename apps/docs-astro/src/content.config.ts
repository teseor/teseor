import { defineCollection, z } from 'astro:content';
import { loadAllDocs } from './lib/docs-loader';

const docs = defineCollection({
  loader: async () => {
    const entries = loadAllDocs();
    return entries.map((entry) => ({
      id: entry.id,
      title: entry.title,
      description: entry.description,
      type: entry.type,
      typePath: entry.typePath,
      group: entry.group,
      groupLabel: entry.groupLabel,
      weight: entry.weight,
      permalink: entry.permalink,
      apiData: entry.apiData,
      sections: entry.sections,
    }));
  },
  schema: z.object({
    title: z.string(),
    description: z.string().default(''),
    type: z.string(),
    typePath: z.string(),
    group: z.string().nullable(),
    groupLabel: z.string().nullable(),
    weight: z.number().nullable(),
    permalink: z.string(),
    apiData: z.record(z.unknown()).nullable(),
    sections: z.array(
      z.object({
        id: z.string(),
        layout: z.string().nullable(),
        rawHtml: z.string(),
      }),
    ),
  }),
});

export const collections = { docs };
