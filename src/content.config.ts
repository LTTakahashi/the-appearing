import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

const link = z.object({
  label: z.string().min(1),
  href: z.string().regex(/^(https:\/\/|\/|mailto:)/, 'href must be https://, /path or mailto:'),
});

const projects = defineCollection({
  loader: file('src/data/projects.yaml'),
  schema: z
    .object({
      title: z.string().min(1),
      kicker: z.string().optional(),
      summary: z.string().min(1),
      role: z.string().min(1),
      status: z.string().min(1),
      feature: z.boolean(),
      figure: z.enum(['arts', 'praxis', 'homes']).optional(),
      links: z.array(link).default([]),
      order: z.number().int(),
    })
    .refine((p) => !p.feature || (p.figure && p.kicker), {
      message: 'feature projects need both a figure and a kicker',
    }),
});

export const collections = { projects };
