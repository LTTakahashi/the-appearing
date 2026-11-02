import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { yamlList } from './lib/yaml-list-loader';

const link = z.object({
  label: z.string().min(1),
  href: z.string().regex(/^(https:\/\/|\/|mailto:)/, 'href must be https://, /path or mailto:'),
});

const projects = defineCollection({
  loader: yamlList('src/data/projects.yaml'),
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

const news = defineCollection({
  loader: yamlList('src/data/news.yaml'),
  schema: z.object({
    date: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'date must be YYYY-MM'),
    text: z.string().min(1),
  }),
});

const publications = defineCollection({
  loader: yamlList('src/data/publications.yaml'),
  schema: z
    .object({
      type: z.enum(['journal', 'abstract', 'software']),
      status: z.string().optional(),
      title: z.string().min(1),
      authors: z.array(z.string().min(1)).default([]),
      self: z.string().min(1),
      venue: z.string().min(1),
      year: z.number().int(),
      links: z.array(link).default([]),
      selected: z.boolean(),
      order: z.number().int(),
    })
    .refine((p) => p.type === 'software' || p.authors.includes(p.self), {
      message: '`self` must appear in `authors` (papers and abstracts need an author list)',
    }),
});

export const collections = { projects, news, publications };
