import { defineCollection, type ImageFunction } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { REQUIRED_FIELDS } from './lib/required-fields';
import { headingProblem, markdownImages } from './lib/markdown';

// One file per entry: the file or folder name is the id, so ids can't be missing
// or duplicated, and a malformed file fails the build naming that file.

// The editor can save an untouched optional field as '' (older files, or a field
// cleared by hand); treat that as "not set" instead of failing the build.
const unsetIfEmpty = (v: unknown) => (v === '' ? undefined : v);
const optionalText = () => z.preprocess(unsetIfEmpty, z.string().min(1).optional());

const link = z.object({
  label: z.string().min(1),
  href: z.string().regex(/^(https:\/\/|\/|mailto:)/, 'href must be https://, /path or mailto:'),
});

const profileFields = z.object({
    label: z.string().min(1),
    researchLine: z.string().min(1),
    bio: z.tuple([z.string().min(1), z.string().min(1)]),
    caption: z.tuple([z.string().min(1), z.string().min(1)]),
    email: z.email(),
    github: z.string().regex(/^https:\/\//),
    orcid: z.string().regex(/^https:\/\//),
    cvPath: z.string().startsWith('/'),
    updated: z.string().min(1),
  });

const profile = defineCollection({
  loader: glob({ pattern: 'profile.yaml', base: './src/content/site' }),
  schema: profileFields,
});

const item = z.object({ label: z.string().min(1), text: z.string().min(1), emphasis: z.boolean().optional() });

// Typed blocks that make up a project page (spec §7.2). `type` is the discriminator,
// matching the editor's list-widget type key.
const blocks = (image: ImageFunction) =>
  z.discriminatedUnion('type', [
    z.object({
      type: z.literal('text'),
      heading: z.string().min(1),
      body: z.string().min(1).refine((md) => markdownImages(md).length === 0, {
        message: 'images go in a Figure section (with alt text and a caption), not inside a text section',
      }),
    }),
    z.object({ type: z.literal('steps'), items: z.array(item).min(2).max(4) }),
    z.object({ type: z.literal('timeline'), stages: z.array(item).min(2).max(4) }),
    z.object({
      type: z.literal('stats'),
      items: z.array(z.object({ value: z.string().min(1), label: z.string().min(1), muted: z.boolean().optional() })).min(2).max(4),
    }),
    z.object({ type: z.literal('figure'), image: image(), alt: z.string().min(1), caption: z.string().min(1) }),
    z.object({ type: z.literal('interactive'), name: z.enum(['practice-band']) }),
  ]);

const projectFields = (image: ImageFunction) =>
  z.object({
        title: z.string().min(1),
        shortName: optionalText(),
        kicker: optionalText(),
        summary: z.string().min(1),
        question: optionalText(),
        role: z.string().min(1),
        status: z.string().min(1),
        feature: z.boolean(),
        page: z.boolean().default(false),
        figure: z.preprocess(unsetIfEmpty, z.enum(['arts', 'praxis', 'homes', 'multiview']).optional()),
        figureCaption: optionalText(),
        authors: z.array(z.string().min(1)).optional(),
        self: optionalText(),
        minute: z.array(z.string().min(1)).optional(),
        links: z.array(link).default([]),
        citation: optionalText(),
        blocks: z.array(blocks(image)).default([]),
        order: z.number().int(),
        draft: z.boolean().default(false),
      });

const live = (p: { page: boolean; draft: boolean }) => p.page && !p.draft;

const projects = defineCollection({
  loader: glob({ pattern: '*/index.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    projectFields(image)
      .refine((p) => !p.feature || p.draft || (p.figure && p.kicker), {
        message: 'feature projects need both a figure and a kicker',
      })
      // Page rules apply once a page is published, so a draft can be saved half-written.
      .refine((p) => !live(p) || (p.figure && p.figureCaption && p.kicker && p.question && p.shortName), {
        message: 'page projects need figure, figureCaption, kicker, question and shortName',
      })
      .refine((p) => !live(p) || (p.authors && p.self && p.authors.includes(p.self)), {
        message: 'page projects need authors that include `self`',
      })
      .refine((p) => !live(p) || p.minute?.length === 3, {
        message: 'page projects need a one-minute summary (`minute`) of exactly 3 items',
      })
      .superRefine((p, ctx) => {
        const problem = headingProblem(p.blocks.flatMap((b) => (b.type === 'text' ? [b.heading] : [])));
        if (problem) ctx.addIssue({ code: 'custom', message: problem });
      }),
});

const newsFields = z.object({
  date: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'date must be YYYY-MM'),
  text: z.string().min(1),
  draft: z.boolean().default(false),
});

const news = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/news' }),
  schema: newsFields,
});

const publicationFields = z.object({
      type: z.enum(['journal', 'abstract', 'software']),
      status: optionalText(),
      title: z.string().min(1),
      authors: z.array(z.string().min(1)).default([]),
      self: z.string().min(1),
      venue: z.string().min(1),
      year: z.number().int(),
      links: z.array(link).default([]),
      selected: z.boolean(),
      order: z.number().int(),
      draft: z.boolean().default(false),
    });

const publications = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/publications' }),
  schema: publicationFields
    .refine((p) => p.type === 'software' || p.authors.includes(p.self), {
      message: '`self` must appear in `authors` (papers and abstracts need an author list)',
    }),
});

// REQUIRED_FIELDS must equal each schema's required (no default, not optional) keys,
// so the editor config built from it can't drift from what the build accepts.
function assertRequired(name: keyof typeof REQUIRED_FIELDS, shape: Record<string, z.ZodType>) {
  const actual = Object.keys(shape).filter((key) => !shape[key].safeParse(undefined).success).sort();
  const listed = [...REQUIRED_FIELDS[name]].sort();
  if (actual.join() !== listed.join()) {
    throw new Error(`src/lib/required-fields.ts: ${name} lists [${listed}] but the schema requires [${actual}]`);
  }
}
assertRequired('profile', profileFields.shape);
// Only the shape's keys matter here, so a placeholder stands in for Astro's image().
assertRequired('projects', projectFields((() => z.any()) as unknown as ImageFunction).shape);
assertRequired('news', newsFields.shape);
assertRequired('publications', publicationFields.shape);

export const collections = { profile, projects, news, publications };
