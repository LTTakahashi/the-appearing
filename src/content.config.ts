import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// One file per entry: the file or folder name is the id, so ids can't be missing
// or duplicated, and a malformed file fails the build naming that file.

const link = z.object({
  label: z.string().min(1),
  href: z.string().regex(/^(https:\/\/|\/|mailto:)/, 'href must be https://, /path or mailto:'),
});

const profile = defineCollection({
  loader: glob({ pattern: 'profile.yaml', base: './src/content/site' }),
  schema: z.object({
    label: z.string().min(1),
    researchLine: z.string().min(1),
    bio: z.tuple([z.string().min(1), z.string().min(1)]),
    caption: z.tuple([z.string().min(1), z.string().min(1)]),
    email: z.string().email(),
    github: z.string().regex(/^https:\/\//),
    orcid: z.string().regex(/^https:\/\//),
    cvPath: z.string().startsWith('/'),
    updated: z.string().min(1),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '*/index.md', base: './src/content/projects' }),
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
      draft: z.boolean().default(false),
    })
    .refine((p) => !p.feature || (p.figure && p.kicker), {
      message: 'feature projects need both a figure and a kicker',
    }),
});

const news = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/news' }),
  schema: z.object({
    date: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'date must be YYYY-MM'),
    text: z.string().min(1),
    draft: z.boolean().default(false),
  }),
});

const publications = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/publications' }),
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
      draft: z.boolean().default(false),
    })
    .refine((p) => p.type === 'software' || p.authors.includes(p.self), {
      message: '`self` must appear in `authors` (papers and abstracts need an author list)',
    }),
});

export const collections = { profile, projects, news, publications };
